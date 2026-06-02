import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const db = this.prisma as any;
    const u = await db.user.findUnique({
      where: { id: userId },
      select: { id:true, name:true, username:true, balance:true },
    });
    return { data: { ...u, formatted: `Rp${Number(u.balance).toLocaleString('id-ID')}` } };
  }

  async getTransactions(userId: string, type?: string, page = 1, limit = 20) {
    const db = this.prisma as any;
    const where: any = { userId };
    if (type) where.type = type;

    const [total, data] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({ where, skip: (page-1)*limit, take: limit, orderBy: { createdAt: 'desc' } }),
    ]);
    return { data, pagination: { total, page, limit, pages: Math.ceil(total/limit) } };
  }

  async getCSContact(transportType?: string) {
    const db = this.prisma as any;
    const where: any = {};
    if (transportType) where.transportType = transportType;

    const data = await db.csContact.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return { message: 'Kontak customer service.', data };
  }

  async searchTickets(transportType: string, origin: string, destination: string, date?: string, seatClass?: string) {
    const db = this.prisma as any;
    if (!transportType || !origin || !destination) return { data: [] };

    const scheduleWhere: any = {
      isActive: true,
      status:   'scheduled',
      route: {
        transportType,
        isActive:    true,
        origin:      { contains: origin },
        destination: { contains: destination },
      },
    };

    if (date) {
      const s = new Date(date); s.setHours(0, 0, 0, 0);
      const e = new Date(date); e.setHours(23, 59, 59, 999);
      scheduleWhere.departureTime = { gte: s, lte: e };
    }

    const ticketWhere: any = { status: 'tersedia' };
    if (seatClass) ticketWhere.seatClass = seatClass;

    const schedules = await db.schedule.findMany({
      where:   scheduleWhere,
      include: { route: true, tickets: { where: ticketWhere } },
      orderBy: { departureTime: 'asc' },
    });

    const data = schedules
      .filter((s: any) => s.tickets.length > 0)
      .map((s: any) => {
        const g: any = { ekonomi: [], vip: [], eksekutif: [] };
        s.tickets.forEach((t: any) => { if (g[t.seatClass]) g[t.seatClass].push(t); });
        return {
          scheduleId:    s.id,
          vehicleName:   s.vehicleName,
          vehicleCode:   s.vehicleCode,
          departureTime: s.departureTime,
          arrivalTime:   s.arrivalTime,
          route:         s.route,
          delayMinutes:  s.delayMinutes,
          gateNumber:    s.gateNumber,
          flightStatus:  s.flightStatus,
          availableSeats: {
            ekonomi:   { count: g.ekonomi.length,   minPrice: g.ekonomi.length   ? Math.min(...g.ekonomi.map((t: any)   => Number(t.price))) : null },
            vip:       { count: g.vip.length,        minPrice: g.vip.length        ? Math.min(...g.vip.map((t: any)        => Number(t.price))) : null },
            eksekutif: { count: g.eksekutif.length,  minPrice: g.eksekutif.length  ? Math.min(...g.eksekutif.map((t: any)  => Number(t.price))) : null },
          },
        };
      });

    return { total_schedules: data.length, data };
  }
}
