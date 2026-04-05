import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogtoAuthGuard } from './logto-auth.guard';
import { Reflector } from '@nestjs/core';

describe('LogtoAuthGuard', () => {
  let guard: LogtoAuthGuard;
  let configService: Partial<ConfigService>;
  let reflector: Partial<Reflector>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          LOGTO_JWKS_URI: 'http://localhost:3302/oidc/jwks',
          LOGTO_AUDIENCE: 'https://api.duta.val.id',
        };
        return config[key];
      }),
    };
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    guard = new LogtoAuthGuard(
      configService as ConfigService,
      reflector as Reflector,
    );
  });

  it('should throw UnauthorizedException when no authorization header', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow public routes', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException for invalid bearer format', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Basic abc' } }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
