import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile for existing user', async () => {
      const mockUser = {
        id: 'user1',
        logtoId: 'logto-sub-123',
        email: 'rina@example.com',
        name: 'Rina',
        role: 'clipper',
        bio: null,
        avatarUrl: null,
        nicheTags: [],
        socialLinks: null,
        kycStatus: 'none',
        clipperScore: 0,
        verificationTier: 'tier0',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await controller.getProfile({ sub: 'logto-sub-123' });
      expect(result).toBeDefined();
      expect(result.email).toBe('rina@example.com');
      expect(result.name).toBe('Rina');
    });

    it('should sync new user from Logto on first access', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.upsert.mockResolvedValue({
        id: 'new-user',
        logtoId: 'logto-sub-new',
        email: 'new@example.com',
        name: 'New User',
        role: 'clipper',
        bio: null,
        avatarUrl: null,
        nicheTags: [],
        socialLinks: null,
        kycStatus: 'none',
        clipperScore: 0,
        verificationTier: 'tier0',
        emailVerified: false,
        createdAt: new Date(),
      });

      const result = await controller.getProfile({ sub: 'logto-sub-new' });
      expect(result).toBeDefined();
      expect(mockPrisma.user.upsert).toHaveBeenCalled();
    });
  });
});
