import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateCampaignDto } from './create-campaign.dto';

export enum CampaignStatusEnum {
  draft = 'draft',
  active = 'active',
  paused = 'paused',
  completed = 'completed',
}

export class UpdateCampaignDto extends PartialType(CreateCampaignDto) {
  @ApiPropertyOptional({ enum: CampaignStatusEnum })
  @IsOptional()
  @IsEnum(CampaignStatusEnum)
  status?: CampaignStatusEnum;
}
