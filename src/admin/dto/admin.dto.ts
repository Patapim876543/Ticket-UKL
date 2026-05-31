import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum RoleEnum { admin = 'admin', petugas_kereta = 'petugas_kereta', petugas_pesawat = 'petugas_pesawat', user = 'user' }

export class CreateUserDto {
  @ApiProperty({ example: 'Nama Lengkap' }) @IsNotEmpty() @IsString() name: string;
  @ApiProperty({ example: 'username123' })  @IsNotEmpty() @IsString() username: string;
  @ApiProperty({ example: 'email@gmail.com' }) @IsEmail() email: string;
  @ApiPropertyOptional({ example: '08211111111' }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ example: 'password123' }) @IsNotEmpty() @MinLength(6) password: string;
  @ApiProperty({ enum: RoleEnum }) @IsEnum(RoleEnum) role: RoleEnum;
}

export class UpdateUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() username?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ enum: RoleEnum }) @IsOptional() @IsEnum(RoleEnum) role?: RoleEnum;
  @ApiPropertyOptional() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @MinLength(6) password?: string;
}

export class TopupDto {
  @ApiProperty({ example: 500000 }) @IsNumber() @Min(1) amount: number;
  @ApiPropertyOptional({ example: 'Top-up via transfer BCA' }) @IsOptional() @IsString() description?: string;
}
