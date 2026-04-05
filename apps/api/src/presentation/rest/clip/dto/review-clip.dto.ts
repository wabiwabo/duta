import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ReviewActionEnum {
  approve = 'approve',
  reject = 'reject',
  revision = 'revision',
}

export class ReviewClipDto {
  @ApiProperty({ enum: ReviewActionEnum, description: 'Review action to take on the clip' })
  @IsEnum(ReviewActionEnum)
  action: ReviewActionEnum;

  @ApiPropertyOptional({ maxLength: 2000, description: 'Required for reject or revision actions' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}
