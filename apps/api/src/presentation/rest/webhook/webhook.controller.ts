import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../shared/decorators/public.decorator';
import { XenditService } from '../../../infrastructure/payment/xendit.service';
import { EscrowService } from '../../../domain/payment/escrow.service';

interface XenditInvoiceCallback {
  id: string;
  external_id: string;
  status: 'PAID' | 'EXPIRED' | string;
  amount: number;
  payer_email?: string;
  payment_method?: string;
  paid_at?: string;
}

interface XenditDisbursementCallback {
  id: string;
  external_id: string;
  status: 'COMPLETED' | 'FAILED' | string;
  amount: number;
  bank_code?: string;
  account_holder_name?: string;
}

@ApiTags('Webhooks')
@Throttle({ default: { ttl: 60000, limit: 10 } })
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly xenditService: XenditService,
    private readonly escrowService: EscrowService,
  ) {}

  @Post('xendit')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xendit payment webhook (invoice & disbursement callbacks)' })
  async handleXenditWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() body: XenditInvoiceCallback | XenditDisbursementCallback,
  ): Promise<{ received: boolean }> {
    if (!this.xenditService.verifyWebhookToken(callbackToken)) {
      this.logger.warn('Invalid Xendit webhook token');
      throw new UnauthorizedException('Invalid webhook token');
    }

    this.logger.log(`Xendit webhook received: external_id=${body.external_id} status=${body.status}`);

    // Determine callback type by external_id prefix
    const externalId = body.external_id;

    if (externalId.startsWith('deposit-')) {
      await this.handleInvoiceCallback(body as XenditInvoiceCallback);
    } else if (externalId.startsWith('payout-')) {
      await this.handleDisbursementCallback(body as XenditDisbursementCallback);
    } else {
      this.logger.warn(`Unknown external_id format: ${externalId}`);
    }

    return { received: true };
  }

  private async handleInvoiceCallback(callback: XenditInvoiceCallback): Promise<void> {
    this.logger.log(
      `Invoice callback: id=${callback.id} external_id=${callback.external_id} status=${callback.status}`,
    );

    if (callback.status === 'PAID') {
      this.logger.log(
        `Invoice PAID: external_id=${callback.external_id} amount=${callback.amount}`,
      );
      await this.escrowService.onDepositPaid(callback.external_id, callback.amount);
    } else if (callback.status === 'EXPIRED') {
      this.logger.log(`Invoice EXPIRED: external_id=${callback.external_id}`);
      // TODO (escrow system): mark deposit transaction as expired/failed
    }
  }

  private async handleDisbursementCallback(callback: XenditDisbursementCallback): Promise<void> {
    this.logger.log(
      `Disbursement callback: id=${callback.id} external_id=${callback.external_id} status=${callback.status}`,
    );

    if (callback.status === 'COMPLETED') {
      this.logger.log(
        `Disbursement COMPLETED: external_id=${callback.external_id} amount=${callback.amount}`,
      );
      // TODO (earnings system): mark payout transaction as completed
      // e.g., await this.earningsService.completePayout(callback.external_id);
    } else if (callback.status === 'FAILED') {
      this.logger.log(`Disbursement FAILED: external_id=${callback.external_id}`);
      // TODO (earnings system): mark payout transaction as failed, return funds
    }
  }
}
