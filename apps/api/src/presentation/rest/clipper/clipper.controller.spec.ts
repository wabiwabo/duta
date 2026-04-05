import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClipperController } from './clipper.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { ClipperScoringService } from '../../../domain/clipper/clipper-scoring.service';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import { ClipperTier } from '@prisma/client';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockClipperScoringService = {
  recalculateAll: jest.fn(),
};

describe('ClipperController', () => {
  let controller: ClipperController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClipperController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ClipperScoringService, useValue: mockClipperScoringService },
        {
          provide: AdminGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClipperController>(ClipperController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getClipperScore', () => {
    it('should return clipper score and tier', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'clipper-1',
        role: 'clipper',
        clipperScore: 75,
        clipperTier: ClipperTier.gold,
      });

      const result = await controller.getClipperScore('clipper-1');

      expect(result.userId).toBe('clipper-1');
      expect(result.score).toBe(75);
      expect(result.tier).toBe(ClipperTier.gold);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(controller.getClipperScore('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not a clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'owner-1',
        role: 'owner',
        clipperScore: 0,
        clipperTier: ClipperTier.bronze,
      });

      await expect(controller.getClipperScore('owner-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLeaderboard', () => {
    it('should return top clippers sorted by score', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'c1', name: 'Alice', avatarUrl: null, clipperScore: 95, clipperTier: ClipperTier.platinum },
        { id: 'c2', name: 'Bob', avatarUrl: 'http://example.com/bob.jpg', clipperScore: 80, clipperTier: ClipperTier.gold },
      ]);

      const result = await controller.getLeaderboard();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].clipperScore).toBe(95);
      expect(result.data[0].clipperTier).toBe(ClipperTier.platinum);
      expect(result.data[1].clipperScore).toBe(80);
    });

    it('should return empty leaderboard when no clippers', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await controller.getLeaderboard();

      expect(result.data).toHaveLength(0);
    });
  });

  describe('recalculateScores', () => {
    it('should trigger recalculation and return count', async () => {
      mockClipperScoringService.recalculateAll.mockResolvedValue(42);

      const result = await controller.recalculateScores();

      expect(result.updated).toBe(42);
      expect(mockClipperScoringService.recalculateAll).toHaveBeenCalled();
    });
  });
});
