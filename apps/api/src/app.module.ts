import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { TypesenseModule } from './infrastructure/search/typesense.module';
import { HealthModule } from './presentation/rest/health/health.module';
import { UserModule } from './presentation/rest/user/user.module';
import { CampaignModule } from './presentation/rest/campaign/campaign.module';
import { ClipModule } from './presentation/rest/clip/clip.module';
import { SearchModule } from './presentation/rest/search/search.module';
import { LogtoAuthGuard } from './shared/guards/logto-auth.guard';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule, TypesenseModule, HealthModule, UserModule, CampaignModule, ClipModule, SearchModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: LogtoAuthGuard,
    },
  ],
})
export class AppModule {}
