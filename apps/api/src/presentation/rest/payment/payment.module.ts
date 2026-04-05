import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { EscrowService } from '../../../domain/payment/escrow.service';

@Module({
  controllers: [PaymentController],
  providers: [EscrowService],
  exports: [EscrowService],
})
export class PaymentModule {}
