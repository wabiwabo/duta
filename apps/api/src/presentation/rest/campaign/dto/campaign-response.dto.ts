import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampaignOwnerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() avatarUrl: string | null;
}

export class CampaignResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() ownerId: string;
  @ApiProperty({ enum: ['bounty', 'gig', 'podcast'] }) type: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional() guidelines: string | null;
  @ApiPropertyOptional() sourceType: string | null;
  @ApiPropertyOptional() sourceUrl: string | null;
  @ApiPropertyOptional() sourceFileKey: string | null;
  @ApiPropertyOptional({ type: Object }) sourceMetadata: unknown;
  @ApiPropertyOptional() ratePerKViews: number | null;
  @ApiProperty() budgetTotal: number;
  @ApiProperty() budgetSpent: number;
  @ApiProperty() budgetRemaining: number;
  @ApiProperty({ type: [String] }) targetPlatforms: string[];
  @ApiProperty({ enum: ['draft', 'active', 'paused', 'completed'] }) status: string;
  @ApiPropertyOptional() deadline: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty({ type: () => CampaignOwnerDto }) owner: CampaignOwnerDto;
  @ApiProperty() clipCount: number;
}

export class CampaignListResponseDto {
  @ApiProperty({ type: () => [CampaignResponseDto] }) data: CampaignResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
}
