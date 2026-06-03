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
    return { status: 'success', data: { ...u, formatted: `Rp${Number(u.balance).toLocaleString('id-ID')}` } };
  }

  async getTransactions(userId: string, type?: string, page = 1, limit = 20) {
    const db = this.prisma as any;
    const where: any = { userId };
    if (type) where.type = type;
    const [total, data] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({ where, skip:(page-1)*limit, take:limit, orderBy:{ createdAt:'desc' } }),
    ]);
    return { status: 'success', data, pagination:{ total, page, limit, pages:Math.ceil(total/limit) } };
  }

  async getCSContact(transportType?: string) {
    const db = this.prisma as any;
    const where: any = {};
    if (transportType) where.transportType = transportType;
    const data = await db.csContact.findMany({ where, orderBy:{ transportType:'asc' } });
    return { status: 'success', data };
  }

  // ── Helper: generate seat tickets ────────────────────────────────────────
  private generateSeats(scheduleId: string, count: number, cls: string, prefix: string, price: number) {
    return Array.from({ length: count }, (_, i) => ({
      scheduleId,
      seatClass:  cls,
      seatNumber: `${prefix}${Math.ceil((i+1)/6)}${['A','B','C','D','E','F'][i%6]}`,
      price,
    }));
  }

  // ── Dynamic Seeding Helper ────────────────────────────────────────────────
  private async createDynamicSchedules(
    db: any,
    routeId: string,
    transportType: string,
    targetDate: Date,
  ) {
    const mk = (h: number, m: number) => {
      const t = new Date(targetDate);
      t.setHours(h, m, 0, 0);
      return t;
    };

    const scheduleDefs = transportType === 'kereta'
      ? [
          { v:'Gajayana Express', c:'KA-GJA', dep:mk(8,0),  arr:mk(12,30), eco:24, vip:12, exe:12, pe:150000, pv:350000, px:250000 },
          { v:'Argo Wilis',       c:'KA-AWS', dep:mk(15,30), arr:mk(20,0),  eco:30, vip:12, exe:18, pe:160000, pv:380000, px:270000 },
        ]
      : [
          { v:'Garuda Indonesia', c:'GA-320', dep:mk(9,15),  arr:mk(10,45), eco:60, vip:12, exe:24, pe:850000,  pv:1800000, px:1200000 },
          { v:'Batik Air',        c:'ID-652', dep:mk(16,0),  arr:mk(17,30), eco:72, vip:12, exe:30, pe:750000,  pv:1500000, px:1000000 },
        ];

    for (const s of scheduleDefs) {
      await db.$transaction(async (tx: any) => {
        const schedule = await tx.schedule.create({
          data: {
            routeId,
            vehicleName:         s.v,
            vehicleCode:         s.c,
            departureTime:       s.dep,
            arrivalTime:         s.arr,
            totalSeatsEconomy:   s.eco,
            totalSeatsVip:       s.vip,
            totalSeatsExecutive: s.exe,
          },
        });

        const tickets = [
          ...this.generateSeats(schedule.id, s.eco, 'ekonomi',   'E', s.pe),
          ...this.generateSeats(schedule.id, s.vip, 'vip',        'V', s.pv),
          ...this.generateSeats(schedule.id, s.exe, 'eksekutif', 'X', s.px),
        ];

        if (tickets.length > 0) {
          await tx.ticket.createMany({ data: tickets });
        }
      });
    }
  }

  // ── Search Tickets dengan Dynamic Seeding ────────────────────────────────
  async searchTickets(
    transportType: string,
    origin: string,
    destination: string,
    date?: string,
    seatClass?: string,
  ) {
    const db = this.prisma as any;
    if (!transportType || !origin || !destination)
      return { status: 'success', data: [] };

    // Tentukan targetDate
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

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
      scheduleWhere.departureTime = { gte: targetDate, lte: targetEnd };
    }

    const ticketWhere: any = { status: 'tersedia' };
    if (seatClass) ticketWhere.seatClass = seatClass;

    // Query awal
    let schedules = await db.schedule.findMany({
      where:   scheduleWhere,
      include: { route: true, tickets: { where: ticketWhere } },
      orderBy: { departureTime: 'asc' },
    });

    // ── DYNAMIC SEEDING: jika tidak ada jadwal, buat otomatis ──────────────
    if (schedules.length === 0) {
      // Cari atau buat route
      let route = await db.route.findFirst({
        where: {
          transportType,
          origin:      { contains: origin },
          destination: { contains: destination },
          isActive:    true,
        },
      });

      if (!route) {
        const originCode      = origin.slice(0, 3).toUpperCase().replace(/\s/g, '');
        const destinationCode = destination.slice(0, 3).toUpperCase().replace(/\s/g, '');
        const distanceKm      = Math.floor(Math.random() * 800) + 100;
        route = await db.route.create({
          data: { transportType, origin, destination, originCode, destinationCode, distanceKm },
        });
      }

      // Buat 2 jadwal dinamis
      await this.createDynamicSchedules(db, route.id, transportType, targetDate);

      // Query ulang setelah seeding
      schedules = await db.schedule.findMany({
        where:   scheduleWhere,
        include: { route: true, tickets: { where: ticketWhere } },
        orderBy: { departureTime: 'asc' },
      });
    }

    // Format response
    const data = schedules
      .filter((s: any) => s.tickets.length > 0)
      .map((s: any) => {
        const g: any = { ekonomi:[], vip:[], eksekutif:[] };
        s.tickets.forEach((t: any) => { if (g[t.seatClass]) g[t.seatClass].push(t); });
        return {
          scheduleId:    s.id,
          vehicleName:   s.vehicleName,
          vehicleCode:   s.vehicleCode,
          departureTime: s.departureTime,
          arrivalTime:   s.arrivalTime,
          route:         s.route,
          availableSeats: {
            ekonomi:   { count: g.ekonomi.length,   minPrice: g.ekonomi.length   ? Math.min(...g.ekonomi.map((t:any)   => Number(t.price))) : null },
            vip:       { count: g.vip.length,        minPrice: g.vip.length        ? Math.min(...g.vip.map((t:any)        => Number(t.price))) : null },
            eksekutif: { count: g.eksekutif.length,  minPrice: g.eksekutif.length  ? Math.min(...g.eksekutif.map((t:any)  => Number(t.price))) : null },
          },
        };
      });

    return { status: 'success', total_schedules: data.length, data };
  }
}
