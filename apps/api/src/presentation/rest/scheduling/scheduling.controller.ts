import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { SchedulingService } from '../../../domain/scheduling/scheduling.service';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';

export class SchedulePostDto {
  @ApiProperty({ example: 'clip_id_here' })
  @IsString()
  @IsNotEmpty()
  clipId: string;

  @ApiProperty({ example: 'tiktok', description: 'tiktok | reels | shorts' })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({ example: '2026-04-10T10:00:00Z' })
  @IsDateString()
  scheduledAt: string;
}

@ApiTags('Scheduling')
@ApiBearerAuth()
@Controller('api/scheduled-posts')
export class SchedulingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingService: SchedulingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a clip to be posted on a platform' })
  @ApiCreatedResponse({ description: 'Scheduled post created' })
  async schedulePost(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: SchedulePostDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.schedulingService.schedulePost(user.id, {
      clipId: dto.clipId,
      platform: dto.platform,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Get()
  @ApiOperation({ summary: "List current user's scheduled posts" })
  @ApiOkResponse({ description: 'List of scheduled posts' })
  async listScheduled(@CurrentUser() authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.schedulingService.listScheduled(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a scheduled post' })
  @ApiOkResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  async cancelPost(
    @CurrentUser() authUser: AuthUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    await this.schedulingService.cancelPost(user.id, id);
    return { success: true };
  }

  @Post('process')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Manually trigger due-posts processing (admin only)' })
  @ApiOkResponse({ schema: { properties: { processed: { type: 'number' } } } })
  async processDuePosts(): Promise<{ processed: number }> {
    const processed = await this.schedulingService.processDuePosts();
    return { processed };
  }
}
