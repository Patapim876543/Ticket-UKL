import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum RoleLogin {
  admin           = 'admin',
  petugas_kereta  = 'petugas_kereta',
  petugas_pesawat = 'petugas_pesawat',
  user            = 'user',
}

export class LoginDto {
  @ApiProperty({ example: 'rudi123' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ enum: RoleLogin, example: RoleLogin.user })
  @IsEnum(RoleLogin)
  role: RoleLogin;
}
