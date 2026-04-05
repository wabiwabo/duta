import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly secretKey: string;
  private readonly webhookToken: string;
  private readonly baseUrl = 'https://api.xendit.co';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('XENDIT_SECRET_KEY') || '';
    this.webhookToken = this.configService.get<string>('XENDIT_WEBHOOK_TOKEN') || '';
  }

  // Create an invoice for campaign deposit
  async createInvoice(params: {
    externalId: string; // e.g., "deposit-{campaignId}-{timestamp}"
    amount: number; // in IDR (e.g., 500000)
    payerEmail: string;
    description: string;
    successRedirectUrl?: string;
    failureRedirectUrl?: string;
  }): Promise<{ invoiceId: string; invoiceUrl: string }> {
    if (!this.secretKey) {
      this.logger.warn('Xendit secret key not configured — returning mock invoice');
      return {
        invoiceId: `mock-inv-${Date.now()}`,
        invoiceUrl: `https://checkout-staging.xendit.co/mock/${params.externalId}`,
      };
    }

    const response = await fetch(`${this.baseUrl}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        external_id: params.externalId,
        amount: params.amount,
        payer_email: params.payerEmail,
        description: params.description,
        currency: 'IDR',
        payment_methods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA', 'SHOPEEPAY', 'GOPAY'],
        success_redirect_url: params.successRedirectUrl,
        failure_redirect_url: params.failureRedirectUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Xendit invoice creation failed: ${error}`);
      throw new Error(`Xendit invoice creation failed: ${response.status}`);
    }

    const data = (await response.json()) as { id: string; invoice_url: string };
    return { invoiceId: data.id, invoiceUrl: data.invoice_url };
  }

  // Create a disbursement (payout to clipper)
  async createDisbursement(params: {
    externalId: string; // e.g., "payout-{clipId}-{timestamp}"
    amount: number; // in IDR
    bankCode: string; // e.g., 'BCA', 'OVO', 'GOPAY', 'DANA'
    accountNumber: string;
    accountHolderName: string;
    description: string;
  }): Promise<{ disbursementId: string; status: string }> {
    if (!this.secretKey) {
      this.logger.warn('Xendit secret key not configured — returning mock disbursement');
      return {
        disbursementId: `mock-disb-${Date.now()}`,
        status: 'PENDING',
      };
    }

    const response = await fetch(`${this.baseUrl}/disbursements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        external_id: params.externalId,
        amount: params.amount,
        bank_code: params.bankCode,
        account_holder_name: params.accountHolderName,
        account_number: params.accountNumber,
        description: params.description,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Xendit disbursement failed: ${error}`);
      throw new Error(`Xendit disbursement failed: ${response.status}`);
    }

    const data = (await response.json()) as { id: string; status: string };
    return { disbursementId: data.id, status: data.status };
  }

  // Verify webhook callback token
  verifyWebhookToken(token: string): boolean {
    if (!this.webhookToken) return true; // dev mode
    return token === this.webhookToken;
  }
}
