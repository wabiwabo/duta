import { Controller, Get, Patch, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('User')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  async getProfile(@CurrentUser() user: AuthUser): Promise<UserProfileDto> {
    let dbUser = await this.prisma.user.findUnique({
      where: { logtoId: user.sub },
    });

    if (!dbUser) {
      // First-time login: create user from Logto claims
      dbUser = await this.prisma.user.upsert({
        where: { logtoId: user.sub },
        update: {},
        create: {
          logtoId: user.sub,
          email: (user as unknown as Record<string, string>).email ?? `${user.sub}@logto.local`,
          name: (user as unknown as Record<string, string>).name ?? 'New User',
          role: 'clipper',
        },
      });
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      bio: dbUser.bio,
      avatarUrl: dbUser.avatarUrl,
      nicheTags: dbUser.nicheTags,
      socialLinks: dbUser.socialLinks as Record<string, string> | null,
      kycStatus: dbUser.kycStatus,
      clipperScore: dbUser.clipperScore,
      verificationTier: dbUser.verificationTier,
      emailVerified: dbUser.emailVerified,
      createdAt: dbUser.createdAt,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserProfileDto })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    const dbUser = await this.prisma.user.findUnique({
      where: { logtoId: user.sub },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: dbUser.id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.nicheTags && { nicheTags: dto.nicheTags }),
        ...(dto.socialLinks !== undefined && { socialLinks: dto.socialLinks }),
        ...(dto.role && { role: dto.role }),
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      bio: updated.bio,
      avatarUrl: updated.avatarUrl,
      nicheTags: updated.nicheTags,
      socialLinks: updated.socialLinks as Record<string, string> | null,
      kycStatus: updated.kycStatus,
      clipperScore: updated.clipperScore,
      verificationTier: updated.verificationTier,
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt,
    };
  }
}
