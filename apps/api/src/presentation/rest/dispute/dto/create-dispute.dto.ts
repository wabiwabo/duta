import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty, IsObject, ValidateIf } from 'class-validator';

export class CreateDisputeDto {
  @ApiPropertyOptional({ description: 'Campaign ID involved in the dispute' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Clip ID involved in the dispute' })
  @IsOptional()
  @IsString()
  clipId?: string;

  @ApiProperty({ description: 'User ID the dispute is raised against' })
  @IsString()
  @IsNotEmpty()
  againstId: string;

  @ApiProperty({ description: 'Reason for the dispute' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: 'Supporting evidence (URLs, screenshots, etc.)' })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}
