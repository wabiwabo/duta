import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
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
} from './dto/admin.dto';

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
}
