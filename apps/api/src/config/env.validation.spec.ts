import { validateEnv } from './env.validation';

describe('env.validation', () => {
  it('should reject missing DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow();
  });

  it('should accept valid config', () => {
    const config = validateEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      LOGTO_ENDPOINT: 'http://localhost:3302',
      LOGTO_AUDIENCE: 'https://api.duta.val.id',
      LOGTO_JWKS_URI: 'http://localhost:3302/oidc/jwks',
      PORT: '3001',
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:3000',
    });
    expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
    expect(config.PORT).toBe(3001);
  });
});
