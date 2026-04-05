import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

export enum CampaignTypeEnum {
  bounty = 'bounty',
  gig = 'gig',
  podcast = 'podcast',
}

export class CreateCampaignDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: CampaignTypeEnum })
  @IsEnum(CampaignTypeEnum)
  type: CampaignTypeEnum;

  @ApiPropertyOptional({ maxLength: 10000 })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  guidelines?: string;

  @ApiPropertyOptional({ enum: ['youtube_url', 'upload', 'rss'] })
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiPropertyOptional({ description: 'YouTube URL or RSS feed URL' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Rate per 1K views in Rupiah (min Rp 1,000)', minimum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  ratePerKViews?: number;

  @ApiProperty({ description: 'Total campaign budget in Rupiah (min Rp 50,000)', minimum: 50000 })
  @IsNumber()
  @Min(50000)
  budgetTotal: number;

  @ApiPropertyOptional({ type: [String], description: 'Target platforms: tiktok, reels, shorts' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPlatforms?: string[];

  @ApiPropertyOptional({ description: 'Campaign deadline (ISO date string)' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
