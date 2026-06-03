import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  private checkAccess(transportType: string, role: string) {
    if (role === 'admin') return;
    const map: Record<string, string> = { kereta: 'petugas_kereta', pesawat: 'petugas_pesawat' };
    if (role !== map[transportType])
      throw new ForbiddenException(`Akses ditolak. Anda tidak bisa mengelola transportasi ${transportType}.`);
  }

  async getAll(transportType?: string, origin?: string, destination?: string, date?: string) {
    const where: any = { isActive: true };

    // Filter route lewat nested where (bukan di dalam include)
    const routeFilter: any = { isActive: true };
    if (transportType) routeFilter.transportType = transportType;
    if (origin)        routeFilter.origin         = { contains: origin };
    if (destination)   routeFilter.destination    = { contains: destination };

    if (transportType || origin || destination) {
      where.route = routeFilter;
    }

    if (date) {
      const s = new Date(date); s.setHours(0, 0, 0, 0);
      const e = new Date(date); e.setHours(23, 59, 59, 999);
      where.departureTime = { gte: s, lte: e };
    }

    const schedules = await (this.prisma as any).schedule.findMany({
      where,
      include: {
        route: true,
        tickets: {
          select: {
            seatClass: true,
            price: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    const data = schedules.map((s: any) => {
      const priceEconomy = s.tickets.find((t: any) => t.seatClass === 'ekonomi')?.price || 0;
      const priceExecutive = s.tickets.find((t: any) => t.seatClass === 'eksekutif')?.price || 0;
      const priceVip = s.tickets.find((t: any) => t.seatClass === 'vip')?.price || 0;

      const { tickets, ...rest } = s;
      return {
        ...rest,
        priceEconomy: Number(priceEconomy),
        priceExecutive: Number(priceExecutive),
        priceVip: Number(priceVip),
      };
    });

    return { data };
  }

  async create(dto: CreateScheduleDto, role: string) {
    const route = await (this.prisma as any).route.findUnique({ where: { id: dto.routeId } });
    if (!route) throw new NotFoundException('Rute tidak ditemukan.');
    this.checkAccess(route.transportType, role);

    const {
      priceEconomy   = 0, priceVip       = 0, priceExecutive   = 0,
      totalSeatsEconomy = 0, totalSeatsVip = 0, totalSeatsExecutive = 0,
      ...rest
    } = dto;

    return (this.prisma as any).$transaction(async (tx: any) => {
      const schedule = await tx.schedule.create({
        data: { ...rest, totalSeatsEconomy, totalSeatsVip, totalSeatsExecutive },
      });

      const gen = (count: number, cls: string, prefix: string, price: number) =>
        Array.from({ length: count }, (_, i) => ({
          scheduleId: schedule.id,
          seatClass:  cls,
          seatNumber: `${prefix}${Math.ceil((i + 1) / 6)}${['A','B','C','D','E','F'][i % 6]}`,
          price,
        }));

      const tickets = [
        ...gen(totalSeatsEconomy,   'ekonomi',   'E', priceEconomy),
        ...gen(totalSeatsVip,       'vip',        'V', priceVip),
        ...gen(totalSeatsExecutive, 'eksekutif', 'X', priceExecutive),
      ];

      if (tickets.length > 0) await tx.ticket.createMany({ data: tickets });

      return {
        message: `Jadwal dibuat dengan ${tickets.length} kursi.`,
        data: { schedule, total_tickets: tickets.length },
      };
    });
  }

  async update(id: string, dto: UpdateScheduleDto, role: string) {
    const sch = await (this.prisma as any).schedule.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!sch) throw new NotFoundException('Jadwal tidak ditemukan.');
    this.checkAccess(sch.route.transportType, role);

    const data = await (this.prisma as any).schedule.update({ where: { id }, data: dto });
    return { message: 'Jadwal berhasil diperbarui.', data };
  }

  async delete(id: string, role: string) {
    const sch = await (this.prisma as any).schedule.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!sch) throw new NotFoundException('Jadwal tidak ditemukan.');
    this.checkAccess(sch.route.transportType, role);

    await (this.prisma as any).schedule.delete({ where: { id } });
    return { message: 'Jadwal berhasil dihapus.' };
  }

  async updateDelayGate(
    id: string,
    dto: { delayMinutes?: string; gateNumber?: string; flightStatus?: string },
    role: string,
  ) {
    const db = this.prisma as any;
    const sch = await db.schedule.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!sch) throw new NotFoundException('Jadwal tidak ditemukan.');
    this.checkAccess(sch.route.transportType, role);

    const updateData: any = {};
    if (dto.delayMinutes !== undefined) updateData.delayMinutes = dto.delayMinutes;
    if (dto.gateNumber !== undefined)   updateData.gateNumber   = dto.gateNumber;
    if (dto.flightStatus !== undefined) updateData.flightStatus = dto.flightStatus;

    const data = await db.schedule.update({
      where: { id },
      data: updateData,
    });
    return { message: 'Status operasional jadwal berhasil diperbarui.', data };
  }
}
