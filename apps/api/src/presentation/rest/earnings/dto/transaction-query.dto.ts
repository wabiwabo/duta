import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionQueryDto {
  @ApiPropertyOptional({ enum: ['deposit', 'payout', 'refund', 'fee'] })
  @IsOptional()
  @IsIn(['deposit', 'payout', 'refund', 'fee'])
  type?: string;

  @ApiPropertyOptional({ enum: ['pending', 'processing', 'completed', 'failed'] })
  @IsOptional()
  @IsIn(['pending', 'processing', 'completed', 'failed'])
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
