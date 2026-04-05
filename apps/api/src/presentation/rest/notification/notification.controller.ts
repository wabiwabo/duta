import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { NotificationService } from '../../../domain/notification/notification.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import {
  NotificationQueryDto,
  NotificationListResponseDto,
} from './dto/notification.dto';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for current user with unread count' })
  @ApiOkResponse({ type: NotificationListResponseDto })
  async list(
    @CurrentUser() authUser: AuthUser,
    @Query() query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    return this.notificationService.list(user.id, page, limit);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() authUser: AuthUser): Promise<{ updated: number }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const result = await this.notificationService.markAllAsRead(user.id);
    return { updated: result.count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<{ updated: number }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const result = await this.notificationService.markAsRead(id, user.id);
    return { updated: result.count };
  }
}
