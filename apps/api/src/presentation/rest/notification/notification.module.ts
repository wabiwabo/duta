import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../../../domain/notification/notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
