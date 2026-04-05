import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  NotFoundException,
  UseGuards,
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
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { ClipperScoringService } from '../../../domain/clipper/clipper-scoring.service';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { Public } from '../../../shared/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import {
  ClipperScoreDto,
  LeaderboardResponseDto,
  RecalculateResponseDto,
  ClipperProfileDto,
  ClipperDirectoryResponseDto,
  ClipperDirectoryQueryDto,
  CampaignLeaderboardResponseDto,
  CampaignAnalyticsDto,
  BatchReviewClipsDto,
  BatchReviewResultDto,
} from './dto/clipper.dto';
import { CampaignResponseDto } from '../campaign/dto/campaign-response.dto';

@ApiTags('Clipper')
@Controller()
export class ClipperController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clipperScoringService: ClipperScoringService,
  ) {}

  @Public()
  @Get('clippers')
  @ApiOperation({ summary: 'Browse clipper directory (public, paginated)' })
  @ApiOkResponse({ type: ClipperDirectoryResponseDto })
  async listClippers(
    @Query() query: ClipperDirectoryQueryDto,
  ): Promise<ClipperDirectoryResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { role: 'clipper' };
    if (query.tier) where['clipperTier'] = query.tier;
    if (query.niche) where['nicheTags'] = { has: query.niche };

    let orderBy: Record<string, string> = { clipperScore: 'desc' };
    if (query.sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          nicheTags: true,
          clipperScore: true,
          clipperTier: true,
          createdAt: true,
          reviewsReceived: {
            select: { rating: true },
          },
          clips: {
            where: { status: 'approved' },
            select: { id: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = users.map((u) => {
      const ratings = u.reviewsReceived.map((r) => r.rating);
      const averageRating = ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

      return {
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        nicheTags: u.nicheTags,
        clipperScore: u.clipperScore,
        clipperTier: u.clipperTier,
        averageRating: Math.round(averageRating * 10) / 10,
        totalClips: u.clips.length,
        createdAt: u.createdAt,
      };
    });

    // Sort by rating if requested (post-fetch since rating is computed)
    if (query.sortBy === 'rating') {
      data.sort((a, b) => b.averageRating - a.averageRating);
    }

    return { data, total, page };
  }

  @Public()
  @Get('clippers/leaderboard')
  @ApiOperation({ summary: 'Get top 20 clippers by score (public)' })
  @ApiOkResponse({ type: LeaderboardResponseDto })
  async getLeaderboard(): Promise<LeaderboardResponseDto> {
    const clippers = await this.prisma.user.findMany({
      where: { role: 'clipper' },
      orderBy: { clipperScore: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        clipperScore: true,
        clipperTier: true,
      },
    });

    return {
      data: clippers.map((c) => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.avatarUrl,
        clipperScore: c.clipperScore,
        clipperTier: c.clipperTier,
      })),
    };
  }

  @Public()
  @Get('clippers/:id/score')
  @ApiOperation({ summary: 'Get clipper score and tier (public)' })
  @ApiOkResponse({ type: ClipperScoreDto })
  async getClipperScore(@Param('id') id: string): Promise<ClipperScoreDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, clipperScore: true, clipperTier: true },
    });

    if (!user) throw new NotFoundException('Clipper not found');
    if (user.role !== 'clipper') throw new NotFoundException('Clipper not found');

    return {
      userId: user.id,
      score: user.clipperScore,
      tier: user.clipperTier,
    };
  }

  @Public()
  @Get('clippers/:id')
  @ApiOperation({ summary: 'Get full public clipper profile' })
  @ApiOkResponse({ type: ClipperProfileDto })
  async getClipperProfile(@Param('id') id: string): Promise<ClipperProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        clips: {
          where: { status: 'approved' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            campaign: { select: { id: true, title: true, type: true } },
          },
        },
        reviewsReceived: { select: { rating: true } },
      },
    });

    if (!user) throw new NotFoundException('Clipper not found');
    if (user.role !== 'clipper') throw new NotFoundException('Clipper not found');

    const approvedClips = await this.prisma.clip.findMany({
      where: { clipperId: id, status: 'approved' },
      select: { viewsVerified: true, earningsAmount: true, campaignId: true },
    });

    const totalViews = approvedClips.reduce((sum, c) => sum + c.viewsVerified, 0);
    const totalCampaigns = new Set(approvedClips.map((c) => c.campaignId)).size;
    const ratings = user.reviewsReceived.map((r) => r.rating);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    const recentClips = user.clips.map((c) => ({
      id: c.id,
      campaignTitle: c.campaign?.title ?? 'Unknown',
      platform: c.platform,
      views: c.viewsVerified,
      earnings: c.earningsAmount,
    }));

    return {
      id: user.id,
      name: user.name,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      nicheTags: user.nicheTags,
      clipperScore: user.clipperScore,
      clipperTier: user.clipperTier,
      createdAt: user.createdAt,
      stats: {
        totalClips: approvedClips.length,
        totalViews,
        totalCampaigns,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      recentClips,
    };
  }

  @Public()
  @Get('campaigns/:id/leaderboard')
  @ApiOperation({ summary: 'Get top 10 clippers for a campaign by verified views (public)' })
  @ApiOkResponse({ type: CampaignLeaderboardResponseDto })
  async getCampaignLeaderboard(
    @Param('id') campaignId: string,
  ): Promise<CampaignLeaderboardResponseDto> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const clips = await this.prisma.clip.findMany({
      where: { campaignId, status: 'approved' },
      include: {
        clipper: {
          select: { id: true, name: true, avatarUrl: true, clipperTier: true },
        },
      },
    });

    // Aggregate by clipper
    const map = new Map<
      string,
      { clipper: { id: string; name: string; avatarUrl: string | null; clipperTier: string }; views: number; count: number }
    >();
    for (const clip of clips) {
      const existing = map.get(clip.clipperId);
      if (existing) {
        existing.views += clip.viewsVerified;
        existing.count += 1;
      } else {
        map.set(clip.clipperId, {
          clipper: clip.clipper,
          views: clip.viewsVerified,
          count: 1,
        });
      }
    }

    const sorted = Array.from(map.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return {
      data: sorted.map((entry, idx) => ({
        rank: idx + 1,
        clipperId: entry.clipper.id,
        clipperName: entry.clipper.name,
        clipperAvatar: entry.clipper.avatarUrl,
        clipperTier: entry.clipper.clipperTier,
        views: entry.views,
        clipsCount: entry.count,
      })),
    };
  }

  @ApiBearerAuth()
  @Get('campaigns/:id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics (owner only)' })
  @ApiOkResponse({ type: CampaignAnalyticsDto })
  async getCampaignAnalytics(
    @Param('id') campaignId: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<CampaignAnalyticsDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== user.id) throw new ForbiddenException('Not the campaign owner');

    const clips = await this.prisma.clip.findMany({
      where: { campaignId },
      include: {
        clipper: { select: { name: true } },
      },
    });

    const totalViews = clips.reduce((sum, c) => sum + c.viewsVerified, 0);
    const totalClips = clips.length;
    const totalEarnings = clips.reduce((sum, c) => sum + c.earningsAmount, 0);
    const budgetUtilizationPct =
      campaign.budgetTotal > 0
        ? Math.round((campaign.budgetSpent / campaign.budgetTotal) * 100)
        : 0;

    // Views over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentClips = clips.filter((c) => c.createdAt >= thirtyDaysAgo);
    const dailyMap = new Map<string, number>();
    for (const clip of recentClips) {
      const dateStr = clip.createdAt.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) ?? 0) + clip.viewsVerified);
    }
    const viewsOverTime = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, views]) => ({ date, views }));

    // Top 5 clips by views
    const topClips = [...clips]
      .sort((a, b) => b.viewsVerified - a.viewsVerified)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        platform: c.platform,
        views: c.viewsVerified,
        earnings: c.earningsAmount,
        clipperName: c.clipper.name,
      }));

    // Top 5 platforms by views
    const platformMap = new Map<string, number>();
    for (const clip of clips) {
      const platform = clip.platform ?? 'unknown';
      platformMap.set(platform, (platformMap.get(platform) ?? 0) + clip.viewsVerified);
    }
    const topPlatforms = Array.from(platformMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([platform, views]) => ({ platform, views }));

    return {
      totalViews,
      totalClips,
      totalEarnings,
      budgetUtilizationPct,
      viewsOverTime,
      topClips,
      topPlatforms,
    };
  }

  @ApiBearerAuth()
  @Post('campaigns/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a campaign as new draft (owner only)' })
  @ApiCreatedResponse({ type: CampaignResponseDto })
  async duplicateCampaign(
    @Param('id') campaignId: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<CampaignResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { owner: { select: { id: true, name: true, avatarUrl: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== user.id) throw new ForbiddenException('Not the campaign owner');

    const newCampaign = await this.prisma.campaign.create({
      data: {
        ownerId: user.id,
        type: campaign.type,
        title: `${campaign.title} (Copy)`,
        description: campaign.description,
        guidelines: campaign.guidelines,
        sourceType: campaign.sourceType,
        sourceUrl: campaign.sourceUrl,
        ratePerKViews: campaign.ratePerKViews,
        budgetTotal: campaign.budgetTotal,
        targetPlatforms: campaign.targetPlatforms,
        deadline: campaign.deadline,
        status: 'draft',
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { clips: true } },
      },
    });

    return {
      id: newCampaign.id,
      ownerId: newCampaign.ownerId,
      type: newCampaign.type,
      title: newCampaign.title,
      description: newCampaign.description,
      guidelines: newCampaign.guidelines,
      sourceType: newCampaign.sourceType,
      sourceUrl: newCampaign.sourceUrl,
      sourceFileKey: newCampaign.sourceFileKey,
      sourceMetadata: newCampaign.sourceMetadata,
      ratePerKViews: newCampaign.ratePerKViews,
      budgetTotal: newCampaign.budgetTotal,
      budgetSpent: newCampaign.budgetSpent,
      budgetRemaining: newCampaign.budgetTotal - newCampaign.budgetSpent,
      targetPlatforms: newCampaign.targetPlatforms,
      status: newCampaign.status,
      deadline: newCampaign.deadline,
      createdAt: newCampaign.createdAt,
      updatedAt: newCampaign.updatedAt,
      owner: newCampaign.owner,
      clipCount: newCampaign._count.clips,
    };
  }

  @ApiBearerAuth()
  @Patch('clips/batch-review')
  @ApiOperation({ summary: 'Batch approve/reject multiple clips (campaign owner only)' })
  @ApiOkResponse({ type: BatchReviewResultDto })
  async batchReviewClips(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: BatchReviewClipsDto,
  ): Promise<BatchReviewResultDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!dto.clipIds || dto.clipIds.length === 0) {
      throw new BadRequestException('clipIds must not be empty');
    }

    // Fetch all clips with their campaign info to verify ownership
    const clips = await this.prisma.clip.findMany({
      where: { id: { in: dto.clipIds } },
      include: {
        campaign: { select: { ownerId: true } },
      },
    });

    // Verify all clips belong to campaigns owned by the current user
    const unauthorized = clips.filter((c) => c.campaign?.ownerId !== user.id);
    if (unauthorized.length > 0) {
      throw new ForbiddenException('You can only review clips from your own campaigns');
    }

    const status = dto.action === 'approve' ? 'approved' : 'rejected';

    await this.prisma.clip.updateMany({
      where: { id: { in: dto.clipIds } },
      data: {
        status,
        reviewFeedback: dto.feedback ?? null,
        reviewedAt: new Date(),
      },
    });

    return {
      updated: clips.length,
      updatedIds: clips.map((c) => c.id),
    };
  }

  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @Post('admin/recalculate-scores')
  @ApiOperation({ summary: 'Trigger recalculation of all clipper scores (admin only)' })
  @ApiOkResponse({ type: RecalculateResponseDto })
  async recalculateScores(): Promise<RecalculateResponseDto> {
    const updated = await this.clipperScoringService.recalculateAll();
    return { updated };
  }
}
