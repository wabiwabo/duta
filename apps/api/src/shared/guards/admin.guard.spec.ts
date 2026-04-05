import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';

function createMockContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    prismaService = module.get(PrismaService);
  });

  it('should allow admin users', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ role: 'admin' });
    const ctx = createMockContext({ sub: 'logto-admin-1' });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException for non-admin users', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ role: 'clipper' });
    const ctx = createMockContext({ sub: 'logto-clipper-1' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException when no auth user', async () => {
    const ctx = createMockContext(undefined);
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user not found in DB', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
    const ctx = createMockContext({ sub: 'unknown-logto-id' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
