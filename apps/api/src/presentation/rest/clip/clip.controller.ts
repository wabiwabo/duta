import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { ClipStatus } from '@prisma/client';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { SubmitClipDto } from './dto/submit-clip.dto';
import { ReviewClipDto, ReviewActionEnum } from './dto/review-clip.dto';
import { ClipResponseDto, ClipListResponseDto } from './dto/clip-response.dto';
import { ClipListQueryDto } from './dto/clip-list-query.dto';

const CLIP_CLIPPER_INCLUDE = {
  select: { id: true, name: true, avatarUrl: true, email: true },
};

function mapClip(clip: {
  id: string;
  campaignId: string;
  clipperId: string;
  fileKey: string | null;
  postedUrl: string | null;
  platform: string | null;
  status: string;
  reviewFeedback: string | null;
  viewsVerified: number;
  earningsAmount: number;
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  clipper: { id: string; name: string; avatarUrl: string | null; email: string };
  campaign?: { id: string; title: string; type: string } | null;
}): ClipResponseDto {
  return {
    id: clip.id,
    campaignId: clip.campaignId,
    clipperId: clip.clipperId,
    postedUrl: clip.postedUrl,
    platform: clip.platform,
    status: clip.status,
    reviewFeedback: clip.reviewFeedback,
    viewsVerified: clip.viewsVerified,
    earningsAmount: clip.earningsAmount,
    submittedAt: clip.submittedAt,
    reviewedAt: clip.reviewedAt,
    createdAt: clip.createdAt,
    clipper: clip.clipper,
    campaign: clip.campaign ?? undefined,
  };
}

@ApiTags('Clip')
@ApiBearerAuth()
@Controller()
export class ClipController {
  private readonly logger = new Logger(ClipController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Post('campaigns/:campaignId/clips')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Submit a clip to a campaign (clipper only)' })
  @ApiCreatedResponse({ type: ClipResponseDto })
  async submitClip(
    @Param('campaignId') campaignId: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: SubmitClipDto,
  ): Promise<ClipResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'clipper') throw new ForbiddenException('Only clippers can submit clips');

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.status !== 'active') {
      throw new BadRequestException('Campaign is not active');
    }

    const existing = await this.prisma.clip.findFirst({
      where: { campaignId, clipperId: user.id, postedUrl: dto.postedUrl },
    });
    if (existing) {
      throw new ConflictException('You have already submitted this URL to this campaign');
    }

    const clip = await this.prisma.clip.create({
      data: {
        campaignId,
        clipperId: user.id,
        postedUrl: dto.postedUrl,
        platform: dto.platform,
        status: 'submitted',
      },
      include: {
        clipper: CLIP_CLIPPER_INCLUDE,
        campaign: { select: { id: true, title: true, type: true } },
      },
    });

    // Notify campaign owner of new clip submission (fire-and-forget)
    this.emailService.sendNewClipSubmitted(campaign.owner.email, {
      ownerName: campaign.owner.name,
      clipperName: user.name,
      campaignTitle: campaign.title,
      campaignId: campaign.id,
    }).catch((err) => this.logger.error('Failed to send new clip submitted email', err));

    return mapClip(clip as Parameters<typeof mapClip>[0]);
  }

  @Get('campaigns/:campaignId/clips')
  @ApiOperation({ summary: 'List clips for a campaign (owner sees all, clipper sees own)' })
  @ApiOkResponse({ type: ClipListResponseDto })
  async listCampaignClips(
    @Param('campaignId') campaignId: string,
    @CurrentUser() authUser: AuthUser,
    @Query() query: ClipListQueryDto,
  ): Promise<ClipListResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const isOwner = campaign.ownerId === user.id;
    const where = isOwner
      ? { campaignId }
      : { campaignId, clipperId: user.id };

    const [clips, total] = await Promise.all([
      this.prisma.clip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          clipper: CLIP_CLIPPER_INCLUDE,
        },
      }),
      this.prisma.clip.count({ where }),
    ]);

    return {
      data: clips.map((c) => mapClip(c as Parameters<typeof mapClip>[0])),
      total,
      page,
    };
  }

  @Get('clips/me')
  @ApiOperation({ summary: 'List my submitted clips across all campaigns (clipper only)' })
  @ApiOkResponse({ type: ClipListResponseDto })
  async listMyClips(
    @CurrentUser() authUser: AuthUser,
    @Query() query: ClipListQueryDto,
  ): Promise<ClipListResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = { clipperId: user.id };

    const [clips, total] = await Promise.all([
      this.prisma.clip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          clipper: CLIP_CLIPPER_INCLUDE,
          campaign: { select: { id: true, title: true, type: true } },
        },
      }),
      this.prisma.clip.count({ where }),
    ]);

    return {
      data: clips.map((c) => mapClip(c as Parameters<typeof mapClip>[0])),
      total,
      page,
    };
  }

  @Get('clips/:id')
  @ApiOperation({ summary: 'Get clip detail (clip owner or campaign owner only)' })
  @ApiOkResponse({ type: ClipResponseDto })
  async getClip(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<ClipResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const clip = await this.prisma.clip.findUnique({
      where: { id },
      include: {
        clipper: CLIP_CLIPPER_INCLUDE,
        campaign: { select: { id: true, title: true, type: true, ownerId: true } },
      },
    });

    if (!clip) throw new NotFoundException('Clip not found');

    const isCampaignOwner = clip.campaign?.ownerId === user.id;
    const isClipper = clip.clipperId === user.id;

    if (!isCampaignOwner && !isClipper) {
      throw new ForbiddenException('Access denied');
    }

    return mapClip(clip as Parameters<typeof mapClip>[0]);
  }

  @Patch('clips/:id/review')
  @ApiOperation({ summary: 'Review a clip (campaign owner only)' })
  @ApiOkResponse({ type: ClipResponseDto })
  async reviewClip(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ReviewClipDto,
  ): Promise<ClipResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const clip = await this.prisma.clip.findUnique({
      where: { id },
      include: {
        clipper: CLIP_CLIPPER_INCLUDE,
        campaign: { select: { id: true, title: true, type: true, ownerId: true } },
      },
    });

    if (!clip) throw new NotFoundException('Clip not found');
    if (clip.campaign?.ownerId !== user.id) {
      throw new ForbiddenException('Only the campaign owner can review clips');
    }

    if (
      (dto.action === ReviewActionEnum.reject || dto.action === ReviewActionEnum.revision) &&
      !dto.feedback
    ) {
      throw new BadRequestException('Feedback is required for reject or revision actions');
    }

    const statusMap: Record<ReviewActionEnum, ClipStatus> = {
      [ReviewActionEnum.approve]: ClipStatus.approved,
      [ReviewActionEnum.reject]: ClipStatus.rejected,
      [ReviewActionEnum.revision]: ClipStatus.revision,
    };

    const updated = await this.prisma.clip.update({
      where: { id },
      data: {
        status: statusMap[dto.action],
        reviewFeedback: dto.feedback ?? null,
        reviewedAt: new Date(),
      },
      include: {
        clipper: CLIP_CLIPPER_INCLUDE,
        campaign: { select: { id: true, title: true, type: true } },
      },
    });

    // Notify clipper of review outcome (fire-and-forget)
    if (dto.action === ReviewActionEnum.approve) {
      this.emailService.sendClipApproved(updated.clipper.email, {
        clipperName: updated.clipper.name,
        campaignTitle: updated.campaign?.title ?? '',
        earningsAmount: updated.earningsAmount,
      }).catch((err) => this.logger.error('Failed to send clip approved email', err));
    } else if (dto.action === ReviewActionEnum.reject) {
      this.emailService.sendClipRejected(updated.clipper.email, {
        clipperName: updated.clipper.name,
        campaignTitle: updated.campaign?.title ?? '',
        feedback: dto.feedback ?? undefined,
      }).catch((err) => this.logger.error('Failed to send clip rejected email', err));
    }

    return mapClip(updated as Parameters<typeof mapClip>[0]);
  }
}
