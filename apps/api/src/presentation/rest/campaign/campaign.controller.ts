import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Logger,
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
import { TypesenseService } from '../../../infrastructure/search/typesense.service';
import { CampaignStatus, CampaignType } from '@prisma/client';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { Public } from '../../../shared/decorators/public.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignResponseDto, CampaignListResponseDto } from './dto/campaign-response.dto';
import { CampaignListQueryDto, SortByEnum } from './dto/campaign-list-query.dto';

const CAMPAIGN_INCLUDE = {
  owner: {
    select: { id: true, name: true, avatarUrl: true },
  },
  _count: {
    select: { clips: true },
  },
};

function mapCampaign(campaign: {
  id: string;
  ownerId: string;
  type: string;
  title: string;
  description: string;
  guidelines: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceFileKey: string | null;
  sourceMetadata: unknown;
  ratePerKViews: number | null;
  budgetTotal: number;
  budgetSpent: number;
  targetPlatforms: string[];
  status: string;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string; avatarUrl: string | null };
  _count: { clips: number };
}): CampaignResponseDto {
  return {
    id: campaign.id,
    ownerId: campaign.ownerId,
    type: campaign.type,
    title: campaign.title,
    description: campaign.description,
    guidelines: campaign.guidelines,
    sourceType: campaign.sourceType,
    sourceUrl: campaign.sourceUrl,
    sourceFileKey: campaign.sourceFileKey,
    sourceMetadata: campaign.sourceMetadata,
    ratePerKViews: campaign.ratePerKViews,
    budgetTotal: campaign.budgetTotal,
    budgetSpent: campaign.budgetSpent,
    budgetRemaining: campaign.budgetTotal - campaign.budgetSpent,
    targetPlatforms: campaign.targetPlatforms,
    status: campaign.status,
    deadline: campaign.deadline,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    owner: campaign.owner,
    clipCount: campaign._count.clips,
  };
}

@ApiTags('Campaign')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignController {
  private readonly logger = new Logger(CampaignController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly typesense: TypesenseService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign (draft)' })
  @ApiCreatedResponse({ type: CampaignResponseDto })
  async createCampaign(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateCampaignDto,
  ): Promise<CampaignResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.create({
      data: {
        ownerId: user.id,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        guidelines: dto.guidelines,
        sourceType: dto.sourceType,
        sourceUrl: dto.sourceUrl,
        ratePerKViews: dto.ratePerKViews,
        budgetTotal: dto.budgetTotal,
        targetPlatforms: dto.targetPlatforms ?? [],
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        status: 'draft',
      },
      include: CAMPAIGN_INCLUDE,
    });

    const mapped = mapCampaign(campaign as Parameters<typeof mapCampaign>[0]);
    this.typesense.indexCampaign({
      id: mapped.id,
      title: mapped.title,
      description: mapped.description,
      type: mapped.type,
      status: mapped.status,
      targetPlatforms: mapped.targetPlatforms,
      ratePerKViews: mapped.ratePerKViews ?? null,
      budgetTotal: mapped.budgetTotal,
      budgetRemaining: mapped.budgetRemaining,
      ownerName: mapped.owner.name,
      clipCount: mapped.clipCount,
      createdAt: new Date(mapped.createdAt),
    }).catch((err) => this.logger.warn(`Typesense index error: ${(err as Error).message}`));
    return mapped;
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List campaigns (public)' })
  @ApiOkResponse({ type: CampaignListResponseDto })
  async listCampaigns(@Query() query: CampaignListQueryDto): Promise<CampaignListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const status = query.status ?? 'active';

    const where = {
      ...(query.type ? { type: query.type as CampaignType } : {}),
      status: status as CampaignStatus,
    };

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (query.sortBy === SortByEnum.rate) {
      orderBy = { ratePerKViews: 'desc' };
    } else if (query.sortBy === SortByEnum.budget) {
      orderBy = { budgetTotal: 'desc' };
    }

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: CAMPAIGN_INCLUDE,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: campaigns.map((c) => mapCampaign(c as Parameters<typeof mapCampaign>[0])),
      total,
      page,
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get campaign detail (public)' })
  @ApiOkResponse({ type: CampaignResponseDto })
  async getCampaign(@Param('id') id: string): Promise<CampaignResponseDto> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: CAMPAIGN_INCLUDE,
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    return mapCampaign(campaign as Parameters<typeof mapCampaign>[0]);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign (owner only)' })
  @ApiOkResponse({ type: CampaignResponseDto })
  async updateCampaign(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
    @Body() dto: UpdateCampaignDto,
  ): Promise<CampaignResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== user.id) throw new ForbiddenException('Not the campaign owner');

    // Validate status transitions
    if (dto.status) {
      const currentStatus = campaign.status;
      const newStatus = dto.status;
      const validTransitions: Record<string, string[]> = {
        draft: ['active'],
        active: ['paused'],
        paused: ['active'],
        completed: [],
      };
      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition campaign from '${currentStatus}' to '${newStatus}'`,
        );
      }
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.guidelines !== undefined && { guidelines: dto.guidelines }),
        ...(dto.ratePerKViews !== undefined && { ratePerKViews: dto.ratePerKViews }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline ? new Date(dto.deadline) : null }),
        ...(dto.targetPlatforms !== undefined && { targetPlatforms: dto.targetPlatforms }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.sourceType !== undefined && { sourceType: dto.sourceType }),
        ...(dto.sourceUrl !== undefined && { sourceUrl: dto.sourceUrl }),
      },
      include: CAMPAIGN_INCLUDE,
    });

    const mappedUpdate = mapCampaign(updated as Parameters<typeof mapCampaign>[0]);
    this.typesense.indexCampaign({
      id: mappedUpdate.id,
      title: mappedUpdate.title,
      description: mappedUpdate.description,
      type: mappedUpdate.type,
      status: mappedUpdate.status,
      targetPlatforms: mappedUpdate.targetPlatforms,
      ratePerKViews: mappedUpdate.ratePerKViews ?? null,
      budgetTotal: mappedUpdate.budgetTotal,
      budgetRemaining: mappedUpdate.budgetRemaining,
      ownerName: mappedUpdate.owner.name,
      clipCount: mappedUpdate.clipCount,
      createdAt: new Date(mappedUpdate.createdAt),
    }).catch((err) => this.logger.warn(`Typesense re-index error: ${(err as Error).message}`));
    return mappedUpdate;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign (owner only, draft only)' })
  @ApiNoContentResponse({ description: 'Campaign deleted' })
  async deleteCampaign(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthUser,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.ownerId !== user.id) throw new ForbiddenException('Not the campaign owner');
    if (campaign.status !== 'draft') {
      throw new BadRequestException('Only draft campaigns can be deleted');
    }

    await this.prisma.campaign.delete({ where: { id } });
    this.typesense.removeCampaign(id).catch((err) =>
      this.logger.warn(`Typesense remove error: ${(err as Error).message}`),
    );
  }
}
