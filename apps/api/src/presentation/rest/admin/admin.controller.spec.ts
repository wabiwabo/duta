import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { AdminGuard } from '../../../shared/guards/admin.guard';
import {
  AdminUserQueryDto,
  AdminCampaignQueryDto,
  AdminUserActionDto,
  AdminUserAction,
} from './dto/admin.dto';

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
  kycStatus: 'none',
  bio: null,
  avatarUrl: null,
  clipperScore: 0,
  verificationTier: 'tier0',
  emailVerified: true,
  createdAt: new Date('2026-01-01'),
};

const mockClipper = {
  id: 'clipper-1',
  email: 'clipper@example.com',
  name: 'Clipper User',
  role: 'clipper',
  kycStatus: 'none',
  bio: null,
  avatarUrl: null,
  clipperScore: 0,
  verificationTier: 'tier0',
  emailVerified: true,
  createdAt: new Date('2026-01-01'),
};

const mockCampaign = {
  id: 'campaign-1',
  ownerId: 'owner-1',
  type: 'bounty',
  title: 'Test Campaign',
  status: 'active',
  budgetTotal: 1000000,
  budgetSpent: 0,
  deadline: null,
  createdAt: new Date('2026-01-01'),
};

describe('AdminController', () => {
  let controller: AdminController;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      campaign: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      clip: {
        count: jest.fn(),
      },
      escrowAccount: {
        aggregate: jest.fn(),
      },
      transaction: {
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: AdminGuard,
          useValue: { canActivate: jest.fn().mockResolvedValue(true) },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    prismaService = module.get(PrismaService);
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockClipper]);
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const query: AdminUserQueryDto = { page: 1, limit: 20 };
      const result = await controller.listUsers(query);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by role', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockClipper]);
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const query: AdminUserQueryDto = { page: 1, limit: 20, role: 'clipper' };
      await controller.listUsers(query);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: 'clipper' } }),
      );
    });

    it('should filter by kycStatus', async () => {
      (prismaService.user.findMany as jest.Mock).mockResolvedValue([mockClipper]);
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const query: AdminUserQueryDto = { page: 1, limit: 20, kycStatus: 'pending' };
      await controller.listUsers(query);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { kycStatus: 'pending' } }),
      );
    });
  });

  describe('listCampaigns', () => {
    it('should return paginated campaigns', async () => {
      (prismaService.campaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);
      (prismaService.campaign.count as jest.Mock).mockResolvedValue(1);

      const query: AdminCampaignQueryDto = { page: 1, limit: 20 };
      const result = await controller.listCampaigns(query);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by status', async () => {
      (prismaService.campaign.findMany as jest.Mock).mockResolvedValue([mockCampaign]);
      (prismaService.campaign.count as jest.Mock).mockResolvedValue(1);

      const query: AdminCampaignQueryDto = { page: 1, limit: 20, status: 'active' };
      await controller.listCampaigns(query);

      expect(prismaService.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'active' } }),
      );
    });
  });

  describe('getStats', () => {
    it('should return platform statistics', async () => {
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(150)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50);
      (prismaService.campaign.count as jest.Mock)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(15);
      (prismaService.clip.count as jest.Mock).mockResolvedValue(500);
      (prismaService.escrowAccount.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalDeposited: 5000000 },
      });
      (prismaService.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 500000 },
      });

      const result = await controller.getStats();

      expect(result).toEqual({
        totalUsers: 150,
        totalClippers: 100,
        totalOwners: 50,
        totalCampaigns: 30,
        activeCampaigns: 15,
        totalClips: 500,
        gmv: 5000000,
        revenue: 500000,
      });
    });

    it('should handle null aggregates gracefully', async () => {
      (prismaService.user.count as jest.Mock).mockResolvedValue(0);
      (prismaService.campaign.count as jest.Mock).mockResolvedValue(0);
      (prismaService.clip.count as jest.Mock).mockResolvedValue(0);
      (prismaService.escrowAccount.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalDeposited: null },
      });
      (prismaService.transaction.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await controller.getStats();

      expect(result.gmv).toBe(0);
      expect(result.revenue).toBe(0);
    });
  });

  describe('updateUser', () => {
    it('should verify KYC for a user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockClipper);
      const updated = { ...mockClipper, kycStatus: 'verified' };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updated);

      const dto: AdminUserActionDto = { action: AdminUserAction.verify_kyc };
      const result = await controller.updateUser('clipper-1', dto);

      expect(result.kycStatus).toBe('verified');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ kycStatus: 'verified' }),
        }),
      );
    });

    it('should activate a user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockClipper);
      const updated = { ...mockClipper, emailVerified: true };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updated);

      const dto: AdminUserActionDto = { action: AdminUserAction.activate };
      const result = await controller.updateUser('clipper-1', dto);

      expect(result.emailVerified).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      const dto: AdminUserActionDto = { action: AdminUserAction.ban };
      await expect(controller.updateUser('nonexistent', dto)).rejects.toThrow(NotFoundException);
    });

    it('should suspend a user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockClipper);
      const updated = { ...mockClipper, emailVerified: false };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updated);

      const dto: AdminUserActionDto = { action: AdminUserAction.suspend };
      const result = await controller.updateUser('clipper-1', dto);

      expect(result.emailVerified).toBe(false);
    });
  });
});
