import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { EscrowService } from '../../../domain/payment/escrow.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { DepositDto } from './dto/deposit.dto';
import { VerifyViewsDto } from './dto/verify-views.dto';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller()
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  @Post('campaigns/:id/deposit')
  @ApiOperation({ summary: 'Create a deposit invoice for a campaign (owner only, min Rp 50.000)' })
  @ApiCreatedResponse({
    description: 'Invoice created',
    schema: {
      properties: {
        invoiceUrl: { type: 'string' },
        transactionId: { type: 'string' },
      },
    },
  })
  async depositToCampaign(
    @Param('id') campaignId: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: DepositDto,
  ): Promise<{ invoiceUrl: string; transactionId: string }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== user.id) {
      throw new ForbiddenException('Only the campaign owner can deposit funds');
    }

    return this.escrowService.deposit(campaignId, dto.amount, user.id);
  }

  @Get('campaigns/:id/escrow')
  @ApiOperation({ summary: 'Get escrow status for a campaign (owner only)' })
  @ApiOkResponse({
    description: 'Escrow account details',
    schema: {
      properties: {
        id: { type: 'string' },
        campaignId: { type: 'string' },
        totalDeposited: { type: 'number' },
        totalReleased: { type: 'number' },
        totalRefunded: { type: 'number' },
        balance: { type: 'number' },
        status: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getEscrow(
    @Param('id') campaignId: string,
    @CurrentUser() authUser: AuthUser,
  ) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== user.id) {
      throw new ForbiddenException('Only the campaign owner can view escrow details');
    }

    return this.escrowService.getEscrow(campaignId);
  }

  @Post('clips/:id/verify-views')
  @ApiOperation({ summary: 'Set verified views for a clip and release earnings (admin only for MVP)' })
  @ApiOkResponse({
    description: 'Views verified and earnings released',
    schema: {
      properties: {
        clipId: { type: 'string' },
        viewsVerified: { type: 'number' },
        earningsAmount: { type: 'number' },
      },
    },
  })
  async verifyClipViews(
    @Param('id') clipId: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: VerifyViewsDto,
  ): Promise<{ clipId: string; viewsVerified: number; earningsAmount: number }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'admin') {
      throw new ForbiddenException('Only admins can verify views');
    }

    const clip = await this.prisma.clip.findUnique({ where: { id: clipId } });
    if (!clip) throw new NotFoundException('Clip not found');
    if (clip.status !== 'approved') {
      throw new ForbiddenException('Only approved clips can have views verified');
    }

    // Set verified views
    await this.prisma.clip.update({
      where: { id: clipId },
      data: { viewsVerified: dto.views },
    });

    // Release earnings from escrow
    await this.escrowService.releaseForClip(clipId);

    // Fetch updated clip for response
    const updatedClip = await this.prisma.clip.findUnique({ where: { id: clipId } });

    this.logger.log(`Views verified: clipId=${clipId} views=${dto.views} earnings=${updatedClip!.earningsAmount}`);

    return {
      clipId,
      viewsVerified: dto.views,
      earningsAmount: updatedClip!.earningsAmount,
    };
  }
}
