import {
  Controller,
  Post,
  Delete,
  Body,
  UnauthorizedException,
  Get,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PushService } from './push.service';
import { PrismaService } from '../persistence/prisma.service';
import { CurrentUser, AuthUser } from '../../shared/decorators/current-user.decorator';

class PushSubscribeDto {
  @IsString()
  endpoint: string;

  @IsString()
  p256dh: string;

  @IsString()
  auth: string;
}

class PushUnsubscribeDto {
  @IsString()
  endpoint: string;
}

@ApiTags('Push')
@ApiBearerAuth()
@Controller('push')
export class PushController {
  private readonly logger = new Logger(PushController.name);

  constructor(
    private readonly pushService: PushService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiOkResponse({ schema: { properties: { publicKey: { type: 'string' } } } })
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() || null };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Register a push subscription' })
  async subscribe(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: PushSubscribeDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const subscription = await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId: user.id,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
      update: {
        userId: user.id,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
    });

    this.logger.log(`Push subscription registered for user ${user.id}`);
    return { id: subscription.id, message: 'Subscribed to push notifications' };
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Remove a push subscription' })
  async unsubscribe(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: PushUnsubscribeDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint: dto.endpoint, userId: user.id },
    });

    this.logger.log(`Push subscription removed for user ${user.id}`);
    return { message: 'Unsubscribed from push notifications' };
  }
}
