export interface TranscriptSegment {
  start: number;      // seconds
  end: number;        // seconds
  text: string;
  speaker: number;    // speaker ID from diarization
  confidence: number; // 0-1
}

export interface TranscriptResult {
  segments: TranscriptSegment[];
  fullText: string;
  duration: number;   // total seconds
  speakers: number;   // count of unique speakers
}

export interface ClipSuggestion {
  start: number;
  end: number;
  text: string;
  reason: string;     // why this is clip-worthy
  score: number;      // 0-100
}
