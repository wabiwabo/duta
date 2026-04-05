import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';

const mockCreator = {
  id: 'owner-1',
  logtoId: 'logto-owner-1',
  email: 'owner@example.com',
  name: 'Creator',
  role: 'owner',
  clipperTier: 'bronze',
  clipperScore: 0,
};

const mockClipper = {
  id: 'clipper-1',
  logtoId: 'logto-clipper-1',
  email: 'clipper@example.com',
  name: 'Clipper',
  role: 'clipper',
  clipperTier: 'silver',
  clipperScore: 120,
};

const mockCampaign = {
  id: 'campaign-1',
  title: 'Test Campaign',
  status: 'active',
  nicheTags: ['tech', 'gaming'],
  type: 'bounty',
  ratePerKViews: 5000,
};

const mockClip = {
  id: 'clip-1',
  campaignId: 'campaign-1',
  status: 'approved',
  platform: 'tiktok',
  earningsAmount: 90000,
  viewsVerified: 18000,
  submittedAt: new Date(),
  campaign: { nicheTags: ['tech', 'gaming'] },
};

const mockPrisma = {
  user: { findUnique: jest.fn(), count: jest.fn(), findMany: jest.fn() },
  campaign: { findMany: jest.fn() },
  clip: { findMany: jest.fn(), count: jest.fn() },
};

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCreatorAnalytics()', () => {
    it('should return creator analytics', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockCreator);
      mockPrisma.campaign.findMany.mockResolvedValue([mockCampaign]);
      mockPrisma.clip.findMany.mockResolvedValue([mockClip]);

      const result = await controller.getCreatorAnalytics({ sub: 'logto-owner-1' });

      expect(result.totalViews).toBe(18000);
      expect(result.totalGmv).toBe(90000);
      expect(result.activeCampaigns).toBe(1);
      expect(result.totalClips).toBe(1);
      expect(result.viewsTrend).toHaveLength(30);
      expect(result.topNiches.length).toBeGreaterThanOrEqual(0);
      expect(result.topCampaigns.length).toBeGreaterThanOrEqual(0);
    });

    it('should throw ForbiddenException for clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      await expect(controller.getCreatorAnalytics({ sub: 'logto-clipper-1' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.getCreatorAnalytics({ sub: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty campaigns', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockCreator);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.clip.findMany.mockResolvedValue([]);

      const result = await controller.getCreatorAnalytics({ sub: 'logto-owner-1' });

      expect(result.totalViews).toBe(0);
      expect(result.totalGmv).toBe(0);
      expect(result.activeCampaigns).toBe(0);
      expect(result.topNiches).toHaveLength(0);
      expect(result.topCampaigns).toHaveLength(0);
    });
  });

  describe('getClipperAnalytics()', () => {
    it('should return clipper analytics', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.clip.findMany.mockResolvedValue([mockClip]);

      const result = await controller.getClipperAnalytics({ sub: 'logto-clipper-1' });

      expect(result.totalEarnings).toBe(90000);
      expect(result.totalViews).toBe(18000);
      expect(result.totalClips).toBe(1);
      expect(result.approvedClips).toBe(1);
      expect(result.currentTier).toBe('silver');
      expect(result.clipperScore).toBe(120);
      expect(result.earningsTrend).toHaveLength(30);
    });

    it('should throw ForbiddenException for owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockCreator);
      await expect(controller.getClipperAnalytics({ sub: 'logto-owner-1' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.getClipperAnalytics({ sub: 'x' })).rejects.toThrow(UnauthorizedException);
    });

    it('should handle clips without platform', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.clip.findMany.mockResolvedValue([{ ...mockClip, platform: null }]);

      const result = await controller.getClipperAnalytics({ sub: 'logto-clipper-1' });
      expect(result.topPlatforms).toHaveLength(0);
    });
  });

  describe('getPlatformAnalytics()', () => {
    it('should return platform analytics', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([mockCampaign]);
      mockPrisma.user.count.mockResolvedValue(50);
      mockPrisma.user.findMany.mockResolvedValue([{ nicheTags: ['tech', 'gaming'] }]);
      mockPrisma.clip.count.mockResolvedValue(200);

      const result = await controller.getPlatformAnalytics();

      expect(result.activeCampaigns).toBe(1);
      expect(result.totalClippers).toBe(50);
      expect(result.recentClipsCount).toBe(200);
      expect(result.supplyDemandRatio).toBe(50);
      expect(result.trendingNiches.length).toBeGreaterThanOrEqual(0);
      expect(result.avgRatesByType.length).toBeGreaterThanOrEqual(0);
    });

    it('should return zero supply/demand ratio when no active campaigns', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.clip.count.mockResolvedValue(0);

      const result = await controller.getPlatformAnalytics();

      expect(result.supplyDemandRatio).toBe(0);
    });
  });
});
