import {
  Controller,
  Get,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { ReferralService } from '../../../domain/referral/referral.service';
import { CurrentUser, AuthUser } from '../../../shared/decorators/current-user.decorator';

export class ApplyReferralDto {
  @ApiProperty({ example: 'AB12CD34' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

@ApiTags('Referral')
@ApiBearerAuth()
@Controller('api/referrals')
export class ReferralController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referralService: ReferralService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate referral code for current user' })
  @ApiCreatedResponse({ schema: { properties: { code: { type: 'string' } } } })
  async generateCode(
    @CurrentUser() authUser: AuthUser,
  ): Promise<{ code: string }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const code = await this.referralService.generateCode(user.id);
    return { code };
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply a referral code (can only be done once per user)' })
  @ApiCreatedResponse({ schema: { properties: { success: { type: 'boolean' } } } })
  async applyReferral(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: ApplyReferralDto,
  ): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    await this.referralService.applyReferral(user.id, dto.code);
    return { success: true };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get referral stats for current user' })
  @ApiOkResponse({
    schema: {
      properties: {
        totalReferred: { type: 'number' },
        totalBonus: { type: 'number' },
        referrals: { type: 'array' },
      },
    },
  })
  async getStats(@CurrentUser() authUser: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { logtoId: authUser.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    return this.referralService.getStats(user.id);
  }
}
