import { Module } from '@nestjs/common';
import { ClipController } from './clip.controller';

@Module({
  controllers: [ClipController],
})
export class ClipModule {}
