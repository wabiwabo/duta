import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepgramClient } from '@deepgram/sdk';
import {
  TranscriptSegment,
  TranscriptResult,
  ClipSuggestion,
} from './podcast.types';

@Injectable()
export class PodcastService {
  private readonly logger = new Logger(PodcastService.name);
  private readonly deepgram: DeepgramClient | null;

  constructor(private configService: ConfigService) {
    const apiKey = configService.get<string>('DEEPGRAM_API_KEY') || '';
    if (!apiKey) {
      this.logger.warn('DEEPGRAM_API_KEY not set — podcast service in mock mode');
      this.deepgram = null;
    } else {
      this.deepgram = new DeepgramClient({ apiKey });
    }
  }

  async transcribe(
    audioUrl: string,
    language = 'id',
  ): Promise<TranscriptResult> {
    if (!this.deepgram) {
      return this.mockTranscript();
    }

    // DeepgramClient v5: client.listen.v1.media.transcribeUrl(request)
    // HttpResponsePromise<T> extends Promise<T>, so await resolves to T directly
    const response = await this.deepgram.listen.v1.media.transcribeUrl({
      url: audioUrl,
      model: 'nova-2' as any,
      language,
      smart_format: true,
      paragraphs: true,
      utterances: true,
      diarize: true,
    });

    return this.parseResult(response);
  }

  async suggestClips(transcript: TranscriptResult): Promise<ClipSuggestion[]> {
    const { segments } = transcript;
    if (!segments.length) return [];

    // Group consecutive segments into chunks of ~30-60 seconds
    const chunks: TranscriptSegment[][] = [];
    let currentChunk: TranscriptSegment[] = [];
    let chunkStart = segments[0].start;

    for (const seg of segments) {
      currentChunk.push(seg);
      const chunkDuration = seg.end - chunkStart;

      if (chunkDuration >= 30) {
        chunks.push(currentChunk);
        currentChunk = [];
        chunkStart = seg.end;
      }
    }
    // Add remaining segments if >= 10s
    if (currentChunk.length > 0) {
      const lastDuration =
        currentChunk[currentChunk.length - 1].end - currentChunk[0].start;
      if (lastDuration >= 10) {
        chunks.push(currentChunk);
      }
    }

    const scored: ClipSuggestion[] = chunks.map((chunk) => {
      const start = chunk[0].start;
      const end = chunk[chunk.length - 1].end;
      const duration = end - start;
      const text = chunk.map((s) => s.text).join(' ');

      let score = 0;
      const reasons: string[] = [];

      // 1. Speaker changes (multi-speaker = more dynamic)
      const speakerSet = new Set(chunk.map((s) => s.speaker));
      if (speakerSet.size > 1) {
        score += 25;
        reasons.push(`${speakerSet.size} speakers`);
      } else {
        score += 5;
      }

      // 2. Average confidence
      const avgConfidence =
        chunk.reduce((sum, s) => sum + s.confidence, 0) / chunk.length;
      const confidenceScore = Math.round(avgConfidence * 25);
      score += confidenceScore;
      if (avgConfidence > 0.85) reasons.push('high confidence audio');

      // 3. Preferred length 20–45 seconds
      if (duration >= 20 && duration <= 45) {
        score += 30;
        reasons.push(`ideal length (${Math.round(duration)}s)`);
      } else if (duration > 45 && duration <= 60) {
        score += 20;
        reasons.push(`good length (${Math.round(duration)}s)`);
      } else if (duration > 60) {
        score += 10;
        reasons.push(`long clip (${Math.round(duration)}s)`);
      } else {
        score += 5;
      }

      // 4. Sentence completion — ends with punctuation
      const lastText = chunk[chunk.length - 1].text.trim();
      if (/[.!?]$/.test(lastText)) {
        score += 20;
        reasons.push('ends on complete sentence');
      }

      const finalScore = Math.min(Math.round(score), 100);
      const reason =
        reasons.length > 0 ? reasons.join(', ') : 'potential highlight';

      return { start, end, text, reason, score: finalScore };
    });

    // Top 5 by score
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private parseResult(result: any): TranscriptResult {
    // Deepgram v5 ListenV1Response shape:
    // { metadata: { duration, ... }, results: { channels, utterances } }
    const utterances: any[] = result?.results?.utterances ?? [];
    const channel = result?.results?.channels?.[0]?.alternatives?.[0];
    const fullText: string = channel?.transcript ?? '';
    const duration: number = result?.metadata?.duration ?? 0;

    if (utterances.length > 0) {
      const segments: TranscriptSegment[] = utterances.map((u: any) => ({
        start: u.start ?? 0,
        end: u.end ?? 0,
        text: u.transcript ?? '',
        speaker: u.speaker ?? 0,
        confidence: u.confidence ?? 0,
      }));

      const speakerSet = new Set(segments.map((s) => s.speaker));
      return { segments, fullText, duration, speakers: speakerSet.size };
    }

    // Fallback: build segments from word-level data
    const words: any[] = channel?.words ?? [];
    if (words.length > 0) {
      const segments = this.buildSegmentsFromWords(words);
      const speakerSet = new Set(segments.map((s) => s.speaker));
      return { segments, fullText, duration, speakers: speakerSet.size };
    }

    return { segments: [], fullText, duration, speakers: 0 };
  }

  private buildSegmentsFromWords(words: any[]): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    if (!words.length) return segments;

    let current: any[] = [words[0]];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const prev = words[i - 1];
      const sameSpeaker = word.speaker === prev.speaker;
      const gap = (word.start ?? 0) - (prev.end ?? 0);

      if (!sameSpeaker || gap > 1.5) {
        segments.push(this.wordsToSegment(current));
        current = [word];
      } else {
        current.push(word);
      }
    }
    if (current.length) segments.push(this.wordsToSegment(current));

    return segments;
  }

  private wordsToSegment(words: any[]): TranscriptSegment {
    const text = words
      .map((w) => w.punctuated_word ?? w.word ?? '')
      .join(' ');
    const avgConf =
      words.reduce((s, w) => s + (w.confidence ?? 0), 0) / words.length;
    return {
      start: words[0].start ?? 0,
      end: words[words.length - 1].end ?? 0,
      text,
      speaker: words[0].speaker ?? 0,
      confidence: avgConf,
    };
  }

  private mockTranscript(): TranscriptResult {
    const segments: TranscriptSegment[] = [
      {
        start: 0,
        end: 12.5,
        text: 'Halo semua, selamat datang di podcast kami. Hari ini kita akan membahas tentang dunia konten kreator di Indonesia.',
        speaker: 0,
        confidence: 0.96,
      },
      {
        start: 13.0,
        end: 28.0,
        text: 'Betul sekali, dan ini adalah topik yang sangat relevan karena industri ini berkembang pesat, terutama di platform seperti TikTok dan YouTube.',
        speaker: 1,
        confidence: 0.94,
      },
      {
        start: 28.5,
        end: 45.0,
        text: 'Kita bisa lihat bahwa banyak kreator yang berhasil monetisasi konten mereka. Pertanyaannya, bagaimana caranya agar bisa konsisten?',
        speaker: 0,
        confidence: 0.92,
      },
      {
        start: 45.5,
        end: 62.0,
        text: 'Menurut saya, kuncinya ada di tiga hal: konsistensi, kualitas konten, dan memahami audiens kamu. Jangan fokus di jumlah views dulu di awal.',
        speaker: 1,
        confidence: 0.95,
      },
      {
        start: 62.5,
        end: 78.0,
        text: 'Nah ini penting banget. Banyak kreator baru yang langsung burnout karena terlalu fokus ke angka. Proses itu penting.',
        speaker: 0,
        confidence: 0.93,
      },
      {
        start: 78.5,
        end: 95.0,
        text: 'Exactly. Dan juga jangan lupa soal engagement. Balas komentar, buat komunitas, karena itu yang bikin audiens kamu loyal jangka panjang.',
        speaker: 1,
        confidence: 0.91,
      },
    ];

    const fullText = segments.map((s) => s.text).join(' ');
    const duration = segments[segments.length - 1].end;
    const speakerSet = new Set(segments.map((s) => s.speaker));

    return { segments, fullText, duration, speakers: speakerSet.size };
  }
}
