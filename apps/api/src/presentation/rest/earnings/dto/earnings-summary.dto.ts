import { ApiProperty } from '@nestjs/swagger';

export class EarningsSummaryDto {
  @ApiProperty({ description: 'Total completed payout earnings in IDR' })
  earned: number;

  @ApiProperty({ description: 'Sum of pending payout transactions in IDR' })
  pending: number;

  @ApiProperty({ description: 'Available balance for withdrawal (earned - withdrawn) in IDR' })
  available: number;

  @ApiProperty({ description: 'Total amount already withdrawn in IDR' })
  withdrawn: number;
}
