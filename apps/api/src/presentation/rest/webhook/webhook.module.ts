import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LogtoWebhookController } from './logto-webhook.controller';
import { EscrowService } from '../../../domain/payment/escrow.service';
import { EmailModule } from '../../../infrastructure/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [WebhookController, LogtoWebhookController],
  providers: [EscrowService],
})
export class WebhookModule {}
