import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ description: 'Resolution description' })
  @IsString()
  @IsNotEmpty()
  resolution: string;
}
