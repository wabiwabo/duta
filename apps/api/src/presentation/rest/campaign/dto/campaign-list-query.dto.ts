import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignTypeEnum } from './create-campaign.dto';
import { CampaignStatusEnum } from './update-campaign.dto';

export enum SortByEnum {
  newest = 'newest',
  rate = 'rate',
  budget = 'budget',
}

export class CampaignListQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CampaignTypeEnum })
  @IsOptional()
  @IsEnum(CampaignTypeEnum)
  type?: CampaignTypeEnum;

  @ApiPropertyOptional({ enum: CampaignStatusEnum, default: CampaignStatusEnum.active })
  @IsOptional()
  @IsEnum(CampaignStatusEnum)
  status?: CampaignStatusEnum = CampaignStatusEnum.active;

  @ApiPropertyOptional({ enum: SortByEnum, default: SortByEnum.newest })
  @IsOptional()
  @IsEnum(SortByEnum)
  sortBy?: SortByEnum = SortByEnum.newest;
}
