import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { XenditService } from '../../../infrastructure/payment/xendit.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { EarningsSummaryDto } from './dto/earnings-summary.dto';
import {
  TransactionResponseDto,
  TransactionListResponseDto,
} from './dto/transaction-response.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { WithdrawalDto } from './dto/withdrawal.dto';

function mapTransaction(tx: {
  id: string;
  type: string;
  fromUserId: string | null;
  toUserId: string | null;
  campaignId: string | null;
  clipId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: Date;
  campaign?: { id: string; title: string } | null;
  clip?: { id: string; postedUrl: string | null } | null;
}): TransactionResponseDto {
  return {
    id: tx.id,
    type: tx.type,
    fromUserId: tx.fromUserId,
    toUserId: tx.toUserId,
    campaignId: tx.campaignId,
    clipId: tx.clipId,
    amount: tx.amount,
    currency: tx.currency,
    status: tx.status,
    paymentMethod: tx.paymentMethod,
    paymentReference: tx.paymentReference,
    createdAt: tx.createdAt,
    campaign: tx.campaign ?? null,
    clip: tx.clip ?? null,
  };
}

@ApiTags('Earnings')
@ApiBearerAuth()
@Controller()
export class EarningsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xendit: XenditService,
  ) {}

  @Get('earnings')
  @ApiOperation({ summary: 'Get earnings summary for current clipper' })
  @ApiOkResponse({ type: EarningsSummaryDto })
  async getEarnings(@CurrentUser() authUser: AuthUser): Promise<EarningsSummaryDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'clipper') throw new ForbiddenException('Only clippers can view earnings');

    const [completedPayouts, pendingPayouts, completedWithdrawals] = await Promise.all([
      // earned = sum of completed payouts received
      this.prisma.transaction.aggregate({
        where: { toUserId: user.id, type: 'payout', status: 'completed' },
        _sum: { amount: true },
      }),
      // pending = sum of pending payouts
      this.prisma.transaction.aggregate({
        where: { toUserId: user.id, type: 'payout', status: 'pending' },
        _sum: { amount: true },
      }),
      // withdrawn = sum of completed withdrawal transactions (type payout, status processing/completed with paymentMethod set)
      this.prisma.transaction.aggregate({
        where: {
          fromUserId: user.id,
          type: 'payout',
          status: { in: ['processing', 'completed'] },
          paymentMethod: { not: null },
        },
        _sum: { amount: true },
      }),
    ]);

    const earned = completedPayouts._sum.amount ?? 0;
    const pending = pendingPayouts._sum.amount ?? 0;
    const withdrawn = completedWithdrawals._sum.amount ?? 0;
    const available = earned - withdrawn;

    return { earned, pending, available, withdrawn };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions for current user (both sent and received)' })
  @ApiOkResponse({ type: TransactionListResponseDto })
  async listTransactions(
    @CurrentUser() authUser: AuthUser,
    @Query() query: TransactionQueryDto,
  ): Promise<TransactionListResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const baseFilter: Record<string, unknown> = {};
    if (query.type) baseFilter.type = query.type;
    if (query.status) baseFilter.status = query.status;

    const where = {
      OR: [{ fromUserId: user.id }, { toUserId: user.id }],
      ...baseFilter,
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: { select: { id: true, title: true } },
          clip: { select: { id: true, postedUrl: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map((tx) => mapTransaction(tx)),
      total,
      page,
    };
  }

  @Post('withdrawals')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Request a withdrawal (clipper only, minimum Rp 50.000)' })
  @ApiCreatedResponse({ type: TransactionResponseDto })
  async requestWithdrawal(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: WithdrawalDto,
  ): Promise<TransactionResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'clipper') throw new ForbiddenException('Only clippers can withdraw');

    // Check available balance
    const [completedPayouts, completedWithdrawals] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { toUserId: user.id, type: 'payout', status: 'completed' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          fromUserId: user.id,
          type: 'payout',
          status: { in: ['processing', 'completed'] },
          paymentMethod: { not: null },
        },
        _sum: { amount: true },
      }),
    ]);

    const earned = completedPayouts._sum.amount ?? 0;
    const withdrawn = completedWithdrawals._sum.amount ?? 0;
    const available = earned - withdrawn;

    if (available < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: Rp ${available.toLocaleString('id-ID')}, Requested: Rp ${dto.amount.toLocaleString('id-ID')}`,
      );
    }

    const externalId = `payout-withdrawal-${user.id}-${Date.now()}`;

    // Create Xendit disbursement
    const { disbursementId } = await this.xendit.createDisbursement({
      externalId,
      amount: dto.amount,
      bankCode: dto.bankCode,
      accountNumber: dto.accountNumber,
      accountHolderName: dto.accountHolderName,
      description: `Withdrawal for clipper ${user.name}`,
    });

    // Create transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        type: 'payout',
        fromUserId: user.id,
        amount: dto.amount,
        currency: 'IDR',
        status: 'processing',
        paymentMethod: dto.bankCode,
        paymentReference: disbursementId,
      },
      include: {
        campaign: { select: { id: true, title: true } },
        clip: { select: { id: true, postedUrl: true } },
      },
    });

    return mapTransaction(transaction);
  }
}
