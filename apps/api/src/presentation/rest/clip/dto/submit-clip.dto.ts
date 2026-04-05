import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUrl } from 'class-validator';

export enum PlatformEnum {
  tiktok = 'tiktok',
  reels = 'reels',
  shorts = 'shorts',
}

export class SubmitClipDto {
  @ApiProperty({ description: 'TikTok/Reels/Shorts URL of the posted clip' })
  @IsUrl()
  postedUrl: string;

  @ApiProperty({ enum: PlatformEnum, description: 'Platform where the clip was posted' })
  @IsEnum(PlatformEnum)
  platform: PlatformEnum;
}
