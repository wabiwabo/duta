import { Module } from '@nestjs/common';
import { ClipperScoringService } from './clipper-scoring.service';

@Module({
  providers: [ClipperScoringService],
  exports: [ClipperScoringService],
})
export class ClipperScoringModule {}
