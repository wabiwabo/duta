import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DisputeQueryDto {
  @ApiPropertyOptional({ enum: ['open', 'under_review', 'resolved'] })
  @IsOptional()
  @IsIn(['open', 'under_review', 'resolved'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
