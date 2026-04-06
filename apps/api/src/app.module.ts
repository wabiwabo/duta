import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { TypesenseModule } from './infrastructure/search/typesense.module';
import { XenditModule } from './infrastructure/payment/xendit.module';
import { AiModule } from './infrastructure/ai/ai.module';
import { EmailModule } from './infrastructure/email/email.module';
import { SentryModule } from './infrastructure/sentry/sentry.module';
import { PushModule } from './infrastructure/push/push.module';
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
import { NotificationModule } from './presentation/rest/notification/notification.module';
import { AdminModule } from './presentation/rest/admin/admin.module';
import { ClipperModule } from './presentation/rest/clipper/clipper.module';
import { ReviewModule } from './presentation/rest/review/review.module';
import { AiRestModule } from './presentation/rest/ai/ai.module';
import { OrganizationModule } from './presentation/rest/organization/organization.module';
import { AnalyticsModule } from './presentation/rest/analytics/analytics.module';
import { PodcastRestModule } from './presentation/rest/podcast/podcast.module';
import { ReferralModule } from './presentation/rest/referral/referral.module';
import { SchedulingModule } from './presentation/rest/scheduling/scheduling.module';
import { LogtoAuthGuard } from './shared/guards/logto-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    AppConfigModule, PrismaModule, RedisModule, TypesenseModule, XenditModule, AiModule, EmailModule, SentryModule, PushModule, HealthModule, UserModule, CampaignModule, ClipModule, SearchModule, WebhookModule, PaymentModule, EarningsModule, DisputeModule, ConversationModule, ChatModule, NotificationModule, AdminModule, ClipperModule, ReviewModule, AiRestModule, OrganizationModule, AnalyticsModule, PodcastRestModule, ReferralModule, SchedulingModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: LogtoAuthGuard,
    },
  ],
})
export class AppModule {}
