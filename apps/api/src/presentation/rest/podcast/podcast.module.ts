import { Module } from '@nestjs/common';
import { PodcastModule as PodcastInfraModule } from '../../../infrastructure/podcast/podcast.module';
import { PodcastController } from './podcast.controller';

@Module({
  imports: [PodcastInfraModule],
  controllers: [PodcastController],
})
export class PodcastRestModule {}
