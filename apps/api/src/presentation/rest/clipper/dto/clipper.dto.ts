import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ClipperScoreDto {
  @ApiProperty({ description: 'Clipper user ID' }) userId: string;
  @ApiProperty({ description: 'Clipper score (0-100)' }) score: number;
  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'], description: 'Clipper tier' })
  tier: string;
}

export class LeaderboardEntryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true }) avatarUrl: string | null;
  @ApiProperty() clipperScore: number;
  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'] }) clipperTier: string;
}

export class LeaderboardResponseDto {
  @ApiProperty({ type: [LeaderboardEntryDto] }) data: LeaderboardEntryDto[];
}

export class RecalculateResponseDto {
  @ApiProperty({ description: 'Number of clippers recalculated' }) updated: number;
}

// ─── Public Clipper Profile DTOs ─────────────────────────────────────────────

export class ClipperProfileStatsDto {
  @ApiProperty() totalClips: number;
  @ApiProperty() totalViews: number;
  @ApiProperty() totalCampaigns: number;
  @ApiProperty() averageRating: number;
}

export class ClipperRecentClipDto {
  @ApiProperty() id: string;
  @ApiProperty() campaignTitle: string;
  @ApiPropertyOptional() platform: string | null;
  @ApiProperty() views: number;
  @ApiProperty() earnings: number;
}

export class ClipperProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() bio: string | null;
  @ApiPropertyOptional() avatarUrl: string | null;
  @ApiProperty({ type: [String] }) nicheTags: string[];
  @ApiProperty() clipperScore: number;
  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'] }) clipperTier: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: () => ClipperProfileStatsDto }) stats: ClipperProfileStatsDto;
  @ApiProperty({ type: () => [ClipperRecentClipDto] }) recentClips: ClipperRecentClipDto[];
}

export class ClipperDirectoryEntryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() avatarUrl: string | null;
  @ApiProperty({ type: [String] }) nicheTags: string[];
  @ApiProperty() clipperScore: number;
  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'] }) clipperTier: string;
  @ApiProperty() averageRating: number;
  @ApiProperty() totalClips: number;
  @ApiProperty() createdAt: Date;
}

export class ClipperDirectoryResponseDto {
  @ApiProperty({ type: () => [ClipperDirectoryEntryDto] }) data: ClipperDirectoryEntryDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
}

export class ClipperDirectoryQueryDto {
  @ApiPropertyOptional({ enum: ['bronze', 'silver', 'gold', 'platinum'] })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  niche?: string;

  @ApiPropertyOptional({ enum: ['score', 'rating', 'newest'] })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ─── Campaign Leaderboard & Analytics DTOs ───────────────────────────────────

export class CampaignLeaderboardEntryDto {
  @ApiProperty() rank: number;
  @ApiProperty() clipperId: string;
  @ApiProperty() clipperName: string;
  @ApiPropertyOptional() clipperAvatar: string | null;
  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'] }) clipperTier: string;
  @ApiProperty() views: number;
  @ApiProperty() clipsCount: number;
}

export class CampaignLeaderboardResponseDto {
  @ApiProperty({ type: () => [CampaignLeaderboardEntryDto] }) data: CampaignLeaderboardEntryDto[];
}

export class DailyViewsDto {
  @ApiProperty() date: string;
  @ApiProperty() views: number;
}

export class TopClipDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() platform: string | null;
  @ApiProperty() views: number;
  @ApiProperty() earnings: number;
  @ApiProperty() clipperName: string;
}

export class TopPlatformDto {
  @ApiProperty() platform: string;
  @ApiProperty() views: number;
}

export class CampaignAnalyticsDto {
  @ApiProperty() totalViews: number;
  @ApiProperty() totalClips: number;
  @ApiProperty() totalEarnings: number;
  @ApiProperty() budgetUtilizationPct: number;
  @ApiProperty({ type: () => [DailyViewsDto] }) viewsOverTime: DailyViewsDto[];
  @ApiProperty({ type: () => [TopClipDto] }) topClips: TopClipDto[];
  @ApiProperty({ type: () => [TopPlatformDto] }) topPlatforms: TopPlatformDto[];
}

// ─── Batch Review DTO ────────────────────────────────────────────────────────

export class BatchReviewClipsDto {
  @ApiProperty({ type: [String] }) clipIds: string[];
  @ApiProperty({ enum: ['approve', 'reject'] }) action: 'approve' | 'reject';
  @ApiPropertyOptional() feedback?: string;
}

export class BatchReviewResultDto {
  @ApiProperty() updated: number;
  @ApiProperty({ type: [String] }) updatedIds: string[];
}
