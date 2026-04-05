import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({ description: 'Deposit amount in IDR (minimum Rp 50.000)', example: 500000 })
  @IsInt()
  @Min(50000)
  amount: number;
}
