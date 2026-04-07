import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../../shared/decorators/public.decorator';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { TypesenseService } from '../../../infrastructure/search/typesense.service';

interface ServiceStatus {
  status: 'up' | 'down';
  latency: number;
}

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly typesense: TypesenseService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const [database, redis, typesense] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkTypesense(),
    ]);

    const allUp = database.status === 'up' && redis.status === 'up' && typesense.status === 'up';

    return {
      status: allUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      services: { database, redis, typesense },
      version: '2.0.0',
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latency: Date.now() - start };
    } catch {
      return { status: 'down', latency: Date.now() - start };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.redis.ping();
      return { status: 'up', latency: Date.now() - start };
    } catch {
      return { status: 'down', latency: Date.now() - start };
    }
  }

  private async checkTypesense(): Promise<ServiceStatus> {
    const start = Date.now();
    const healthy = await this.typesense.healthCheck();
    return { status: healthy ? 'up' : 'down', latency: Date.now() - start };
  }
}
