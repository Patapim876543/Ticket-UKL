import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TransportTypeEnum { kereta = 'kereta', pesawat = 'pesawat' }

export class CreateRouteDto {
  @ApiProperty({ enum: TransportTypeEnum }) @IsEnum(TransportTypeEnum) transportType: TransportTypeEnum;
  @ApiProperty({ example: 'Malang' })       @IsNotEmpty() @IsString()  origin: string;
  @ApiProperty({ example: 'Surabaya' })     @IsNotEmpty() @IsString()  destination: string;
  @ApiPropertyOptional({ example: 'ML' })   @IsOptional() @IsString()  originCode?: string;
  @ApiPropertyOptional({ example: 'SB' })   @IsOptional() @IsString()  destinationCode?: string;
  @ApiPropertyOptional({ example: 89 })     @IsOptional() @IsNumber()  distanceKm?: number;
}

export class UpdateRouteDto {
  @ApiPropertyOptional() @IsOptional() @IsString()  origin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  destination?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  originCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString()  destinationCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber()  distanceKm?: number;
  @ApiPropertyOptional() @IsOptional()              isActive?: boolean;
}
