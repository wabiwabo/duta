import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiService, MatchedClipper, GeneratedBrief } from '../../../infrastructure/ai/ai.service';

class MatchClippersDto {
  @ApiPropertyOptional({ description: 'Campaign ID to match clippers for' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Niche tags to match against' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  niche?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Target platforms' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];
}

class GenerateBriefDto {
  @ApiProperty({ description: 'Campaign topic or product name' })
  @IsString()
  topic: string;

  @ApiProperty({ description: 'Campaign type: bounty, gig, or podcast' })
  @IsString()
  type: string;

  @ApiProperty({ type: [String], description: 'Target platforms (e.g. tiktok, reels, shorts)' })
  @IsArray()
  @IsString({ each: true })
  targetPlatforms: string[];
}

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('match-clippers')
  @ApiOperation({ summary: 'Get top 10 matched clippers for a campaign or criteria' })
  @ApiOkResponse({ description: 'Sorted list of matched clippers with scores' })
  async matchClippers(@Body() dto: MatchClippersDto): Promise<MatchedClipper[]> {
    return this.aiService.matchClippers({
      campaignId: dto.campaignId,
      niche: dto.niche,
      platforms: dto.platforms,
    });
  }

  @Post('generate-brief')
  @ApiOperation({ summary: 'Generate a campaign brief (uses LLM if API key set, else template)' })
  @ApiOkResponse({ description: 'Generated campaign brief with title, description, guidelines' })
  async generateBrief(@Body() dto: GenerateBriefDto): Promise<GeneratedBrief> {
    return this.aiService.generateBrief({
      topic: dto.topic,
      type: dto.type,
      targetPlatforms: dto.targetPlatforms,
    });
  }
}
