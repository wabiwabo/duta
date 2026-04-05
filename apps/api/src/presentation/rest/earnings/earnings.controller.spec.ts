import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { EarningsController } from './earnings.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { XenditService } from '../../../infrastructure/payment/xendit.service';
import { WithdrawalDto } from './dto/withdrawal.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';

const mockClipper = {
  id: 'clipper-1',
  logtoId: 'logto-clipper-1',
  email: 'clipper@example.com',
  name: 'Test Clipper',
  role: 'clipper',
};

const mockOwner = {
  id: 'owner-1',
  logtoId: 'logto-owner-1',
  email: 'owner@example.com',
  name: 'Campaign Owner',
  role: 'owner',
};

const mockTransaction = {
  id: 'tx-1',
  type: 'payout',
  fromUserId: null,
  toUserId: 'clipper-1',
  campaignId: 'campaign-1',
  clipId: 'clip-1',
  amount: 90000,
  currency: 'IDR',
  status: 'completed',
  paymentMethod: null,
  paymentReference: 'payout-clip-1-xxx',
  createdAt: new Date('2026-01-01'),
  campaign: { id: 'campaign-1', title: 'Test Campaign' },
  clip: { id: 'clip-1', postedUrl: 'https://tiktok.com/test' },
};

const mockPrisma = {
  user: { findUnique: jest.fn() },
  transaction: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
};

const mockXendit = {
  createDisbursement: jest.fn(),
};

describe('EarningsController', () => {
  let controller: EarningsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarningsController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: XenditService, useValue: mockXendit },
      ],
    }).compile();

    controller = module.get<EarningsController>(EarningsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEarnings()', () => {
    it('should return earnings summary for clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 200000 } }) // earned
        .mockResolvedValueOnce({ _sum: { amount: 50000 } })  // pending
        .mockResolvedValueOnce({ _sum: { amount: 100000 } }); // withdrawn

      const result = await controller.getEarnings({ sub: 'logto-clipper-1' });

      expect(result.earned).toBe(200000);
      expect(result.pending).toBe(50000);
      expect(result.withdrawn).toBe(100000);
      expect(result.available).toBe(100000); // 200000 - 100000
    });

    it('should return zeros when no transactions', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } })
        .mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await controller.getEarnings({ sub: 'logto-clipper-1' });

      expect(result.earned).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.available).toBe(0);
      expect(result.withdrawn).toBe(0);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.getEarnings({ sub: 'logto-x' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for non-clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      await expect(controller.getEarnings({ sub: 'logto-owner-1' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listTransactions()', () => {
    const query: TransactionQueryDto = { page: 1, limit: 20 };

    it('should list transactions for current user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.transaction.findMany.mockResolvedValue([mockTransaction]);
      mockPrisma.transaction.count.mockResolvedValue(1);

      const result = await controller.listTransactions({ sub: 'logto-clipper-1' }, query);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.data[0].id).toBe('tx-1');
    });

    it('should filter by type', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await controller.listTransactions({ sub: 'logto-clipper-1' }, { type: 'payout', page: 1, limit: 20 });

      const findManyCall = mockPrisma.transaction.findMany.mock.calls[0][0];
      expect(findManyCall.where).toMatchObject({ type: 'payout' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.listTransactions({ sub: 'logto-x' }, query)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestWithdrawal()', () => {
    const dto: WithdrawalDto = {
      amount: 100000,
      bankCode: 'BCA',
      accountNumber: '1234567890',
      accountHolderName: 'Test Clipper',
    };

    it('should create a withdrawal transaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 200000 } }) // earned
        .mockResolvedValueOnce({ _sum: { amount: 0 } });     // withdrawn
      mockXendit.createDisbursement.mockResolvedValue({ disbursementId: 'disb-1', status: 'PENDING' });
      mockPrisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        id: 'tx-withdrawal-1',
        type: 'payout',
        fromUserId: 'clipper-1',
        toUserId: null,
        status: 'processing',
        paymentMethod: 'BCA',
        paymentReference: 'disb-1',
        amount: 100000,
      });

      const result = await controller.requestWithdrawal({ sub: 'logto-clipper-1' }, dto);

      expect(result.id).toBe('tx-withdrawal-1');
      expect(result.status).toBe('processing');
      expect(mockXendit.createDisbursement).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100000, bankCode: 'BCA' }),
      );
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockClipper);
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: 50000 } }) // earned
        .mockResolvedValueOnce({ _sum: { amount: 0 } });    // withdrawn

      await expect(
        controller.requestWithdrawal({ sub: 'logto-clipper-1' }, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for non-clipper', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      await expect(
        controller.requestWithdrawal({ sub: 'logto-owner-1' }, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(controller.requestWithdrawal({ sub: 'logto-x' }, dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
