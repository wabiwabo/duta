import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ArrayMinSize } from 'class-validator';

export enum ConversationTypeEnum {
  direct = 'direct',
  campaign_group = 'campaign_group',
}

export class CreateConversationDto {
  @ApiProperty({ type: [String], description: 'User IDs to add as participants' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];

  @ApiPropertyOptional({ description: 'Campaign ID to link this conversation to' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ enum: ConversationTypeEnum, default: ConversationTypeEnum.direct })
  @IsOptional()
  @IsEnum(ConversationTypeEnum)
  type?: ConversationTypeEnum;
}
