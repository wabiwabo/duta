import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import {
  CreateOrganizationDto,
  InviteMemberDto,
  UpdateMemberDto,
  OrganizationResponseDto,
  OrgMemberResponseDto,
  OrgStatsResponseDto,
} from './dto/organization.dto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapMember(m: {
  id: string;
  userId: string;
  role: string;
  subTeam: string | null;
  commissionRate: number | null;
  status: string;
  createdAt: Date;
  user: { name: string; avatarUrl: string | null };
}): OrgMemberResponseDto {
  return {
    id: m.id,
    userId: m.userId,
    userName: m.user.name,
    userAvatar: m.user.avatarUrl,
    role: m.role,
    subTeam: m.subTeam,
    commissionRate: m.commissionRate,
    status: m.status,
    createdAt: m.createdAt,
  };
}

function mapOrg(
  org: {
    id: string;
    name: string;
    type: string;
    ownerId: string;
    bio: string | null;
    logo: string | null;
    nicheTags: string[];
    kybStatus: string;
    platformFeeRate: number;
    createdAt: Date;
    members?: {
      id: string;
      userId: string;
      role: string;
      subTeam: string | null;
      commissionRate: number | null;
      status: string;
      createdAt: Date;
      user: { name: string; avatarUrl: string | null };
    }[];
  },
  includeMembers = false,
): OrganizationResponseDto {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    ownerId: org.ownerId,
    bio: org.bio,
    logo: org.logo,
    nicheTags: org.nicheTags,
    kybStatus: org.kybStatus,
    platformFeeRate: org.platformFeeRate,
    createdAt: org.createdAt,
    ...(includeMembers && org.members
      ? { members: org.members.map(mapMember) }
      : {}),
  };
}

const MEMBER_INCLUDE = {
  user: { select: { name: true, avatarUrl: true } },
};

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Resolve current user ──────────────────────────────────────────────────

  private async resolveUser(authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { logtoId: authUser.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  // ── Assert membership + role ──────────────────────────────────────────────

  private async assertMember(
    orgId: string,
    userId: string,
    requiredRoles?: string[],
  ) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { orgId, userId, status: { not: 'removed' } },
    });
    if (!member) throw new ForbiddenException('Not a member of this organization');
    if (requiredRoles && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Requires role: ${requiredRoles.join(' or ')}`,
      );
    }
    return member;
  }

  // ── POST /organizations ───────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a team or agency (creator becomes owner)' })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  async createOrganization(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    const user = await this.resolveUser(authUser);

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        type: dto.type,
        ownerId: user.id,
        bio: dto.bio,
        nicheTags: dto.nicheTags ?? [],
        members: {
          create: {
            userId: user.id,
            role: 'owner',
            status: 'active',
          },
        },
      },
      include: {
        members: { include: MEMBER_INCLUDE },
      },
    });

    return mapOrg(org as Parameters<typeof mapOrg>[0], true);
  }

  // ── GET /organizations ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List my organizations' })
  @ApiOkResponse({ type: [OrganizationResponseDto] })
  async listMyOrganizations(
    @CurrentUser() authUser: AuthUser,
  ): Promise<OrganizationResponseDto[]> {
    const user = await this.resolveUser(authUser);

    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId: user.id, status: { not: 'removed' } },
      include: {
        organization: {
          include: { members: { include: MEMBER_INCLUDE } },
        },
      },
    });

    return memberships.map((m) =>
      mapOrg(m.organization as Parameters<typeof mapOrg>[0], false),
    );
  }

  // ── GET /organizations/:id ────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get org details + members (members only)' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  async getOrganization(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<OrganizationResponseDto> {
    const user = await this.resolveUser(authUser);

    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { members: { include: MEMBER_INCLUDE } },
    });
    if (!org) throw new NotFoundException('Organization not found');

    await this.assertMember(id, user.id);

    return mapOrg(org as Parameters<typeof mapOrg>[0], true);
  }

  // ── POST /organizations/:id/members ───────────────────────────────────────

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a member (owner or manager only)' })
  @ApiCreatedResponse({ type: OrgMemberResponseDto })
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: InviteMemberDto,
  ): Promise<OrgMemberResponseDto> {
    const user = await this.resolveUser(authUser);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    await this.assertMember(id, user.id, ['owner', 'manager']);

    // Make sure the invited user exists
    const invitee = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!invitee) throw new NotFoundException('User to invite not found');

    // Check for duplicate active membership
    const existing = await this.prisma.organizationMember.findFirst({
      where: { orgId: id, userId: dto.userId, status: { not: 'removed' } },
    });
    if (existing) throw new ConflictException('User is already a member');

    const member = await this.prisma.organizationMember.create({
      data: {
        orgId: id,
        userId: dto.userId,
        role: dto.role,
        status: 'invited',
      },
      include: MEMBER_INCLUDE,
    });

    return mapMember(member as Parameters<typeof mapMember>[0]);
  }

  // ── PATCH /organizations/:id/members/:memberId ────────────────────────────

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role/commission/status (owner only)' })
  @ApiOkResponse({ type: OrgMemberResponseDto })
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: UpdateMemberDto,
  ): Promise<OrgMemberResponseDto> {
    const user = await this.resolveUser(authUser);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    await this.assertMember(id, user.id, ['owner']);

    const target = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, orgId: id },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot modify the owner record');
    }

    const updated = await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.commissionRate !== undefined && { commissionRate: dto.commissionRate }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: MEMBER_INCLUDE,
    });

    return mapMember(updated as Parameters<typeof mapMember>[0]);
  }

  // ── DELETE /organizations/:id/members/:memberId ───────────────────────────

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member (owner only)' })
  @ApiNoContentResponse({ description: 'Member removed' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<void> {
    const user = await this.resolveUser(authUser);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    await this.assertMember(id, user.id, ['owner']);

    const target = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, orgId: id },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot remove the owner');
    }

    await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { status: 'removed' },
    });
  }

  // ── GET /organizations/:id/stats ──────────────────────────────────────────

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get team/agency stats (any member)' })
  @ApiOkResponse({ type: OrgStatsResponseDto })
  async getStats(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<OrgStatsResponseDto> {
    const user = await this.resolveUser(authUser);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');

    await this.assertMember(id, user.id);

    // Get active member user IDs
    const members = await this.prisma.organizationMember.findMany({
      where: { orgId: id, status: { not: 'removed' } },
      select: { userId: true },
    });
    const memberIds = members.map((m) => m.userId);

    // Aggregate earnings for all member clippers
    const earningsAgg = await this.prisma.clip.aggregate({
      where: { clipperId: { in: memberIds }, status: 'approved' },
      _sum: { earningsAmount: true },
    });

    // Active campaigns (campaigns owned by org members that are active)
    const activeCampaignCount = await this.prisma.campaign.count({
      where: { ownerId: { in: memberIds }, status: 'active' },
    });

    // Average rating across all org members
    const reviews = await this.prisma.review.findMany({
      where: { revieweeId: { in: memberIds } },
      select: { rating: true },
    });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      memberCount: memberIds.length,
      totalEarnings: earningsAgg._sum.earningsAmount ?? 0,
      activeCampaigns: activeCampaignCount,
      averageRating: Math.round(avgRating * 10) / 10,
    };
  }
}
