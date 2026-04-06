import { Module } from '@nestjs/common';
import { ReferralController } from './referral.controller';
import { ReferralDomainModule } from '../../../domain/referral/referral.module';

@Module({
  imports: [ReferralDomainModule],
  controllers: [ReferralController],
})
export class ReferralModule {}
