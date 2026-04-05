import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './infrastructure/persistence/prisma.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [AppConfigModule, PrismaModule, RedisModule],
})
export class AppModule {}
