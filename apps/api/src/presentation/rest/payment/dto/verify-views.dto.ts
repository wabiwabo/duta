import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyViewsDto {
  @ApiProperty({ description: 'Verified view count for the clip', example: 10000 })
  @IsInt()
  @Min(0)
  views: number;
}
