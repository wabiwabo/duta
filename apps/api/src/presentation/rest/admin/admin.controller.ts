import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import {
  AdminUserQueryDto,
  AdminCampaignQueryDto,
  AdminUserActionDto,
  AdminUserAction,
  AdminUserListResponseDto,
  AdminCampaignListResponseDto,
  AdminStatsDto,
  AdminUserResponseDto,
  AdminMetricsDto,
} from './dto/admin.dto';

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row =>
    headers.map(h => {
      const val = row[h] ?? '';
      const str = String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users with optional role/kycStatus filter' })
  @ApiOkResponse({ type: AdminUserListResponseDto })
  async listUsers(@Query() query: AdminUserQueryDto): Promise<AdminUserListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.role) where['role'] = query.role;
    if (query.kycStatus) where['kycStatus'] = query.kycStatus;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          kycStatus: true,
          bio: true,
          avatarUrl: true,
          clipperScore: true,
          verificationTier: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users as AdminUserResponseDto[], total, page };
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'List all campaigns with optional status filter' })
  @ApiOkResponse({ type: AdminCampaignListResponseDto })
  async listCampaigns(
    @Query() query: AdminCampaignQueryDto,
  ): Promise<AdminCampaignListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          ownerId: true,
          type: true,
          title: true,
          status: true,
          budgetTotal: true,
          budgetSpent: true,
          deadline: true,
          createdAt: true,
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return { data: campaigns, total, page };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  @ApiOkResponse({ type: AdminStatsDto })
  async getStats(): Promise<AdminStatsDto> {
    const [
      totalUsers,
      totalClippers,
      totalOwners,
      totalCampaigns,
      activeCampaigns,
      totalClips,
      escrowAgg,
      feeAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'clipper' } }),
      this.prisma.user.count({ where: { role: 'owner' } }),
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'active' } }),
      this.prisma.clip.count(),
      this.prisma.escrowAccount.aggregate({ _sum: { totalDeposited: true } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'fee', status: 'completed' },
      }),
    ]);

    return {
      totalUsers,
      totalClippers,
      totalOwners,
      totalCampaigns,
      activeCampaigns,
      totalClips,
      gmv: escrowAgg._sum.totalDeposited ?? 0,
      revenue: feeAgg._sum.amount ?? 0,
    };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Perform an admin action on a user (ban/suspend/activate/verify_kyc)' })
  @ApiOkResponse({ type: Object })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUserActionDto,
  ): Promise<AdminUserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: Record<string, unknown> = {};

    switch (dto.action) {
      case AdminUserAction.ban:
        // Store ban status — we repurpose kycStatus to 'rejected' as a signal
        // but we also use a dedicated approach: mark role update is not appropriate,
        // so we set emailVerified false and kycStatus 'rejected' as ban markers.
        // A real implementation might add a `bannedAt` field; for now we record it.
        updateData['kycStatus'] = 'rejected';
        updateData['emailVerified'] = false;
        break;
      case AdminUserAction.suspend:
        updateData['emailVerified'] = false;
        break;
      case AdminUserAction.activate:
        updateData['emailVerified'] = true;
        break;
      case AdminUserAction.verify_kyc:
        updateData['kycStatus'] = 'verified';
        break;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        kycStatus: true,
        bio: true,
        avatarUrl: true,
        clipperScore: true,
        verificationTier: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return updated as AdminUserResponseDto;
  }

  // ─── CSV Exports ─────────────────────────────────────────────────────────────

  @Get('export/users')
  @ApiOperation({ summary: 'Export all users as CSV' })
  async exportUsers(@Res() res: Response): Promise<void> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        verificationTier: true,
        clipperTier: true,
        createdAt: true,
      },
    });

    const headers = ['id', 'name', 'email', 'role', 'verificationTier', 'clipperTier', 'createdAt'];
    const csv = toCsv(headers, users as Record<string, unknown>[]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
    res.send(csv);
  }

  @Get('export/campaigns')
  @ApiOperation({ summary: 'Export all campaigns as CSV' })
  async exportCampaigns(@Res() res: Response): Promise<void> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        budgetTotal: true,
        budgetSpent: true,
        createdAt: true,
        owner: { select: { name: true } },
        _count: { select: { clips: true } },
      },
    });

    const headers = ['id', 'title', 'type', 'status', 'ownerName', 'budgetTotal', 'budgetSpent', 'clipCount', 'createdAt'];
    const rows = campaigns.map(c => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      ownerName: c.owner.name,
      budgetTotal: c.budgetTotal,
      budgetSpent: c.budgetSpent,
      clipCount: c._count.clips,
      createdAt: c.createdAt,
    }));

    const csv = toCsv(headers, rows as Record<string, unknown>[]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=campaigns-export.csv');
    res.send(csv);
  }

  @Get('export/transactions')
  @ApiOperation({ summary: 'Export all transactions as CSV' })
  async exportTransactions(@Res() res: Response): Promise<void> {
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        fromUserId: true,
        toUserId: true,
        campaignId: true,
        createdAt: true,
      },
    });

    const headers = ['id', 'type', 'amount', 'status', 'fromUserId', 'toUserId', 'campaignId', 'createdAt'];
    const csv = toCsv(headers, transactions as Record<string, unknown>[]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions-export.csv');
    res.send(csv);
  }

  // ─── Real-Time Metrics ────────────────────────────────────────────────────────

  @Get('metrics')
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  @ApiOkResponse({ type: AdminMetricsDto })
  async getMetrics(): Promise<AdminMetricsDto> {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCampaigns,
      activeCampaigns,
      totalClips,
      approvedClips,
      gmvAgg,
      escrowAgg,
      newUsersToday,
      newUsersThisWeek,
      clipsThisWeek,
      clipPlatforms,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.campaign.count(),
      this.prisma.campaign.count({ where: { status: 'active' } }),
      this.prisma.clip.count(),
      this.prisma.clip.count({ where: { status: 'approved' } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'payout', status: 'completed' },
      }),
      this.prisma.escrowAccount.aggregate({ _sum: { totalDeposited: true, totalReleased: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayMidnight } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.clip.count({ where: { submittedAt: { gte: sevenDaysAgo } } }),
      this.prisma.clip.groupBy({
        by: ['platform'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
    ]);

    const totalDeposited = escrowAgg._sum.totalDeposited ?? 0;
    const totalReleased = escrowAgg._sum.totalReleased ?? 0;
    const totalEscrowBalance = totalDeposited - totalReleased;
    const totalGmv = gmvAgg._sum.amount ?? 0;
    const conversionRate = totalClips > 0 ? approvedClips / totalClips : 0;
    const topPlatform = clipPlatforms.length > 0 ? (clipPlatforms[0].platform ?? null) : null;

    return {
      totalUsers,
      totalCampaigns,
      activeCampaigns,
      totalClips,
      totalGmv,
      totalEscrowBalance,
      newUsersToday,
      newUsersThisWeek,
      clipsThisWeek,
      conversionRate,
      topPlatform,
    };
  }
}
