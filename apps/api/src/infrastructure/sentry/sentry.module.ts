import { Global, Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Global()
@Module({})
export class SentryModule implements OnModuleInit {
  private readonly logger = new Logger(SentryModule.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const sentryDsn = this.configService.get<string>('SENTRY_DSN');

    if (!sentryDsn) {
      this.logger.warn('SENTRY_DSN not set — Sentry running in mock mode');
      return;
    }

    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      integrations: [nodeProfilingIntegration()],
    });

    this.logger.log('Sentry initialized');
  }
}
