import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // =========================
  // REGISTER
  // =========================
  async register(dto: RegisterDto) {
    const db = this.prisma as any;

    // cek username/email
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: dto.username },
          { email: dto.email },
        ],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Username atau email sudah digunakan.',
      );
    }

    // hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // create user
    const user = await db.user.create({
      data: {
        name: dto.name,
        username: dto.username,
        email: dto.email,
        phone: dto.phone || null,
        password: hashedPassword,
        role: 'user',
        balance: 500000,
        isActive: true,
      },
    });

    // remove password
    const { password: _pw, ...safeUser } = user;

    return {
      message: 'Pendaftaran berhasil.',
      data: safeUser,
    };
  }

  // =========================
  // LOGIN
  // =========================
  async login(dto: LoginDto) {
    const user = await (this.prisma as any).user.findFirst({
      where: {
        username: dto.username,
        role: dto.role,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Username, password, atau role salah.',
      );
    }

    const valid = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Username, password, atau role salah.',
      );
    }

    const token = this.jwt.sign({
      id: user.id,
      role: user.role,
    });

    const { password: _pw, ...userSafe } = user;

    return {
      message: 'Login berhasil.',
      data: {
        token,
        user: userSafe,
      },
    };
  }

  // =========================
  // GET PROFILE
  // =========================
  async getProfile(userId: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    const { password: _pw, ...data } = user;

    return {
      data,
    };
  }

  // =========================
  // UPDATE PROFILE
  // =========================
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });

    if (dto.new_password) {
      if (!dto.current_password) {
        throw new BadRequestException(
          'Password lama wajib diisi.',
        );
      }

      const valid = await bcrypt.compare(
        dto.current_password,
        user.password,
      );

      if (!valid) {
        throw new BadRequestException(
          'Password lama salah.',
        );
      }
    }

    const updateData: any = {};

    if (dto.name)
      updateData.name = dto.name;

    if (dto.email)
      updateData.email = dto.email;

    if (dto.phone)
      updateData.phone = dto.phone;

    if (dto.new_password) {
      updateData.password = await bcrypt.hash(
        dto.new_password,
        12,
      );
    }

    const updated = await (this.prisma as any).user.update({
      where: { id: userId },
      data: updateData,
    });

    const { password: _pw, ...data } = updated;

    return {
      message: 'Profil berhasil diperbarui.',
      data,
    };
  }
}