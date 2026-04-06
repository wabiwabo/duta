import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum OrgTypeEnum {
  team = 'team',
  agency = 'agency',
}

export enum OrgMemberRoleEnum {
  manager = 'manager',
  clipper = 'clipper',
  finance = 'finance',
}

export enum OrgMemberStatusEnum {
  active = 'active',
  invited = 'invited',
  removed = 'removed',
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────

export class CreateOrganizationDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: OrgTypeEnum })
  @IsEnum(OrgTypeEnum)
  type: OrgTypeEnum;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nicheTags?: string[];
}

export class InviteMemberDto {
  @ApiProperty({ description: 'User ID to invite' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: OrgMemberRoleEnum })
  @IsEnum(OrgMemberRoleEnum)
  role: OrgMemberRoleEnum;
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: OrgMemberRoleEnum })
  @IsOptional()
  @IsEnum(OrgMemberRoleEnum)
  role?: OrgMemberRoleEnum;

  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @ApiPropertyOptional({ enum: OrgMemberStatusEnum })
  @IsOptional()
  @IsEnum(OrgMemberStatusEnum)
  status?: OrgMemberStatusEnum;
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

export class OrgMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty({ type: 'string', nullable: true })
  userAvatar: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: 'string', nullable: true })
  subTeam: string | null;

  @ApiProperty({ nullable: true })
  commissionRate: number | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ type: 'string', nullable: true })
  bio: string | null;

  @ApiProperty({ nullable: true })
  logo: string | null;

  @ApiProperty({ type: [String] })
  nicheTags: string[];

  @ApiProperty()
  kybStatus: string;

  @ApiProperty()
  platformFeeRate: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: [OrgMemberResponseDto] })
  members?: OrgMemberResponseDto[];
}

export class OrgStatsResponseDto {
  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  activeCampaigns: number;

  @ApiProperty()
  averageRating: number;
}
