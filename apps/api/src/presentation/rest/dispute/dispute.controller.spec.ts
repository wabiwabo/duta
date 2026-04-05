import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DisputeController } from './dispute.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeQueryDto } from './dto/dispute-query.dto';

const mockAdmin = {
  id: 'admin-1',
  logtoId: 'logto-admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
};

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

const mockClip = {
  id: 'clip-1',
  campaignId: 'campaign-1',
  clipperId: 'clipper-1',
  postedUrl: 'https://tiktok.com/test',
  campaign: { ownerId: 'owner-1' },
};

const mockDispute = {
  id: 'dispute-1',
  campaignId: 'campaign-1',
  clipId: null,
  raisedById: 'owner-1',
  againstId: 'clipper-1',
  reason: 'Fake views reported',
  evidence: null,
  status: 'open',
  resolution: null,
  resolvedById: null,
  createdAt: new Date('2026-01-01'),
  resolvedAt: null,
  raisedBy: { id: 'owner-1', name: 'Campaign Owner', avatarUrl: null },
  against: { id: 'clipper-1', name: 'Test Clipper', avatarUrl: null },
  campaign: { id: 'campaign-1', title: 'Test Campaign' },
  clip: null,
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  campaign: { findUnique: jest.fn() },
  clip: { findUnique: jest.fn(), findFirst: jest.fn() },
  dispute: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
};

describe('DisputeController', () => {
  let controller: DisputeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputeController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<DisputeController>(DisputeController);
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createDispute()', () => {
    const dto: CreateDisputeDto = {
      campaignId: 'campaign-1',
      againstId: 'clipper-1',
      reason: 'Fake views reported',
    };

    it('should create a dispute for campaign owner', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockOwner)  // current user
        .mockResolvedValueOnce(mockClipper); // againstId user
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findFirst.mockResolvedValue(null); // not a clipper
      mockPrisma.dispute.create.mockResolvedValue(mockDispute);

      const result = await controller.createDispute({ sub: 'logto-owner-1' }, dto);

      expect(result.id).toBe('dispute-1');
      expect(result.status).toBe('open');
      expect(mockPrisma.dispute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            raisedById: 'owner-1',
            status: 'open',
          }),
        }),
      );
    });

    it('should create a dispute for clipper', async () => {
      const clipperDto: CreateDisputeDto = {
        campaignId: 'campaign-1',
        againstId: 'owner-1',
        reason: 'Unfair rejection',
      };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockClipper)
        .mockResolvedValueOnce(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findFirst.mockResolvedValue(mockClip); // is a clipper
      mockPrisma.dispute.create.mockResolvedValue({ ...mockDispute, raisedById: 'clipper-1', againstId: 'owner-1' });

      const result = await controller.createDispute({ sub: 'logto-clipper-1' }, clipperDto);
      expect(result.id).toBe('dispute-1');
    });

    it('should throw BadRequestException if neither campaignId nor clipId provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      const badDto: CreateDisputeDto = { againstId: 'clipper-1', reason: 'Test' };

      await expect(controller.createDispute({ sub: 'logto-owner-1' }, badDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      const stranger = { ...mockClipper, id: 'stranger-1', logtoId: 'logto-stranger-1' };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(stranger)
        .mockResolvedValueOnce(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.clip.findFirst.mockResolvedValue(null);

      await expect(
        controller.createDispute({ sub: 'logto-stranger-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(controller.createDispute({ sub: 'logto-x' }, dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('listDisputes()', () => {
    const query: DisputeQueryDto = { page: 1, limit: 20 };

    it('should list disputes for current user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.dispute.findMany.mockResolvedValue([mockDispute]);
      mockPrisma.dispute.count.mockResolvedValue(1);

      const result = await controller.listDisputes({ sub: 'logto-owner-1' }, query);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.dispute.findMany.mockResolvedValue([]);
      mockPrisma.dispute.count.mockResolvedValue(0);

      await controller.listDisputes({ sub: 'logto-owner-1' }, { status: 'open', page: 1, limit: 20 });

      const findManyCall = mockPrisma.dispute.findMany.mock.calls[0][0];
      expect(findManyCall.where).toMatchObject({ status: 'open' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.listDisputes({ sub: 'logto-x' }, query)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getDispute()', () => {
    it('should return dispute for involved party', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);

      const result = await controller.getDispute('dispute-1', { sub: 'logto-owner-1' });
      expect(result.id).toBe('dispute-1');
    });

    it('should return dispute for admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);

      const result = await controller.getDispute('dispute-1', { sub: 'logto-admin-1' });
      expect(result.id).toBe('dispute-1');
    });

    it('should throw ForbiddenException for uninvolved party', async () => {
      const stranger = { ...mockClipper, id: 'stranger-1', logtoId: 'logto-stranger-1', role: 'clipper' };
      mockPrisma.user.findUnique.mockResolvedValue(stranger);
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);

      await expect(controller.getDispute('dispute-1', { sub: 'logto-stranger-1' })).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if dispute not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      await expect(controller.getDispute('dispute-x', { sub: 'logto-owner-1' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveDispute()', () => {
    const dto: ResolveDisputeDto = { resolution: 'Ruled in favor of campaign owner' };

    it('should resolve dispute as admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.dispute.findUnique.mockResolvedValue(mockDispute);
      mockPrisma.dispute.update.mockResolvedValue({
        ...mockDispute,
        status: 'resolved',
        resolution: dto.resolution,
        resolvedById: 'admin-1',
        resolvedAt: new Date(),
      });

      const result = await controller.resolveDispute('dispute-1', { sub: 'logto-admin-1' }, dto);

      expect(result.status).toBe('resolved');
      expect(result.resolution).toBe(dto.resolution);
      expect(mockPrisma.dispute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'resolved',
            resolvedById: 'admin-1',
          }),
        }),
      );
    });

    it('should throw ForbiddenException for non-admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      await expect(
        controller.resolveDispute('dispute-1', { sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already resolved', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.dispute.findUnique.mockResolvedValue({ ...mockDispute, status: 'resolved' });

      await expect(
        controller.resolveDispute('dispute-1', { sub: 'logto-admin-1' }, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if dispute not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.dispute.findUnique.mockResolvedValue(null);

      await expect(
        controller.resolveDispute('dispute-x', { sub: 'logto-admin-1' }, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
