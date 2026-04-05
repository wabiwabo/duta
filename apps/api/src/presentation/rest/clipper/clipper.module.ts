import { Module } from '@nestjs/common';
import { ClipperController } from './clipper.controller';
import { ClipperScoringModule } from '../../../domain/clipper/clipper-scoring.module';
import { AdminGuard } from '../../../shared/guards/admin.guard';

@Module({
  imports: [ClipperScoringModule],
  controllers: [ClipperController],
  providers: [AdminGuard],
})
export class ClipperModule {}
