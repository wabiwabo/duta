import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CreateCampaignDto, CampaignTypeEnum } from './dto/create-campaign.dto';
import { UpdateCampaignDto, CampaignStatusEnum } from './dto/update-campaign.dto';
import { CampaignListQueryDto } from './dto/campaign-list-query.dto';

const mockUser = {
  id: 'user-1',
  logtoId: 'logto-sub-1',
  email: 'owner@example.com',
  name: 'Campaign Owner',
  avatarUrl: null,
};

const mockCampaign = {
  id: 'campaign-1',
  ownerId: 'user-1',
  type: 'bounty',
  title: 'Test Campaign',
  description: 'Test description',
  guidelines: null,
  sourceType: null,
  sourceUrl: null,
  sourceFileKey: null,
  sourceMetadata: null,
  ratePerKViews: 5000,
  budgetTotal: 500000,
  budgetSpent: 0,
  targetPlatforms: ['tiktok'],
  status: 'draft',
  deadline: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  owner: { id: 'user-1', name: 'Campaign Owner', avatarUrl: null },
  _count: { clips: 0 },
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  campaign: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

describe('CampaignController', () => {
  let controller: CampaignController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCampaign', () => {
    const createDto: CreateCampaignDto = {
      title: 'Test Campaign',
      description: 'Test description',
      type: CampaignTypeEnum.bounty,
      budgetTotal: 500000,
      ratePerKViews: 5000,
      targetPlatforms: ['tiktok'],
    };

    it('should create a campaign as draft', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign);

      const result = await controller.createCampaign({ sub: 'logto-sub-1' }, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('campaign-1');
      expect(result.status).toBe('draft');
      expect(result.budgetRemaining).toBe(500000);
      expect(result.clipCount).toBe(0);
      expect(mockPrisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'draft', ownerId: 'user-1' }),
        }),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(controller.createCampaign({ sub: 'unknown' }, createDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('listCampaigns', () => {
    it('should return paginated active campaigns by default', async () => {
      const activeCampaign = { ...mockCampaign, status: 'active' };
      mockPrisma.campaign.findMany.mockResolvedValue([activeCampaign]);
      mockPrisma.campaign.count.mockResolvedValue(1);

      const query: CampaignListQueryDto = { page: 1, limit: 20 };
      const result = await controller.listCampaigns(query);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('should filter by type when provided', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      const query: CampaignListQueryDto = { type: CampaignTypeEnum.gig };
      await controller.listCampaigns(query);

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'gig' }),
        }),
      );
    });

    it('should sort by rate when sortBy=rate', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      const query: CampaignListQueryDto = { sortBy: 'rate' as any };
      await controller.listCampaigns(query);

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { ratePerKViews: 'desc' },
        }),
      );
    });
  });

  describe('getCampaign', () => {
    it('should return a campaign by id', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await controller.getCampaign('campaign-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('campaign-1');
      expect(result.owner).toEqual({ id: 'user-1', name: 'Campaign Owner', avatarUrl: null });
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(controller.getCampaign('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign when user is owner', async () => {
      const updatedCampaign = { ...mockCampaign, title: 'Updated Title' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaign.update.mockResolvedValue(updatedCampaign);

      const dto: UpdateCampaignDto = { title: 'Updated Title' };
      const result = await controller.updateCampaign('campaign-1', { sub: 'logto-sub-1' }, dto);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockPrisma.user.findUnique.mockResolvedValue(otherUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const dto: UpdateCampaignDto = { title: 'Hacked Title' };
      await expect(
        controller.updateCampaign('campaign-1', { sub: 'other-sub' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow valid status transition draft→active', async () => {
      const activeCampaign = { ...mockCampaign, status: 'active' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign); // draft
      mockPrisma.campaign.update.mockResolvedValue(activeCampaign);

      const dto: UpdateCampaignDto = { status: CampaignStatusEnum.active };
      const result = await controller.updateCampaign('campaign-1', { sub: 'logto-sub-1' }, dto);

      expect(result.status).toBe('active');
    });

    it('should reject invalid status transition draft→paused', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign); // draft

      const dto: UpdateCampaignDto = { status: CampaignStatusEnum.paused };
      await expect(
        controller.updateCampaign('campaign-1', { sub: 'logto-sub-1' }, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.updateCampaign('campaign-1', { sub: 'unknown' }, {}),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete a draft campaign when user is owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign); // draft
      mockPrisma.campaign.delete.mockResolvedValue(mockCampaign);

      await expect(
        controller.deleteCampaign('campaign-1', { sub: 'logto-sub-1' }),
      ).resolves.toBeUndefined();

      expect(mockPrisma.campaign.delete).toHaveBeenCalledWith({ where: { id: 'campaign-1' } });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const otherUser = { ...mockUser, id: 'other-user' };
      mockPrisma.user.findUnique.mockResolvedValue(otherUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      await expect(
        controller.deleteCampaign('campaign-1', { sub: 'other-sub' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if campaign is not draft', async () => {
      const activeCampaign = { ...mockCampaign, status: 'active' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(activeCampaign);

      await expect(
        controller.deleteCampaign('campaign-1', { sub: 'logto-sub-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        controller.deleteCampaign('non-existent', { sub: 'logto-sub-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
