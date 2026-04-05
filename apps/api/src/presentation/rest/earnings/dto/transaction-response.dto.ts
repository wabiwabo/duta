import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['deposit', 'payout', 'refund', 'fee'] })
  type: string;

  @ApiPropertyOptional()
  fromUserId?: string | null;

  @ApiPropertyOptional()
  toUserId?: string | null;

  @ApiPropertyOptional()
  campaignId?: string | null;

  @ApiPropertyOptional()
  clipId?: string | null;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ['pending', 'processing', 'completed', 'failed'] })
  status: string;

  @ApiPropertyOptional()
  paymentMethod?: string | null;

  @ApiPropertyOptional()
  paymentReference?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Campaign basic info' })
  campaign?: { id: string; title: string } | null;

  @ApiPropertyOptional({ description: 'Clip basic info' })
  clip?: { id: string; postedUrl: string | null } | null;
}

export class TransactionListResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;
}
