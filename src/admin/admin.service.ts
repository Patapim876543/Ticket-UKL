import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, TopupDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const db = this.prisma as any;
    const [totalUsers, totalOrders, totalRevenue, activeTickets] = await Promise.all([
      db.user.count({ where: { role: 'user' } }),
      db.order.count(),
      db.order.aggregate({ _sum: { totalPrice: true }, where: { status: 'aktif' } }),
      db.ticket.count({ where: { status: 'dipesan' } }),
    ]);
    return {
      data: {
        total_users:    totalUsers,
        total_orders:   totalOrders,
        total_revenue:  Number(totalRevenue._sum.totalPrice) || 0,
        active_tickets: activeTickets,
      },
    };
  }

  async getAllUsers(role?: string, search?: string, page = 1, limit = 20) {
    const db = this.prisma as any;
    const where: any = {};
    if (role)   where.role = role;
    if (search) where.OR   = [{ name: { contains: search } }, { username: { contains: search } }, { email: { contains: search } }];
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id:true, name:true, username:true, email:true, phone:true, role:true, balance:true, isActive:true, createdAt:true },
      }),
    ]);
    return { data: users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getUserById(id: string) {
    const db = this.prisma as any;
    const user = await db.user.findUnique({
      where: { id },
      select: { id:true, name:true, username:true, email:true, phone:true, role:true, balance:true, isActive:true, createdAt:true },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan.');
    return { data: user };
  }

  async createUser(dto: CreateUserDto) {
    const db = this.prisma as any;
    const password = await bcrypt.hash(dto.password, 12);
    const user = await db.user.create({
      data: { ...dto, password },
      select: { id:true, name:true, username:true, email:true, phone:true, role:true, balance:true, createdAt:true },
    });
    return { message: 'User berhasil dibuat.', data: user };
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const db = this.prisma as any;
    await this.getUserById(id);
    const data: any = { ...dto };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 12);
    const user = await db.user.update({
      where: { id }, data,
      select: { id:true, name:true, username:true, email:true, phone:true, role:true, balance:true, isActive:true },
    });
    return { message: 'User berhasil diperbarui.', data: user };
  }

  async deleteUser(id: string, adminId: string) {
    const db = this.prisma as any;
    if (id === adminId) throw new BadRequestException('Tidak bisa menghapus akun sendiri.');
    await this.getUserById(id);
    await db.user.delete({ where: { id } });
    return { message: 'User berhasil dihapus.' };
  }

  async topupBalance(id: string, dto: TopupDto, adminId: string) {
    const db = this.prisma as any;
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');
    if (user.role !== 'user') throw new BadRequestException('Topup hanya untuk role user.');

    const before = Number(user.balance);
    const after  = before + dto.amount;

    await db.$transaction([
      db.user.update({ where: { id }, data: { balance: after } }),
      db.transaction.create({
        data: { userId: id, type: 'topup', amount: dto.amount, balanceBefore: before, balanceAfter: after, description: dto.description || 'Topup oleh admin', processedBy: adminId },
      }),
    ]);
    return { message: `Topup Rp${dto.amount.toLocaleString('id-ID')} berhasil.`, data: { balance: after } };
  }

  async getAllOrders(transportType?: string, status?: string, page = 1, limit = 20) {
    const db = this.prisma as any;
    const where: any = {};
    if (status) where.status = status;
    const skip = (page - 1) * limit;
    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user:      { select: { id:true, name:true, username:true, email:true } },
          processor: { select: { id:true, name:true, role:true } },
          ticket:    { include: { schedule: { include: { route: true } } } },
        },
      }),
    ]);
    const filtered = transportType
      ? orders.filter((o: any) => o.ticket?.schedule?.route?.transportType === transportType)
      : orders;
    return { data: filtered, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
