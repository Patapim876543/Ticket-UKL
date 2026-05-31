import { Controller, Post, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('🔑 Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login — semua role' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lihat profil sendiri' })
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profil sendiri' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }

 @Post('register')
@ApiOperation({ summary: 'Daftar akun baru' })
register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

 
}

