import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisputeUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  avatarUrl?: string | null;
}

export class DisputeCampaignDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class DisputeClipDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  postedUrl?: string | null;
}

export class DisputeResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  campaignId?: string | null;

  @ApiPropertyOptional()
  clipId?: string | null;

  @ApiProperty()
  raisedById: string;

  @ApiProperty()
  againstId: string;

  @ApiProperty()
  reason: string;

  @ApiPropertyOptional()
  evidence?: unknown;

  @ApiProperty({ enum: ['open', 'under_review', 'resolved'] })
  status: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  resolution?: string | null;

  @ApiPropertyOptional()
  resolvedById?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date | null;

  @ApiPropertyOptional({ type: DisputeUserDto })
  raisedBy?: DisputeUserDto;

  @ApiPropertyOptional({ type: DisputeUserDto })
  against?: DisputeUserDto;

  @ApiPropertyOptional({ type: DisputeCampaignDto })
  campaign?: DisputeCampaignDto | null;

  @ApiPropertyOptional({ type: DisputeClipDto })
  clip?: DisputeClipDto | null;
}

export class DisputeListResponseDto {
  @ApiProperty({ type: [DisputeResponseDto] })
  data: DisputeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;
}
