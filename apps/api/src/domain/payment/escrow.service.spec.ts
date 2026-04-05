import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import { XenditService } from '../../infrastructure/payment/xendit.service';

const mockCampaign = {
  id: 'campaign-1',
  ownerId: 'owner-1',
  type: 'bounty',
  title: 'Test Campaign',
  description: 'Test',
  ratePerKViews: 5000,
  budgetTotal: 1000000,
  budgetSpent: 0,
  status: 'draft',
  owner: { id: 'owner-1', email: 'owner@example.com' },
};

const mockEscrow = {
  id: 'escrow-1',
  campaignId: 'campaign-1',
  totalDeposited: 0,
  totalReleased: 0,
  totalRefunded: 0,
  balance: 500000,
  status: 'active',
};

const mockClip = {
  id: 'clip-1',
  campaignId: 'campaign-1',
  clipperId: 'clipper-1',
  viewsVerified: 10000,
  earningsAmount: 0,
  status: 'approved',
  campaign: {
    id: 'campaign-1',
    ownerId: 'owner-1',
    type: 'bounty',
    title: 'Test Campaign',
    ratePerKViews: 5000,
    budgetTotal: 1000000,
    budgetSpent: 0,
    status: 'active',
  },
};

const mockTransaction = {
  id: 'tx-1',
  type: 'deposit',
  fromUserId: 'owner-1',
  campaignId: 'campaign-1',
  amount: 500000,
  currency: 'IDR',
  status: 'pending',
  paymentReference: 'deposit-campaign-1-1234567890',
};

const mockPrisma = {
  campaign: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  escrowAccount: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  clip: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockXendit = {
  createInvoice: jest.fn(),
};

describe('EscrowService', () => {
  let service: EscrowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: XenditService, useValue: mockXendit },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────
  //  deposit()
  // ─────────────────────────────────────────
  describe('deposit()', () => {
    it('should create invoice and pending transaction (existing escrow)', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(mockEscrow);
      mockXendit.createInvoice.mockResolvedValue({
        invoiceId: 'inv-1',
        invoiceUrl: 'https://checkout.xendit.co/mock/deposit-campaign-1-xxx',
      });
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx-new' });

      const result = await service.deposit('campaign-1', 500000, 'owner-1');

      expect(result.invoiceUrl).toContain('checkout.xendit.co');
      expect(result.transactionId).toBe('tx-new');
      expect(mockXendit.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 500000 }),
      );
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'deposit', status: 'pending', amount: 500000 }),
        }),
      );
    });

    it('should create a new escrow account if none exists', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(null);
      mockPrisma.escrowAccount.create.mockResolvedValue(mockEscrow);
      mockXendit.createInvoice.mockResolvedValue({
        invoiceId: 'inv-1',
        invoiceUrl: 'https://checkout.xendit.co/mock/test',
      });
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx-new' });

      await service.deposit('campaign-1', 500000, 'owner-1');

      expect(mockPrisma.escrowAccount.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ campaignId: 'campaign-1' }) }),
      );
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.deposit('non-existent', 500000, 'owner-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─────────────────────────────────────────
  //  releaseForClip()
  // ─────────────────────────────────────────
  describe('releaseForClip()', () => {
    it('should calculate earnings correctly for bounty (10% fee)', async () => {
      mockPrisma.clip.findUnique.mockResolvedValue(mockClip);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.clip.update.mockResolvedValue({});
      mockPrisma.campaign.update.mockResolvedValue({
        ...mockClip.campaign,
        budgetSpent: 50000,
        budgetTotal: 1000000,
        status: 'active',
      });

      await service.releaseForClip('clip-1');

      // views=10000, rate=5000/1000 = 5 per view, earnings = 10000*5000/1000 = 50000
      // fee = 50000 * 0.10 = 5000, net = 45000
      expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(2);

      // First call should be payout
      expect(mockPrisma.transaction.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: expect.objectContaining({ type: 'payout', amount: 45000 }),
        }),
      );
      // Second call should be fee
      expect(mockPrisma.transaction.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: expect.objectContaining({ type: 'fee', amount: 5000 }),
        }),
      );

      // Escrow should be decremented by full earnings (50000)
      expect(mockPrisma.escrowAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalReleased: { increment: 50000 },
            balance: { decrement: 50000 },
          }),
        }),
      );

      // Clip earningsAmount = net payout
      expect(mockPrisma.clip.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ earningsAmount: 45000 }),
        }),
      );
    });

    it('should auto-pause campaign at 80% budget', async () => {
      const heavySpendCampaign = {
        ...mockClip.campaign,
        budgetSpent: 850000,
        budgetTotal: 1000000,
        status: 'active',
      };
      mockPrisma.clip.findUnique.mockResolvedValue({
        ...mockClip,
        campaign: { ...mockClip.campaign, budgetSpent: 800000 },
      });
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.clip.update.mockResolvedValue({});
      mockPrisma.campaign.update
        .mockResolvedValueOnce(heavySpendCampaign)
        .mockResolvedValue({}); // for pause

      await service.releaseForClip('clip-1');

      // Should have called campaign.update at least twice: increment budgetSpent + pause
      const pauseCall = mockPrisma.campaign.update.mock.calls.find(
        (call) => call[0]?.data?.status === 'paused',
      );
      expect(pauseCall).toBeDefined();
    });

    it('should throw BadRequestException if clip has no verified views', async () => {
      mockPrisma.clip.findUnique.mockResolvedValue({ ...mockClip, viewsVerified: 0 });

      await expect(service.releaseForClip('clip-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if clip not found', async () => {
      mockPrisma.clip.findUnique.mockResolvedValue(null);

      await expect(service.releaseForClip('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if escrow not found', async () => {
      mockPrisma.clip.findUnique.mockResolvedValue(mockClip);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(null);

      await expect(service.releaseForClip('clip-1')).rejects.toThrow(NotFoundException);
    });

    it('should apply 12% fee for gig campaigns', async () => {
      const gigClip = {
        ...mockClip,
        campaign: { ...mockClip.campaign, type: 'gig' },
      };
      mockPrisma.clip.findUnique.mockResolvedValue(gigClip);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.clip.update.mockResolvedValue({});
      mockPrisma.campaign.update.mockResolvedValue({
        ...gigClip.campaign,
        budgetSpent: 50000,
        status: 'active',
      });

      await service.releaseForClip('clip-1');

      // earnings = 50000, fee = 50000 * 0.12 = 6000, net = 44000
      expect(mockPrisma.transaction.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: expect.objectContaining({ type: 'payout', amount: 44000 }) }),
      );
      expect(mockPrisma.transaction.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ data: expect.objectContaining({ type: 'fee', amount: 6000 }) }),
      );
    });

    it('should apply 8% fee for podcast campaigns', async () => {
      const podcastClip = {
        ...mockClip,
        campaign: { ...mockClip.campaign, type: 'podcast' },
      };
      mockPrisma.clip.findUnique.mockResolvedValue(podcastClip);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});
      mockPrisma.clip.update.mockResolvedValue({});
      mockPrisma.campaign.update.mockResolvedValue({
        ...podcastClip.campaign,
        budgetSpent: 50000,
        status: 'active',
      });

      await service.releaseForClip('clip-1');

      // earnings = 50000, fee = 50000 * 0.08 = 4000, net = 46000
      expect(mockPrisma.transaction.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: expect.objectContaining({ type: 'payout', amount: 46000 }) }),
      );
      expect(mockPrisma.transaction.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ data: expect.objectContaining({ type: 'fee', amount: 4000 }) }),
      );
    });
  });

  // ─────────────────────────────────────────
  //  onDepositPaid() — webhook handler
  // ─────────────────────────────────────────
  describe('onDepositPaid()', () => {
    it('should mark transaction completed and update escrow balance', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({ ...mockTransaction, status: 'completed' });
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'active' });

      await service.onDepositPaid('deposit-campaign-1-1234567890', 500000);

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'completed' } }),
      );
      expect(mockPrisma.escrowAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalDeposited: { increment: 500000 },
            balance: { increment: 500000 },
          }),
        }),
      );
    });

    it('should auto-activate draft campaign on first deposit', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'draft' });
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, status: 'active' });

      await service.onDepositPaid('deposit-campaign-1-1234567890', 500000);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'active' } }),
      );
    });

    it('should be idempotent — skip if transaction already completed', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        ...mockTransaction,
        status: 'completed',
      });

      await service.onDepositPaid('deposit-campaign-1-1234567890', 500000);

      expect(mockPrisma.transaction.update).not.toHaveBeenCalled();
      expect(mockPrisma.escrowAccount.update).not.toHaveBeenCalled();
    });

    it('should handle missing transaction gracefully', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      // Should not throw
      await expect(
        service.onDepositPaid('deposit-unknown-9999', 500000),
      ).resolves.toBeUndefined();

      expect(mockPrisma.transaction.update).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────
  //  refund()
  // ─────────────────────────────────────────
  describe('refund()', () => {
    it('should refund remaining balance and update escrow status', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue(mockEscrow);
      mockPrisma.escrowAccount.update.mockResolvedValue({});
      mockPrisma.transaction.create.mockResolvedValue({});

      await service.refund('campaign-1');

      expect(mockPrisma.escrowAccount.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalRefunded: { increment: 500000 },
            balance: 0,
            status: 'refunded',
          }),
        }),
      );
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'refund', amount: 500000 }),
        }),
      );
    });

    it('should throw NotFoundException if campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.refund('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no balance to refund', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.escrowAccount.findUnique.mockResolvedValue({ ...mockEscrow, balance: 0 });

      await expect(service.refund('campaign-1')).rejects.toThrow(BadRequestException);
    });
  });
});
