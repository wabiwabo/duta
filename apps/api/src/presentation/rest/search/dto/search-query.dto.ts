import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchSortEnum {
  newest = 'newest',
  rate = 'rate',
  budget = 'budget',
}

export enum SearchTypeEnum {
  bounty = 'bounty',
  gig = 'gig',
}

export class SearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query string' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: SearchTypeEnum, description: 'Filter by campaign type' })
  @IsOptional()
  @IsEnum(SearchTypeEnum)
  type?: SearchTypeEnum;

  @ApiPropertyOptional({ description: 'Filter by target platform (e.g. tiktok, youtube)' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: SearchSortEnum, default: SearchSortEnum.newest })
  @IsOptional()
  @IsEnum(SearchSortEnum)
  sort?: SearchSortEnum = SearchSortEnum.newest;

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
}
