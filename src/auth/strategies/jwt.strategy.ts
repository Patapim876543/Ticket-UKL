import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret',
    });
  }

  async validate(payload: { id: string; role: string }) {
    const user = await (this.prisma as any).user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Akun tidak ditemukan atau tidak aktif.');
    }
    return user;
  }
}
