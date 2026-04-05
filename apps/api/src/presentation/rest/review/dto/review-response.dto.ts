import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewReviewerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;
}

export class ReviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewerId: string;

  @ApiProperty()
  revieweeId: string;

  @ApiPropertyOptional()
  campaignId?: string | null;

  @ApiPropertyOptional()
  clipId?: string | null;

  @ApiProperty({ minimum: 1, maximum: 5 })
  rating: number;

  @ApiPropertyOptional()
  categories?: unknown;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiProperty()
  revealed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: ReviewReviewerDto })
  reviewer?: ReviewReviewerDto | null;
}

export class ReviewAggregateDto {
  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiPropertyOptional({ type: Object })
  categoryAverages?: Record<string, number>;
}

export class UserReviewsResponseDto {
  @ApiProperty({ type: [ReviewResponseDto] })
  data: ReviewResponseDto[];

  @ApiProperty({ type: ReviewAggregateDto })
  aggregate: ReviewAggregateDto;
}

export class PendingReviewDto {
  @ApiProperty()
  campaignId: string;

  @ApiProperty()
  campaignTitle: string;

  @ApiProperty()
  revieweeId: string;

  @ApiProperty()
  revieweeName: string;
}
