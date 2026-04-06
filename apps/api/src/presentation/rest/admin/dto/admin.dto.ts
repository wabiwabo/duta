import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// ─── Query DTOs ─────────────────────────────────────

export class AdminUserQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['owner', 'clipper', 'admin'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ enum: ['none', 'pending', 'verified', 'rejected'] })
  @IsOptional()
  @IsString()
  kycStatus?: string;
}

export class AdminCampaignQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'paused', 'completed'] })
  @IsOptional()
  @IsString()
  status?: string;
}

// ─── Action DTO ─────────────────────────────────────

export enum AdminUserAction {
  ban = 'ban',
  suspend = 'suspend',
  activate = 'activate',
  verify_kyc = 'verify_kyc',
}

export class AdminUserActionDto {
  @ApiProperty({ enum: AdminUserAction })
  @IsEnum(AdminUserAction)
  action: AdminUserAction;
}

// ─── Response DTOs ───────────────────────────────────

export class AdminUserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() role: string;
  @ApiProperty() kycStatus: string;
  @ApiPropertyOptional({ type: 'string', nullable: true }) bio: string | null;
  @ApiPropertyOptional({ type: 'string', nullable: true }) avatarUrl: string | null;
  @ApiProperty() clipperScore: number;
  @ApiProperty() verificationTier: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() createdAt: Date;
}

export class AdminUserListResponseDto {
  @ApiProperty({ type: [AdminUserResponseDto] }) data: AdminUserResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
}

export class AdminCampaignResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() ownerId: string;
  @ApiProperty() type: string;
  @ApiProperty() title: string;
  @ApiProperty() status: string;
  @ApiProperty() budgetTotal: number;
  @ApiProperty() budgetSpent: number;
  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true }) deadline: Date | null;
  @ApiProperty() createdAt: Date;
}

export class AdminCampaignListResponseDto {
  @ApiProperty({ type: [AdminCampaignResponseDto] }) data: AdminCampaignResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
}

export class AdminStatsDto {
  @ApiProperty() totalUsers: number;
  @ApiProperty() totalClippers: number;
  @ApiProperty() totalOwners: number;
  @ApiProperty() totalCampaigns: number;
  @ApiProperty() activeCampaigns: number;
  @ApiProperty() totalClips: number;
  @ApiProperty() gmv: number;
  @ApiProperty() revenue: number;
}
