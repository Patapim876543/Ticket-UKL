import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  private checkAccess(transportType: string, role: string) {
    if (role === 'admin') return;
    const map: Record<string, string> = { kereta: 'petugas_kereta', pesawat: 'petugas_pesawat' };
    if (role !== map[transportType])
      throw new ForbiddenException(`Akses ditolak untuk transportasi ${transportType}.`);
  }

  async getAll(transportType?: string, origin?: string, destination?: string) {
    const db = this.prisma as any;
    const where: any = { isActive: true };
    if (transportType) where.transportType = transportType;
    if (origin)        where.origin        = { contains: origin };
    if (destination)   where.destination   = { contains: destination };
    const data = await db.route.findMany({ where, orderBy: { origin: 'asc' } });
    return { data };
  }

  async create(dto: CreateRouteDto, role: string) {
    const db = this.prisma as any;
    this.checkAccess(dto.transportType, role);
    const data = await db.route.create({ data: dto });
    return { message: 'Rute berhasil dibuat.', data };
  }

  async update(id: string, dto: UpdateRouteDto, role: string) {
    const db = this.prisma as any;
    const route = await db.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Rute tidak ditemukan.');
    this.checkAccess(route.transportType, role);
    const data = await db.route.update({ where: { id }, data: dto });
    return { message: 'Rute berhasil diperbarui.', data };
  }

  async delete(id: string, role: string) {
    const db = this.prisma as any;
    const route = await db.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Rute tidak ditemukan.');
    this.checkAccess(route.transportType, role);
    await db.route.delete({ where: { id } });
    return { message: 'Rute berhasil dihapus.' };
  }
}
