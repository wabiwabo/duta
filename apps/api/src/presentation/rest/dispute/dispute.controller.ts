import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DisputeStatus } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';
import {
  DisputeResponseDto,
  DisputeListResponseDto,
} from './dto/dispute-response.dto';

const DISPUTE_INCLUDE = {
  raisedBy: { select: { id: true, name: true, avatarUrl: true } },
  against: { select: { id: true, name: true, avatarUrl: true } },
  campaign: { select: { id: true, title: true } },
  clip: { select: { id: true, postedUrl: true } },
};

function mapDispute(d: {
  id: string;
  campaignId: string | null;
  clipId: string | null;
  raisedById: string;
  againstId: string;
  reason: string;
  evidence: unknown;
  status: string;
  resolution: string | null;
  resolvedById: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  raisedBy?: { id: string; name: string; avatarUrl: string | null };
  against?: { id: string; name: string; avatarUrl: string | null };
  campaign?: { id: string; title: string } | null;
  clip?: { id: string; postedUrl: string | null } | null;
}): DisputeResponseDto {
  return {
    id: d.id,
    campaignId: d.campaignId,
    clipId: d.clipId,
    raisedById: d.raisedById,
    againstId: d.againstId,
    reason: d.reason,
    evidence: d.evidence,
    status: d.status,
    resolution: d.resolution,
    resolvedById: d.resolvedById,
    createdAt: d.createdAt,
    resolvedAt: d.resolvedAt,
    raisedBy: d.raisedBy,
    against: d.against,
    campaign: d.campaign ?? null,
    clip: d.clip ?? null,
  };
}

@ApiTags('Dispute')
@ApiBearerAuth()
@Controller()
export class DisputeController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('disputes')
  @ApiOperation({ summary: 'Raise a dispute (campaign participant only)' })
  @ApiCreatedResponse({ type: DisputeResponseDto })
  async createDispute(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateDisputeDto,
  ): Promise<DisputeResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!dto.campaignId && !dto.clipId) {
      throw new BadRequestException('Either campaignId or clipId must be provided');
    }

    // Verify user is a participant (campaign owner or clipper who submitted)
    if (dto.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({ where: { id: dto.campaignId } });
      if (!campaign) throw new NotFoundException('Campaign not found');

      const isOwner = campaign.ownerId === user.id;
      const isClipper = await this.prisma.clip.findFirst({
        where: { campaignId: dto.campaignId, clipperId: user.id },
      });

      if (!isOwner && !isClipper) {
        throw new ForbiddenException('Only campaign participants can raise disputes');
      }
    } else if (dto.clipId) {
      const clip = await this.prisma.clip.findUnique({
        where: { id: dto.clipId },
        include: { campaign: { select: { ownerId: true } } },
      });
      if (!clip) throw new NotFoundException('Clip not found');

      const isClipper = clip.clipperId === user.id;
      const isCampaignOwner = clip.campaign?.ownerId === user.id;

      if (!isClipper && !isCampaignOwner) {
        throw new ForbiddenException('Only campaign participants can raise disputes');
      }
    }

    // Validate againstId exists
    const againstUser = await this.prisma.user.findUnique({ where: { id: dto.againstId } });
    if (!againstUser) throw new NotFoundException('Target user not found');

    const dispute = await this.prisma.dispute.create({
      data: {
        campaignId: dto.campaignId ?? null,
        clipId: dto.clipId ?? null,
        raisedById: user.id,
        againstId: dto.againstId,
        reason: dto.reason,
        evidence: dto.evidence ? (dto.evidence as object) : undefined,
        status: 'open',
      },
      include: DISPUTE_INCLUDE,
    });

    return mapDispute(dispute as Parameters<typeof mapDispute>[0]);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List disputes involving current user' })
  @ApiOkResponse({ type: DisputeListResponseDto })
  async listDisputes(
    @CurrentUser() authUser: AuthUser,
    @Query() query: DisputeQueryDto,
  ): Promise<DisputeListResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const statusFilter = query.status ? { status: query.status as DisputeStatus } : {};

    const where = {
      OR: [{ raisedById: user.id }, { againstId: user.id }],
      ...statusFilter,
    };

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: DISPUTE_INCLUDE,
      }),
      this.prisma.dispute.count({ where }),
    ]);

    return {
      data: disputes.map((d) => mapDispute(d as Parameters<typeof mapDispute>[0])),
      total,
      page,
    };
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get dispute detail (parties involved or admin only)' })
  @ApiOkResponse({ type: DisputeResponseDto })
  async getDispute(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<DisputeResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: DISPUTE_INCLUDE,
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    const isParty = dispute.raisedById === user.id || dispute.againstId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isParty && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }

    return mapDispute(dispute as Parameters<typeof mapDispute>[0]);
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a dispute (admin only)' })
  @ApiOkResponse({ type: DisputeResponseDto })
  async resolveDispute(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ResolveDisputeDto,
  ): Promise<DisputeResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.role !== 'admin') throw new ForbiddenException('Only admins can resolve disputes');

    const dispute = await this.prisma.dispute.findUnique({ where: { id } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    if (dispute.status === 'resolved') {
      throw new BadRequestException('Dispute is already resolved');
    }

    const updated = await this.prisma.dispute.update({
      where: { id },
      data: {
        status: 'resolved',
        resolution: dto.resolution,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
      include: DISPUTE_INCLUDE,
    });

    return mapDispute(updated as Parameters<typeof mapDispute>[0]);
  }
}
