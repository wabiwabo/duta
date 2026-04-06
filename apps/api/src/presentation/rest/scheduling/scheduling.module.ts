import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingDomainModule } from '../../../domain/scheduling/scheduling.module';
import { AdminGuard } from '../../../shared/guards/admin.guard';

@Module({
  imports: [SchedulingDomainModule],
  controllers: [SchedulingController],
  providers: [AdminGuard],
})
export class SchedulingModule {}
