import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { EscrowService } from '../../../domain/payment/escrow.service';
import { DepositDto } from './dto/deposit.dto';
import { VerifyViewsDto } from './dto/verify-views.dto';

const mockOwner = {
  id: 'owner-1',
  logtoId: 'logto-owner-1',
  email: 'owner@example.com',
  name: 'Campaign Owner',
  role: 'owner',
};

const mockAdmin = {
  id: 'admin-1',
  logtoId: 'logto-admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
};

const mockCampaign = {
  id: 'campaign-1',
  ownerId: 'owner-1',
  title: 'Test Campaign',
  status: 'draft',
};

const mockClip = {
  id: 'clip-1',
  campaignId: 'campaign-1',
  clipperId: 'clipper-1',
  status: 'approved',
  viewsVerified: 0,
  earningsAmount: 0,
};

const mockEscrow = {
  id: 'escrow-1',
  campaignId: 'campaign-1',
  totalDeposited: 500000,
  totalReleased: 0,
  totalRefunded: 0,
  balance: 500000,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  campaign: { findUnique: jest.fn() },
  clip: { findUnique: jest.fn(), update: jest.fn() },
};

const mockEscrowService = {
  deposit: jest.fn(),
  getEscrow: jest.fn(),
  releaseForClip: jest.fn(),
};

describe('PaymentController', () => {
  let controller: PaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EscrowService, useValue: mockEscrowService },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('depositToCampaign()', () => {
    const dto: DepositDto = { amount: 500000 };

    it('should create deposit invoice for campaign owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockEscrowService.deposit.mockResolvedValue({
        invoiceUrl: 'https://checkout.xendit.co/mock/deposit-campaign-1-xxx',
        transactionId: 'tx-1',
      });

      const result = await controller.depositToCampaign('campaign-1', { sub: 'logto-owner-1' }, dto);

      expect(result.invoiceUrl).toContain('checkout.xendit.co');
      expect(result.transactionId).toBe('tx-1');
      expect(mockEscrowService.deposit).toHaveBeenCalledWith('campaign-1', 500000, 'owner-1');
    });

    it('should throw ForbiddenException if not campaign owner', async () => {
      const otherUser = { ...mockOwner, id: 'other-user' };
      mockPrisma.user.findUnique.mockResolvedValue(otherUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign); // ownerId = owner-1

      await expect(
        controller.depositToCampaign('campaign-1', { sub: 'logto-other' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(
        controller.depositToCampaign('non-existent', { sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        controller.depositToCampaign('campaign-1', { sub: 'unknown' }, dto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getEscrow()', () => {
    it('should return escrow details for campaign owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockEscrowService.getEscrow.mockResolvedValue(mockEscrow);

      const result = await controller.getEscrow('campaign-1', { sub: 'logto-owner-1' });

      expect(result).toEqual(mockEscrow);
      expect(mockEscrowService.getEscrow).toHaveBeenCalledWith('campaign-1');
    });

    it('should throw ForbiddenException for non-owner', async () => {
      const otherUser = { ...mockOwner, id: 'other-user' };
      mockPrisma.user.findUnique.mockResolvedValue(otherUser);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      await expect(
        controller.getEscrow('campaign-1', { sub: 'logto-other' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyClipViews()', () => {
    const dto: VerifyViewsDto = { views: 10000 };

    it('should verify views and release earnings (admin only)', async () => {
      const updatedClip = { ...mockClip, viewsVerified: 10000, earningsAmount: 45000 };
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.clip.findUnique
        .mockResolvedValueOnce(mockClip)      // existence + status check
        .mockResolvedValueOnce(updatedClip);  // fetch after update
      mockPrisma.clip.update.mockResolvedValue(updatedClip);
      mockEscrowService.releaseForClip.mockResolvedValue(undefined);

      const result = await controller.verifyClipViews('clip-1', { sub: 'logto-admin-1' }, dto);

      expect(result.clipId).toBe('clip-1');
      expect(result.viewsVerified).toBe(10000);
      expect(result.earningsAmount).toBe(45000);
    });

    it('should throw ForbiddenException if user is not admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner); // role = owner, not admin

      await expect(
        controller.verifyClipViews('clip-1', { sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if clip is not approved', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.clip.findUnique.mockResolvedValue({ ...mockClip, status: 'submitted' });

      await expect(
        controller.verifyClipViews('clip-1', { sub: 'logto-admin-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if clip not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin);
      mockPrisma.clip.findUnique.mockResolvedValue(null);

      await expect(
        controller.verifyClipViews('non-existent', { sub: 'logto-admin-1' }, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
