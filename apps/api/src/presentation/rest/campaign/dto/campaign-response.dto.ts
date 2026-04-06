import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampaignOwnerDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ type: 'string', nullable: true }) avatarUrl: string | null;
}

export class CampaignResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() ownerId: string;
  @ApiProperty({ enum: ['bounty', 'gig', 'podcast'] }) type: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiPropertyOptional({ type: 'string', nullable: true }) guidelines: string | null;
  @ApiPropertyOptional({ type: 'string', nullable: true }) sourceType: string | null;
  @ApiPropertyOptional({ type: 'string', nullable: true }) sourceUrl: string | null;
  @ApiPropertyOptional({ type: 'string', nullable: true }) sourceFileKey: string | null;
  @ApiPropertyOptional({ type: Object }) sourceMetadata: unknown;
  @ApiPropertyOptional() ratePerKViews: number | null;
  @ApiProperty() budgetTotal: number;
  @ApiProperty() budgetSpent: number;
  @ApiProperty() budgetRemaining: number;
  @ApiProperty({ type: [String] }) targetPlatforms: string[];
  @ApiProperty({ enum: ['draft', 'active', 'paused', 'completed'] }) status: string;
  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true }) deadline: Date | null;
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
