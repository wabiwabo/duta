import { Module } from '@nestjs/common';
import { DisputeController } from './dispute.controller';

@Module({
  controllers: [DisputeController],
})
export class DisputeModule {}
