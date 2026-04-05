import {
  Controller,
  Get,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import {
  CreatorAnalyticsDto,
  ClipperAnalyticsDto,
  PlatformAnalyticsDto,
  DailyDataPointDto,
  NicheStatDto,
} from './dto/analytics.dto';

// Build a map of date -> value for the last 30 days, filling gaps with 0
function buildDailyTrend(
  records: { date: Date; value: number }[],
): DailyDataPointDto[] {
  const today = new Date();
  const result: DailyDataPointDto[] = [];
  const byDate = new Map<string, number>();

  for (const r of records) {
    const key = r.date.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + r.value);
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, value: byDate.get(key) ?? 0 });
  }

  return result;
}

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /analytics/creator ────────────────────────────────────────────────

  @Get('creator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creator analytics: views trend, GMV, top niches, top campaigns' })
  @ApiOkResponse({ type: CreatorAnalyticsDto })
  async getCreatorAnalytics(
    @CurrentUser() authUser: AuthUser,
  ): Promise<CreatorAnalyticsDto> {
    const user = await this.prisma.user.findUnique({
      where: { logtoId: authUser.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'owner') {
      throw new ForbiddenException('Only creators can access creator analytics');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all campaigns by this creator
    const campaigns = await this.prisma.campaign.findMany({
      where: { ownerId: user.id },
      select: { id: true, title: true, status: true },
    });
    const campaignIds = campaigns.map((c) => c.id);

    // Get all approved clips across creator's campaigns
    const clips = await this.prisma.clip.findMany({
      where: { campaignId: { in: campaignIds }, status: 'approved' },
      select: {
        id: true,
        campaignId: true,
        viewsVerified: true,
        earningsAmount: true,
        submittedAt: true,
      },
    });

    // Views trend (last 30 days, based on clip submission date)
    const recentClips = clips.filter((c) => c.submittedAt >= thirtyDaysAgo);
    const viewsTrend = buildDailyTrend(
      recentClips.map((c) => ({ date: c.submittedAt, value: c.viewsVerified })),
    );

    const totalViews = clips.reduce((s, c) => s + c.viewsVerified, 0);
    const totalGmv = clips.reduce((s, c) => s + c.earningsAmount, 0);
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

    // Top niches from the creator's own niche tags
    const topNiches: NicheStatDto[] = (user.nicheTags ?? [])
      .slice(0, 5)
      .map((niche) => ({ niche, count: 1 }));

    // Top campaigns by GMV
    const campaignGmv = new Map<string, number>();
    const campaignClipCount = new Map<string, number>();
    for (const clip of clips) {
      campaignGmv.set(clip.campaignId, (campaignGmv.get(clip.campaignId) ?? 0) + clip.earningsAmount);
      campaignClipCount.set(clip.campaignId, (campaignClipCount.get(clip.campaignId) ?? 0) + 1);
    }

    const topCampaigns = campaigns
      .map((c) => ({
        id: c.id,
        title: c.title,
        gmv: campaignGmv.get(c.id) ?? 0,
        clipsCount: campaignClipCount.get(c.id) ?? 0,
      }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5);

    return {
      viewsTrend,
      totalViews,
      totalGmv,
      activeCampaigns,
      totalClips: clips.length,
      topNiches,
      topCampaigns,
    };
  }

  // ── GET /analytics/clipper ────────────────────────────────────────────────

  @Get('clipper')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clipper analytics: earnings trend, tier progress, top niches, platforms' })
  @ApiOkResponse({ type: ClipperAnalyticsDto })
  async getClipperAnalytics(
    @CurrentUser() authUser: AuthUser,
  ): Promise<ClipperAnalyticsDto> {
    const user = await this.prisma.user.findUnique({
      where: { logtoId: authUser.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'clipper') {
      throw new ForbiddenException('Only clippers can access clipper analytics');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const clips = await this.prisma.clip.findMany({
      where: { clipperId: user.id },
      select: {
        id: true,
        status: true,
        platform: true,
        earningsAmount: true,
        viewsVerified: true,
        submittedAt: true,
      },
    });

    const approvedClips = clips.filter((c) => c.status === 'approved');

    // Earnings trend (last 30 days)
    const recentApproved = approvedClips.filter((c) => c.submittedAt >= thirtyDaysAgo);
    const earningsTrend = buildDailyTrend(
      recentApproved.map((c) => ({ date: c.submittedAt, value: c.earningsAmount })),
    );

    const totalEarnings = approvedClips.reduce((s, c) => s + c.earningsAmount, 0);
    const totalViews = approvedClips.reduce((s, c) => s + c.viewsVerified, 0);

    // Top niches from the clipper's own niche tags (sorted by earnings relevance)
    const topNiches: NicheStatDto[] = (user.nicheTags ?? [])
      .slice(0, 5)
      .map((niche) => ({ niche, count: totalEarnings }));

    // Top platforms (by clip count)
    const platformCount = new Map<string, number>();
    for (const clip of clips) {
      if (clip.platform) {
        platformCount.set(clip.platform, (platformCount.get(clip.platform) ?? 0) + 1);
      }
    }
    const topPlatforms: NicheStatDto[] = [...platformCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([niche, count]) => ({ niche, count }));

    return {
      earningsTrend,
      totalEarnings,
      totalViews,
      totalClips: clips.length,
      approvedClips: approvedClips.length,
      currentTier: user.clipperTier,
      clipperScore: user.clipperScore,
      topNiches,
      topPlatforms,
    };
  }

  // ── GET /analytics/platform ───────────────────────────────────────────────

  @Public()
  @Get('platform')
  @ApiOperation({ summary: 'Platform-wide analytics: trending niches, rates, supply/demand' })
  @ApiOkResponse({ type: PlatformAnalyticsDto })
  async getPlatformAnalytics(): Promise<PlatformAnalyticsDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeCampaigns, totalClippers, recentClipsCount, clippers] = await Promise.all([
      this.prisma.campaign.findMany({
        where: { status: 'active' },
        select: { id: true, type: true, ratePerKViews: true },
      }),
      this.prisma.user.count({ where: { role: 'clipper' } }),
      this.prisma.clip.count({
        where: { submittedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.findMany({
        where: { role: 'clipper' },
        select: { nicheTags: true },
        take: 200,
      }),
    ]);

    // Trending niches from clipper profiles
    const nicheCount = new Map<string, number>();
    for (const c of clippers) {
      for (const tag of c.nicheTags ?? []) {
        nicheCount.set(tag, (nicheCount.get(tag) ?? 0) + 1);
      }
    }
    const trendingNiches: NicheStatDto[] = [...nicheCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([niche, count]) => ({ niche, count }));

    // Average rates by campaign type
    const typeMap = new Map<string, { totalRate: number; count: number }>();
    for (const c of activeCampaigns) {
      const t = typeMap.get(c.type) ?? { totalRate: 0, count: 0 };
      if (c.ratePerKViews) {
        t.totalRate += c.ratePerKViews;
        t.count += 1;
      }
      typeMap.set(c.type, t);
    }
    const avgRatesByType = [...typeMap.entries()].map(([type, { totalRate, count }]) => ({
      type,
      avgRate: count > 0 ? Math.round(totalRate / count) : 0,
      campaignCount: activeCampaigns.filter((c) => c.type === type).length,
    }));

    const activeCampaignCount = activeCampaigns.length;
    const supplyDemandRatio =
      activeCampaignCount > 0
        ? Math.round((totalClippers / activeCampaignCount) * 10) / 10
        : 0;

    return {
      trendingNiches,
      avgRatesByType,
      activeCampaigns: activeCampaignCount,
      totalClippers,
      supplyDemandRatio,
      recentClipsCount,
    };
  }
}
