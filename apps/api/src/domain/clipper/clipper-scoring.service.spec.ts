import { Test, TestingModule } from '@nestjs/testing';
import { ClipperScoringService } from './clipper-scoring.service';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { ClipperTier } from '@prisma/client';

const mockPrisma = {
  clip: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  review: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('ClipperScoringService', () => {
  let service: ClipperScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClipperScoringService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClipperScoringService>(ClipperScoringService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTier', () => {
    it('should return bronze for score 0-39', () => {
      expect(service.getTier(0)).toBe(ClipperTier.bronze);
      expect(service.getTier(39)).toBe(ClipperTier.bronze);
    });

    it('should return silver for score 40-69', () => {
      expect(service.getTier(40)).toBe(ClipperTier.silver);
      expect(service.getTier(69)).toBe(ClipperTier.silver);
    });

    it('should return gold for score 70-89', () => {
      expect(service.getTier(70)).toBe(ClipperTier.gold);
      expect(service.getTier(89)).toBe(ClipperTier.gold);
    });

    it('should return platinum for score 90-100', () => {
      expect(service.getTier(90)).toBe(ClipperTier.platinum);
      expect(service.getTier(100)).toBe(ClipperTier.platinum);
    });
  });

  describe('calculateScore', () => {
    it('should return score 0 and bronze tier when no approved clips', async () => {
      mockPrisma.clip.findMany.mockResolvedValue([]);

      const result = await service.calculateScore('user-1');

      expect(result.score).toBe(0);
      expect(result.tier).toBe(ClipperTier.bronze);
    });

    it('should calculate score correctly for a clipper with approved clips', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago

      mockPrisma.clip.findMany.mockResolvedValue([
        { id: 'clip-1', viewsVerified: 5000, createdAt: recentDate, campaign: {} },
        { id: 'clip-2', viewsVerified: 5000, createdAt: recentDate, campaign: {} },
      ]);
      // 2 approved out of 2 total = 100% approval
      mockPrisma.clip.count.mockResolvedValue(2);
      mockPrisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 4 },
      ]);

      const result = await service.calculateScore('user-1');

      // views: 10000 / 100 = 100, capped at 100, * 0.3 = 30
      // approval: 100 * 0.25 = 25
      // rating: (4.5/5)*100 = 90, * 0.25 = 22.5
      // consistency: 2 recent clips * 20 = 40, * 0.2 = 8
      // total = 30 + 25 + 22.5 + 8 = 85.5 -> 86
      expect(result.score).toBe(86);
      expect(result.tier).toBe(ClipperTier.gold);
    });

    it('should return platinum tier for score >= 90', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 5 clips with very high views, all recent, all approved, all 5-star
      mockPrisma.clip.findMany.mockResolvedValue([
        { id: 'clip-1', viewsVerified: 20000, createdAt: recentDate, campaign: {} },
        { id: 'clip-2', viewsVerified: 20000, createdAt: recentDate, campaign: {} },
        { id: 'clip-3', viewsVerified: 20000, createdAt: recentDate, campaign: {} },
        { id: 'clip-4', viewsVerified: 20000, createdAt: recentDate, campaign: {} },
        { id: 'clip-5', viewsVerified: 20000, createdAt: recentDate, campaign: {} },
      ]);
      mockPrisma.clip.count.mockResolvedValue(5);
      mockPrisma.review.findMany.mockResolvedValue([
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
      ]);

      const result = await service.calculateScore('user-1');

      // views: 100000/100 = 1000, capped at 100, * 0.3 = 30
      // approval: 100 * 0.25 = 25
      // rating: 100 * 0.25 = 25
      // consistency: min(100, 5*20)=100, * 0.2 = 20
      // total = 30+25+25+20 = 100
      expect(result.score).toBe(100);
      expect(result.tier).toBe(ClipperTier.platinum);
    });

    it('should use default rating 3 when no reviews exist', async () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      mockPrisma.clip.findMany.mockResolvedValue([
        { id: 'clip-1', viewsVerified: 0, createdAt: recentDate, campaign: {} },
      ]);
      mockPrisma.clip.count.mockResolvedValue(1);
      mockPrisma.review.findMany.mockResolvedValue([]);

      const result = await service.calculateScore('user-1');

      // views: 0 * 0.3 = 0
      // approval: 100 * 0.25 = 25
      // rating: (3/5)*100 = 60, * 0.25 = 15
      // consistency: 1 recent * 20 = 20, * 0.2 = 4
      // total = 0 + 25 + 15 + 4 = 44
      expect(result.score).toBe(44);
      expect(result.tier).toBe(ClipperTier.silver);
    });
  });

  describe('recalculateAll', () => {
    it('should update all clippers and return count', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'clipper-1' },
        { id: 'clipper-2' },
      ]);
      // calculateScore calls clip.findMany, then possibly count and review.findMany
      mockPrisma.clip.findMany.mockResolvedValue([]);
      mockPrisma.user.update.mockResolvedValue({});

      const updated = await service.recalculateAll();

      expect(updated).toBe(2);
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clipperScore: 0, clipperTier: ClipperTier.bronze }),
        }),
      );
    });

    it('should return 0 when there are no clippers', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const updated = await service.recalculateAll();

      expect(updated).toBe(0);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});
