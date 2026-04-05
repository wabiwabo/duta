import { ApiProperty } from '@nestjs/swagger';

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
