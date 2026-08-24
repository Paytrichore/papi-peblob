import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PurchasePowerDto {
  @ApiProperty({ example: 'power-red-1' })
  @IsString()
  powerId: string;
}
