import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { TypesenseModule } from './infrastructure/search/typesense.module';
import { XenditModule } from './infrastructure/payment/xendit.module';
import { HealthModule } from './presentation/rest/health/health.module';
import { UserModule } from './presentation/rest/user/user.module';
import { CampaignModule } from './presentation/rest/campaign/campaign.module';
import { ClipModule } from './presentation/rest/clip/clip.module';
import { SearchModule } from './presentation/rest/search/search.module';
import { WebhookModule } from './presentation/rest/webhook/webhook.module';
import { PaymentModule } from './presentation/rest/payment/payment.module';
import { EarningsModule } from './presentation/rest/earnings/earnings.module';
import { DisputeModule } from './presentation/rest/dispute/dispute.module';
import { ConversationModule } from './presentation/rest/conversation/conversation.module';
import { ChatModule } from './presentation/ws/chat.module';
import { LogtoAuthGuard } from './shared/guards/logto-auth.guard';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, TypesenseModule, XenditModule, HealthModule, UserModule, CampaignModule, ClipModule, SearchModule, WebhookModule, PaymentModule, EarningsModule, DisputeModule, ConversationModule, ChatModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LogtoAuthGuard,
    },
  ],
})
export class AppModule {}
