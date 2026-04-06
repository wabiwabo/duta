import {
  IsString,
  IsUrl,
  IsOptional,
  IsArray,
  IsNumber,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TranscriptSegment,
  TranscriptResult,
  ClipSuggestion,
} from '../../../../infrastructure/podcast/podcast.types';

// ─── Request DTOs ───────────────────────────────────────────────────────────────

export class TranscribePodcastDto {
  @ApiProperty({
    description: 'URL of the podcast audio file (mp3, wav, m4a, etc.)',
    example: 'https://example.com/episode-1.mp3',
  })
  @IsUrl({}, { message: 'audioUrl must be a valid URL' })
  audioUrl: string;

  @ApiPropertyOptional({
    description: 'Language code (BCP-47). Defaults to Indonesian (id)',
    example: 'id',
    default: 'id',
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class TranscriptSegmentDto implements TranscriptSegment {
  @ApiProperty({ description: 'Segment start time in seconds' })
  @IsNumber()
  @Min(0)
  start: number;

  @ApiProperty({ description: 'Segment end time in seconds' })
  @IsNumber()
  @Min(0)
  end: number;

  @ApiProperty({ description: 'Transcribed text for this segment' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Speaker ID from diarization (0-indexed)' })
  @IsInt()
  @Min(0)
  speaker: number;

  @ApiProperty({ description: 'Confidence score between 0 and 1', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;
}

export class SuggestClipsDto implements TranscriptResult {
  @ApiProperty({ type: [TranscriptSegmentDto], description: 'Timestamped transcript segments' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptSegmentDto)
  segments: TranscriptSegmentDto[];

  @ApiProperty({ description: 'Full transcript text' })
  @IsString()
  fullText: string;

  @ApiProperty({ description: 'Total audio duration in seconds' })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty({ description: 'Number of unique speakers detected' })
  @IsInt()
  @Min(0)
  speakers: number;
}

// ─── Response DTOs ──────────────────────────────────────────────────────────────

export class TranscriptSegmentResponseDto implements TranscriptSegment {
  @ApiProperty() start: number;
  @ApiProperty() end: number;
  @ApiProperty() text: string;
  @ApiProperty() speaker: number;
  @ApiProperty() confidence: number;
}

export class TranscriptResultResponseDto implements TranscriptResult {
  @ApiProperty({ type: [TranscriptSegmentResponseDto] })
  segments: TranscriptSegmentResponseDto[];

  @ApiProperty({ description: 'Full concatenated transcript' })
  fullText: string;

  @ApiProperty({ description: 'Total duration in seconds' })
  duration: number;

  @ApiProperty({ description: 'Number of unique speakers' })
  speakers: number;
}

export class ClipSuggestionResponseDto implements ClipSuggestion {
  @ApiProperty({ description: 'Clip start time in seconds' }) start: number;
  @ApiProperty({ description: 'Clip end time in seconds' }) end: number;
  @ApiProperty({ description: 'Text content of the clip' }) text: string;
  @ApiProperty({ description: 'Reason this segment is clip-worthy' }) reason: string;
  @ApiProperty({ description: 'Clip-worthiness score (0–100)', minimum: 0, maximum: 100 })
  score: number;
}
