import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PodcastService } from '../../../infrastructure/podcast/podcast.service';
import {
  TranscribePodcastDto,
  SuggestClipsDto,
  TranscriptResultResponseDto,
  ClipSuggestionResponseDto,
} from './dto/podcast.dto';

@ApiTags('podcast')
@ApiBearerAuth()
@Controller('api/podcast')
export class PodcastController {
  constructor(private readonly podcastService: PodcastService) {}

  @Post('transcribe')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({
    summary: 'Transcribe podcast audio',
    description:
      'Sends an audio URL to Deepgram for transcription and returns timestamped segments. ' +
      'Rate limited to 10 requests per minute. Falls back to mock data when DEEPGRAM_API_KEY is not set.',
  })
  @ApiOkResponse({ type: TranscriptResultResponseDto })
  async transcribe(
    @Body() dto: TranscribePodcastDto,
  ): Promise<TranscriptResultResponseDto> {
    return this.podcastService.transcribe(dto.audioUrl, dto.language);
  }

  @Post('suggest-clips')
  @ApiOperation({
    summary: 'Get clip suggestions from transcript',
    description:
      'Analyses timestamped transcript segments and returns up to 5 clip-worthy highlights ' +
      'ranked by speaker dynamics, audio confidence, ideal length, and sentence completeness.',
  })
  @ApiOkResponse({ type: [ClipSuggestionResponseDto] })
  async suggestClips(
    @Body() dto: SuggestClipsDto,
  ): Promise<ClipSuggestionResponseDto[]> {
    return this.podcastService.suggestClips(dto);
  }
}
