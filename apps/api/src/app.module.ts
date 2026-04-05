import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { HealthModule } from './presentation/rest/health/health.module';
import { UserModule } from './presentation/rest/user/user.module';
import { CampaignModule } from './presentation/rest/campaign/campaign.module';
import { LogtoAuthGuard } from './shared/guards/logto-auth.guard';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, HealthModule, UserModule, CampaignModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LogtoAuthGuard,
    },
  ],
})
export class AppModule {}
