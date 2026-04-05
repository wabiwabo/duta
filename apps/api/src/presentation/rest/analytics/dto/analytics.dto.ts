import { ApiProperty } from '@nestjs/swagger';

export class DailyDataPointDto {
  @ApiProperty({ description: 'Date string (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ description: 'Value for this day' })
  value: number;
}

export class NicheStatDto {
  @ApiProperty({ description: 'Niche tag name' })
  niche: string;

  @ApiProperty({ description: 'Count or amount' })
  count: number;
}

// ─── Creator Analytics ─────────────────────────────────────────────────────────

export class TopCampaignDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() gmv: number;
  @ApiProperty() clipsCount: number;
}

export class CreatorAnalyticsDto {
  @ApiProperty({ type: [DailyDataPointDto], description: 'Views over last 30 days' })
  viewsTrend: DailyDataPointDto[];

  @ApiProperty({ description: 'Total verified views (all time)' })
  totalViews: number;

  @ApiProperty({ description: 'Total GMV spent (approved clips)' })
  totalGmv: number;

  @ApiProperty({ description: 'Active campaign count' })
  activeCampaigns: number;

  @ApiProperty({ description: 'Total clips across all campaigns' })
  totalClips: number;

  @ApiProperty({ type: [NicheStatDto], description: 'Top performing niches by clip count' })
  topNiches: NicheStatDto[];

  @ApiProperty({ type: [TopCampaignDto], description: 'Top campaigns by GMV' })
  topCampaigns: TopCampaignDto[];
}

// ─── Clipper Analytics ─────────────────────────────────────────────────────────

export class ClipperAnalyticsDto {
  @ApiProperty({ type: [DailyDataPointDto], description: 'Earnings over last 30 days' })
  earningsTrend: DailyDataPointDto[];

  @ApiProperty({ description: 'Total lifetime earnings' })
  totalEarnings: number;

  @ApiProperty({ description: 'Total verified views (all time)' })
  totalViews: number;

  @ApiProperty({ description: 'Total clips submitted' })
  totalClips: number;

  @ApiProperty({ description: 'Approved clips count' })
  approvedClips: number;

  @ApiProperty({ description: 'Current clipper tier' })
  currentTier: string;

  @ApiProperty({ description: 'Clipper score' })
  clipperScore: number;

  @ApiProperty({ type: [NicheStatDto], description: 'Top niches by earnings' })
  topNiches: NicheStatDto[];

  @ApiProperty({ type: [NicheStatDto], description: 'Top platforms by clip count' })
  topPlatforms: NicheStatDto[];
}

// ─── Platform Analytics ────────────────────────────────────────────────────────

export class RateByTypeDto {
  @ApiProperty() type: string;
  @ApiProperty() avgRate: number;
  @ApiProperty() campaignCount: number;
}

export class PlatformAnalyticsDto {
  @ApiProperty({ type: [NicheStatDto], description: 'Trending niches by active campaign count' })
  trendingNiches: NicheStatDto[];

  @ApiProperty({ type: [RateByTypeDto], description: 'Average rates by campaign type' })
  avgRatesByType: RateByTypeDto[];

  @ApiProperty({ description: 'Total active campaigns' })
  activeCampaigns: number;

  @ApiProperty({ description: 'Total registered clippers' })
  totalClippers: number;

  @ApiProperty({ description: 'Supply/demand ratio (clippers per active campaign)' })
  supplyDemandRatio: number;

  @ApiProperty({ description: 'Total clips submitted platform-wide (last 30 days)' })
  recentClipsCount: number;
}
