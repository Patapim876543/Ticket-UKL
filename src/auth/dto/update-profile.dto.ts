import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nama Baru' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'email@baru.com' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '08211111999' })
  @IsOptional() @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'passwordLama123' })
  @IsOptional() @IsString()
  current_password?: string;

  @ApiPropertyOptional({ example: 'passwordBaru123' })
  @IsOptional() @IsString() @MinLength(6)
  new_password?: string;
}
