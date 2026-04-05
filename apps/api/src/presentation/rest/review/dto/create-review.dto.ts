import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'User ID being reviewed' })
  @IsString()
  @IsNotEmpty()
  revieweeId: string;

  @ApiProperty({ description: 'Campaign ID for this review' })
  @IsString()
  @IsNotEmpty()
  campaignId: string;

  @ApiPropertyOptional({ description: 'Clip ID associated with this review' })
  @IsOptional()
  @IsString()
  clipId?: string;

  @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description:
      'Category ratings. For clipper: { quality, speed, communication, creativity }. For creator: { communication, briefClarity, paymentSpeed }',
  })
  @IsOptional()
  @IsObject()
  categories?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Optional comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}
