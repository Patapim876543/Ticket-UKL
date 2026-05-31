import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Bayu Stang' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'bayustang' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'bayu@stang.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
