import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: ['owner', 'clipper', 'admin'] }) role: string;
  @ApiPropertyOptional({ type: 'string', nullable: true }) bio: string | null;
  @ApiPropertyOptional({ type: 'string', nullable: true }) avatarUrl: string | null;
  @ApiProperty({ type: [String] }) nicheTags: string[];
  @ApiPropertyOptional({ type: Object }) socialLinks: Record<string, string> | null;
  @ApiProperty({ enum: ['none', 'pending', 'verified', 'rejected'] }) kycStatus: string;
  @ApiProperty() clipperScore: number;
  @ApiProperty({ enum: ['bronze', 'silver', 'gold', 'platinum'] }) clipperTier: string;
  @ApiProperty({ enum: ['tier0', 'tier1', 'tier2', 'tier3'] }) verificationTier: string;
  @ApiProperty() emailVerified: boolean;
  @ApiProperty() createdAt: Date;
}
