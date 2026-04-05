import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min, IsNotEmpty } from 'class-validator';

export class WithdrawalDto {
  @ApiProperty({ description: 'Amount to withdraw in IDR (minimum 50000)', example: 100000 })
  @IsInt()
  @Min(50000, { message: 'Minimum withdrawal amount is Rp 50.000' })
  amount: number;

  @ApiProperty({ description: 'Bank/e-wallet code (e.g., BCA, OVO, GOPAY)', example: 'BCA' })
  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @ApiProperty({ description: 'Bank/e-wallet account number', example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ description: 'Account holder name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;
}
