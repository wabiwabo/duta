import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReviewController } from './review.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

const mockOwner = {
  id: 'owner-1',
  logtoId: 'logto-owner-1',
  email: 'owner@example.com',
  name: 'Campaign Owner',
  role: 'owner',
};

const mockClipper = {
  id: 'clipper-1',
  logtoId: 'logto-clipper-1',
  email: 'clipper@example.com',
  name: 'Test Clipper',
  role: 'clipper',
};

const mockCampaign = {
  id: 'campaign-1',
  ownerId: 'owner-1',
  title: 'Test Campaign',
  type: 'bounty',
  status: 'active',
};

const mockTransaction = {
  id: 'tx-1',
  campaignId: 'campaign-1',
  fromUserId: 'owner-1',
  toUserId: 'clipper-1',
  amount: 10000,
  status: 'completed',
};

const mockReview = {
  id: 'review-1',
  reviewerId: 'owner-1',
  revieweeId: 'clipper-1',
  campaignId: 'campaign-1',
  clipId: null,
  rating: 4,
  categories: { quality: 4, speed: 5, communication: 4, creativity: 3 },
  comment: 'Great work!',
  revealed: false,
  createdAt: new Date('2026-01-01'),
  reviewer: { id: 'owner-1', name: 'Campaign Owner', avatarUrl: null },
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  campaign: { findUnique: jest.fn() },
  transaction: { findFirst: jest.fn(), findMany: jest.fn() },
  review: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('ReviewController', () => {
  let controller: ReviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<ReviewController>(ReviewController);
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReview()', () => {
    const dto: CreateReviewDto = {
      revieweeId: 'clipper-1',
      campaignId: 'campaign-1',
      rating: 4,
      categories: { quality: 4, speed: 5, communication: 4, creativity: 3 },
      comment: 'Great work!',
    };

    it('should create a review successfully', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.review.create.mockResolvedValue(mockReview);

      const result = await controller.createReview({ sub: 'logto-owner-1' }, dto);

      expect(result.id).toBe('review-1');
      expect(result.rating).toBe(4);
      expect(result.revealed).toBe(false);
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reviewerId: 'owner-1',
            revieweeId: 'clipper-1',
            rating: 4,
            revealed: false,
          }),
        }),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        controller.createReview({ sub: 'logto-x' }, dto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when reviewing yourself', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ ...mockOwner, id: 'clipper-1' });

      await expect(
        controller.createReview({ sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reviewee not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(null);

      await expect(
        controller.createReview({ sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        controller.createReview({ sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if no completed transaction', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        controller.createReview({ sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if already reviewed', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.review.findFirst.mockResolvedValue(mockReview);

      await expect(
        controller.createReview({ sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPendingReviews()', () => {
    it('should return pending review list', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.transaction.findMany.mockResolvedValue([
        {
          ...mockTransaction,
          campaign: { id: 'campaign-1', title: 'Test Campaign' },
          fromUser: { id: 'owner-1', name: 'Campaign Owner' },
          toUser: { id: 'clipper-1', name: 'Test Clipper' },
        },
      ]);
      mockPrisma.review.findMany.mockResolvedValue([]);

      const result = await controller.getPendingReviews({ sub: 'logto-owner-1' });

      expect(result).toHaveLength(1);
      expect(result[0].campaignId).toBe('campaign-1');
      expect(result[0].revieweeId).toBe('clipper-1');
    });

    it('should exclude already reviewed campaigns', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.transaction.findMany.mockResolvedValue([
        {
          ...mockTransaction,
          campaign: { id: 'campaign-1', title: 'Test Campaign' },
          fromUser: { id: 'owner-1', name: 'Campaign Owner' },
          toUser: { id: 'clipper-1', name: 'Test Clipper' },
        },
      ]);
      // Already wrote a review for clipper-1 in campaign-1
      mockPrisma.review.findMany.mockResolvedValue([
        { campaignId: 'campaign-1', revieweeId: 'clipper-1' },
      ]);

      const result = await controller.getPendingReviews({ sub: 'logto-owner-1' });

      expect(result).toHaveLength(0);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.getPendingReviews({ sub: 'logto-x' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserReviews()', () => {
    it('should return only mutually revealed reviews', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      const revealedReview = { ...mockReview, revealed: true };
      mockPrisma.review.findMany.mockResolvedValue([revealedReview]);
      // Counterpart review also revealed
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'review-counter', revealed: true });

      const result = await controller.getUserReviews('clipper-1');

      expect(result.data).toHaveLength(1);
      expect(result.aggregate.totalReviews).toBe(1);
      expect(result.aggregate.averageRating).toBe(4);
    });

    it('should hide reviews when counterpart has not revealed', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      const revealedReview = { ...mockReview, revealed: true };
      mockPrisma.review.findMany.mockResolvedValue([revealedReview]);
      // Counterpart has not revealed yet
      mockPrisma.review.findFirst.mockResolvedValue(null);

      const result = await controller.getUserReviews('clipper-1');

      expect(result.data).toHaveLength(0);
      expect(result.aggregate.totalReviews).toBe(0);
    });

    it('should return empty aggregate when no reviews', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.review.findMany.mockResolvedValue([]);

      const result = await controller.getUserReviews('clipper-1');

      expect(result.data).toHaveLength(0);
      expect(result.aggregate.averageRating).toBe(0);
      expect(result.aggregate.totalReviews).toBe(0);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(controller.getUserReviews('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should calculate category averages correctly', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      const reviews = [
        {
          ...mockReview,
          id: 'r1',
          rating: 4,
          categories: { quality: 4, speed: 5 },
          revealed: true,
        },
        {
          ...mockReview,
          id: 'r2',
          rating: 2,
          categories: { quality: 2, speed: 3 },
          revealed: true,
          reviewer: { id: 'user-2', name: 'User Two', avatarUrl: null },
        },
      ];
      mockPrisma.review.findMany.mockResolvedValue(reviews);
      // Both counterparts revealed
      mockPrisma.review.findFirst.mockResolvedValue({ id: 'counter', revealed: true });

      const result = await controller.getUserReviews('clipper-1');

      expect(result.aggregate.averageRating).toBe(3);
      expect(result.aggregate.categoryAverages?.quality).toBe(3);
      expect(result.aggregate.categoryAverages?.speed).toBe(4);
    });
  });

  describe('revealReview()', () => {
    it('should reveal a review', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);
      const revealedReview = { ...mockReview, revealed: true };
      mockPrisma.review.update.mockResolvedValue(revealedReview);
      mockPrisma.review.findFirst.mockResolvedValue(null); // counterpart not yet revealed

      const result = await controller.revealReview('review-1', { sub: 'logto-owner-1' });

      expect(result.revealed).toBe(true);
      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'review-1' },
          data: { revealed: true },
        }),
      );
    });

    it('should throw ForbiddenException if not the reviewer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      // mockReview has reviewerId = owner-1, not clipper-1
      mockPrisma.review.findUnique.mockResolvedValue(mockReview);

      await expect(
        controller.revealReview('review-1', { sub: 'logto-clipper-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already revealed', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.review.findUnique.mockResolvedValue({ ...mockReview, revealed: true });

      await expect(
        controller.revealReview('review-1', { sub: 'logto-owner-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if review not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.review.findUnique.mockResolvedValue(null);

      await expect(
        controller.revealReview('nonexistent', { sub: 'logto-owner-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.revealReview('review-1', { sub: 'logto-x' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
