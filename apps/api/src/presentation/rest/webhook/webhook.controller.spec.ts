import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { XenditService } from '../../../infrastructure/payment/xendit.service';
import { EscrowService } from '../../../domain/payment/escrow.service';

const mockXenditService = {
  verifyWebhookToken: jest.fn(),
};

const mockEscrowService = {
  onDepositPaid: jest.fn().mockResolvedValue(undefined),
};

describe('WebhookController', () => {
  let controller: WebhookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: XenditService, useValue: mockXenditService },
        { provide: EscrowService, useValue: mockEscrowService },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleXenditWebhook', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      mockXenditService.verifyWebhookToken.mockReturnValue(false);

      await expect(
        controller.handleXenditWebhook('bad-token', {
          id: 'inv-1',
          external_id: 'deposit-camp-1-123',
          status: 'PAID',
          amount: 500000,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return { received: true } for a valid PAID invoice callback', async () => {
      mockXenditService.verifyWebhookToken.mockReturnValue(true);

      const result = await controller.handleXenditWebhook('valid-token', {
        id: 'inv-123',
        external_id: 'deposit-campaign-1-1234567890',
        status: 'PAID',
        amount: 500000,
        payer_email: 'creator@example.com',
      });

      expect(result).toEqual({ received: true });
      expect(mockXenditService.verifyWebhookToken).toHaveBeenCalledWith('valid-token');
    });

    it('should return { received: true } for a valid EXPIRED invoice callback', async () => {
      mockXenditService.verifyWebhookToken.mockReturnValue(true);

      const result = await controller.handleXenditWebhook('valid-token', {
        id: 'inv-456',
        external_id: 'deposit-campaign-2-9876543210',
        status: 'EXPIRED',
        amount: 300000,
      });

      expect(result).toEqual({ received: true });
    });

    it('should return { received: true } for a valid COMPLETED disbursement callback', async () => {
      mockXenditService.verifyWebhookToken.mockReturnValue(true);

      const result = await controller.handleXenditWebhook('valid-token', {
        id: 'disb-123',
        external_id: 'payout-clip-1-1234567890',
        status: 'COMPLETED',
        amount: 50000,
        bank_code: 'BCA',
      });

      expect(result).toEqual({ received: true });
    });

    it('should return { received: true } for a valid FAILED disbursement callback', async () => {
      mockXenditService.verifyWebhookToken.mockReturnValue(true);

      const result = await controller.handleXenditWebhook('valid-token', {
        id: 'disb-456',
        external_id: 'payout-clip-2-9876543210',
        status: 'FAILED',
        amount: 75000,
      });

      expect(result).toEqual({ received: true });
    });

    it('should handle unknown external_id prefix gracefully', async () => {
      mockXenditService.verifyWebhookToken.mockReturnValue(true);

      const result = await controller.handleXenditWebhook('valid-token', {
        id: 'unknown-123',
        external_id: 'unknown-prefix-abc',
        status: 'PAID',
        amount: 100000,
      });

      expect(result).toEqual({ received: true });
    });
  });
});
