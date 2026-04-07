import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClipController } from './clip.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { EmailService } from '../../../infrastructure/email/email.service';
import { SubmitClipDto, PlatformEnum } from './dto/submit-clip.dto';
import { ReviewClipDto, ReviewActionEnum } from './dto/review-clip.dto';
import { ClipListQueryDto } from './dto/clip-list-query.dto';

const mockOwner = {
  id: 'owner-1',
  logtoId: 'logto-owner-1',
  email: 'owner@example.com',
  name: 'Campaign Owner',
  avatarUrl: null,
  role: 'creator',
};

const mockClipper = {
  id: 'clipper-1',
  logtoId: 'logto-clipper-1',
  email: 'clipper@example.com',
  name: 'Test Clipper',
  avatarUrl: null,
  role: 'clipper',
};

const mockCampaign = {
  id: 'campaign-1',
  ownerId: 'owner-1',
  type: 'bounty',
  title: 'Test Campaign',
  description: 'Test description',
  status: 'active',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  owner: {
    email: 'owner@example.com',
    name: 'Campaign Owner',
  },
};

const mockClip = {
  id: 'clip-1',
  campaignId: 'campaign-1',
  clipperId: 'clipper-1',
  fileKey: null,
  postedUrl: 'https://www.tiktok.com/@user/video/123',
  platform: 'tiktok',
  status: 'submitted',
  reviewFeedback: null,
  viewsVerified: 0,
  earningsAmount: 0,
  submittedAt: new Date('2026-01-01'),
  reviewedAt: null,
  createdAt: new Date('2026-01-01'),
  clipper: { id: 'clipper-1', name: 'Test Clipper', avatarUrl: null },
  campaign: { id: 'campaign-1', title: 'Test Campaign', type: 'bounty' },
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  campaign: {
    findUnique: jest.fn(),
  },
  clip: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

const mockEmailService = {
  sendClipApproved: jest.fn().mockResolvedValue(undefined),
  sendClipRejected: jest.fn().mockResolvedValue(undefined),
  sendNewClipSubmitted: jest.fn().mockResolvedValue(undefined),
};

describe('ClipController', () => {
  let controller: ClipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClipController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    controller = module.get<ClipController>(ClipController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitClip', () => {
    const submitDto: SubmitClipDto = {
      postedUrl: 'https://www.tiktok.com/@user/video/123',
      platform: PlatformEnum.tiktok,
    };

    it('should submit a clip successfully (happy path)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findFirst.mockResolvedValue(null);
      mockPrisma.clip.create.mockResolvedValue(mockClip);

      const result = await controller.submitClip('campaign-1', { sub: 'logto-clipper-1' }, submitDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('clip-1');
      expect(result.status).toBe('submitted');
      expect(result.clipper).toEqual({ id: 'clipper-1', name: 'Test Clipper', avatarUrl: null });
      expect(mockPrisma.clip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            campaignId: 'campaign-1',
            clipperId: 'clipper-1',
            status: 'submitted',
          }),
        }),
      );
    });

    it('should throw BadRequestException for inactive campaign', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'draft' });

      await expect(
        controller.submitClip('campaign-1', { sub: 'logto-clipper-1' }, submitDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not a clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      await expect(
        controller.submitClip('campaign-1', { sub: 'logto-owner-1' }, submitDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for duplicate submission', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findFirst.mockResolvedValue(mockClip);

      await expect(
        controller.submitClip('campaign-1', { sub: 'logto-clipper-1' }, submitDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.submitClip('campaign-1', { sub: 'unknown' }, submitDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        controller.submitClip('non-existent', { sub: 'logto-clipper-1' }, submitDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listCampaignClips', () => {
    const query: ClipListQueryDto = { page: 1, limit: 20 };

    it('should return all clips for campaign owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findMany.mockResolvedValue([mockClip]);
      mockPrisma.clip.count.mockResolvedValue(1);

      const result = await controller.listCampaignClips(
        'campaign-1',
        { sub: 'logto-owner-1' },
        query,
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'campaign-1' },
        }),
      );
    });

    it('should return only own clips for clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findMany.mockResolvedValue([mockClip]);
      mockPrisma.clip.count.mockResolvedValue(1);

      const result = await controller.listCampaignClips(
        'campaign-1',
        { sub: 'logto-clipper-1' },
        query,
      );

      expect(result.data).toHaveLength(1);
      expect(mockPrisma.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { campaignId: 'campaign-1', clipperId: 'clipper-1' },
        }),
      );
    });
  });

  describe('listMyClips', () => {
    it('should return all clips for the current user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.clip.findMany.mockResolvedValue([mockClip]);
      mockPrisma.clip.count.mockResolvedValue(1);

      const query: ClipListQueryDto = {};
      const result = await controller.listMyClips({ sub: 'logto-clipper-1' }, query);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clipperId: 'clipper-1' },
        }),
      );
    });
  });

  describe('getClip', () => {
    it('should return clip for the clipper', async () => {
      const clipWithOwner = {
        ...mockClip,
        campaign: { ...mockClip.campaign, ownerId: 'owner-1' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);

      const result = await controller.getClip('clip-1', { sub: 'logto-clipper-1' });

      expect(result.id).toBe('clip-1');
    });

    it('should return clip for the campaign owner', async () => {
      const clipWithOwner = {
        ...mockClip,
        campaign: { ...mockClip.campaign, ownerId: 'owner-1' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);

      const result = await controller.getClip('clip-1', { sub: 'logto-owner-1' });

      expect(result.id).toBe('clip-1');
    });

    it('should throw ForbiddenException for unrelated user', async () => {
      const unrelatedUser = { ...mockClipper, id: 'other-user', logtoId: 'logto-other' };
      const clipWithOwner = {
        ...mockClip,
        campaign: { ...mockClip.campaign, ownerId: 'owner-1' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(unrelatedUser);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);

      await expect(
        controller.getClip('clip-1', { sub: 'logto-other' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if clip not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.clip.findUnique.mockResolvedValue(null);

      await expect(
        controller.getClip('non-existent', { sub: 'logto-clipper-1' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reviewClip', () => {
    const clipWithOwner = {
      ...mockClip,
      campaign: { ...mockClip.campaign, ownerId: 'owner-1' },
    };

    it('should approve a clip (happy path)', async () => {
      const approvedClip = { ...mockClip, status: 'approved', reviewedAt: new Date() };
      const approvedClipWithOwner = {
        ...approvedClip,
        campaign: { ...mockClip.campaign, ownerId: 'owner-1' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);
      mockPrisma.clip.update.mockResolvedValue(approvedClipWithOwner);

      const dto: ReviewClipDto = { action: ReviewActionEnum.approve };
      const result = await controller.reviewClip('clip-1', { sub: 'logto-owner-1' }, dto);

      expect(result.status).toBe('approved');
      expect(mockPrisma.clip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'approved' }),
        }),
      );
    });

    it('should reject clip with feedback', async () => {
      const rejectedClip = {
        ...mockClip,
        status: 'rejected',
        reviewFeedback: 'Poor quality',
        reviewedAt: new Date(),
        campaign: { ...mockClip.campaign, ownerId: 'owner-1' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);
      mockPrisma.clip.update.mockResolvedValue(rejectedClip);

      const dto: ReviewClipDto = { action: ReviewActionEnum.reject, feedback: 'Poor quality' };
      const result = await controller.reviewClip('clip-1', { sub: 'logto-owner-1' }, dto);

      expect(result.status).toBe('rejected');
    });

    it('should throw BadRequestException when reject has no feedback', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);

      const dto: ReviewClipDto = { action: ReviewActionEnum.reject };
      await expect(
        controller.reviewClip('clip-1', { sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when revision has no feedback', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);

      const dto: ReviewClipDto = { action: ReviewActionEnum.revision };
      await expect(
        controller.reviewClip('clip-1', { sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if not campaign owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.clip.findUnique.mockResolvedValue(clipWithOwner);

      const dto: ReviewClipDto = { action: ReviewActionEnum.approve };
      await expect(
        controller.reviewClip('clip-1', { sub: 'logto-clipper-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if clip not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.clip.findUnique.mockResolvedValue(null);

      const dto: ReviewClipDto = { action: ReviewActionEnum.approve };
      await expect(
        controller.reviewClip('non-existent', { sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
