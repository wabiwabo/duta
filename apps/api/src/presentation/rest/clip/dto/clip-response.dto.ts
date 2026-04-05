import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClipClipperDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() avatarUrl: string | null;
}

export class ClipCampaignDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty({ enum: ['bounty', 'gig', 'podcast'] }) type: string;
}

export class ClipResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() campaignId: string;
  @ApiProperty() clipperId: string;
  @ApiPropertyOptional() postedUrl: string | null;
  @ApiPropertyOptional() platform: string | null;
  @ApiProperty({ enum: ['submitted', 'under_review', 'approved', 'revision', 'rejected'] })
  status: string;
  @ApiPropertyOptional() reviewFeedback: string | null;
  @ApiProperty() viewsVerified: number;
  @ApiProperty() earningsAmount: number;
  @ApiProperty() submittedAt: Date;
  @ApiPropertyOptional() reviewedAt: Date | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ type: () => ClipClipperDto }) clipper: ClipClipperDto;
  @ApiPropertyOptional({ type: () => ClipCampaignDto }) campaign?: ClipCampaignDto;
}

export class ClipListResponseDto {
  @ApiProperty({ type: () => [ClipResponseDto] }) data: ClipResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
}
