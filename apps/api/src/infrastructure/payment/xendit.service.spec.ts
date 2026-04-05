import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { XenditService } from './xendit.service';

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {};
    return config[key] || '';
  }),
};

describe('XenditService (mock/dev mode)', () => {
  let service: XenditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XenditService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<XenditService>(XenditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInvoice', () => {
    it('should return a mock invoice when secretKey is not configured', async () => {
      const result = await service.createInvoice({
        externalId: 'deposit-campaign-1-1234567890',
        amount: 500000,
        payerEmail: 'creator@example.com',
        description: 'Campaign deposit: Test Campaign',
      });

      expect(result).toBeDefined();
      expect(result.invoiceId).toMatch(/^mock-inv-/);
      expect(result.invoiceUrl).toContain('mock');
      expect(result.invoiceUrl).toContain('deposit-campaign-1-1234567890');
    });

    it('should include externalId in mock invoice URL', async () => {
      const externalId = 'deposit-abc123-9999';
      const result = await service.createInvoice({
        externalId,
        amount: 100000,
        payerEmail: 'test@example.com',
        description: 'Test deposit',
      });

      expect(result.invoiceUrl).toContain(externalId);
    });
  });

  describe('createDisbursement', () => {
    it('should return a mock disbursement when secretKey is not configured', async () => {
      const result = await service.createDisbursement({
        externalId: 'payout-clip-1-1234567890',
        amount: 50000,
        bankCode: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Clipper Name',
        description: 'Earnings payout',
      });

      expect(result).toBeDefined();
      expect(result.disbursementId).toMatch(/^mock-disb-/);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('verifyWebhookToken', () => {
    it('should return true in dev mode (no webhook token configured)', () => {
      const result = service.verifyWebhookToken('any-token');
      expect(result).toBe(true);
    });

    it('should return true for empty token in dev mode', () => {
      const result = service.verifyWebhookToken('');
      expect(result).toBe(true);
    });
  });
});

describe('XenditService (with token configured)', () => {
  let service: XenditService;

  beforeEach(async () => {
    const configWithToken = {
      get: jest.fn((key: string) => {
        if (key === 'XENDIT_WEBHOOK_TOKEN') return 'my-secret-webhook-token';
        return '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XenditService,
        { provide: ConfigService, useValue: configWithToken },
      ],
    }).compile();

    service = module.get<XenditService>(XenditService);
  });

  describe('verifyWebhookToken', () => {
    it('should return true when token matches', () => {
      expect(service.verifyWebhookToken('my-secret-webhook-token')).toBe(true);
    });

    it('should return false when token does not match', () => {
      expect(service.verifyWebhookToken('wrong-token')).toBe(false);
    });

    it('should return false for empty token', () => {
      expect(service.verifyWebhookToken('')).toBe(false);
    });
  });
});
