import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes, filters, interceptors
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Duta API')
    .setDescription('Duta Content Clipping Marketplace API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Also serve the pre-generated full spec at /api/openapi.json
  try {
    const fs = require('fs');
    const specPaths = [
      require('path').resolve('/opt/duta-api/openapi.json'),
      require('path').resolve(process.cwd(), 'openapi.json'),
    ];
    for (const sp of specPaths) {
      if (fs.existsSync(sp)) {
        const fullSpec = JSON.parse(fs.readFileSync(sp, 'utf-8'));
        const expressApp = app.getHttpAdapter().getInstance();
        expressApp.get('/api/openapi.json', (_req: unknown, res: { json: (d: unknown) => void }) => res.json(fullSpec));
        logger.log(`Full OpenAPI spec (${Object.keys(fullSpec.paths).length} paths) at /api/openapi.json`);
        break;
      }
    }
  } catch (e) {
    logger.warn(`Could not load openapi.json: ${e}`);
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`Duta API running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
