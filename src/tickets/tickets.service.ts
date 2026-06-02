import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  private checkAccess(transportType: string, role: string) {
    if (role === 'admin') return;
    const map: Record<string, string> = { kereta: 'petugas_kereta', pesawat: 'petugas_pesawat' };
    if (role !== map[transportType])
      throw new ForbiddenException(`Akses ditolak untuk transportasi ${transportType}.`);
  }

  async getTickets(scheduleId?: string, seatClass?: string, status?: string, transportType?: string) {
    const db = this.prisma as any;
    const where: any = {};
    if (scheduleId) where.scheduleId = scheduleId;
    if (seatClass)  where.seatClass  = seatClass;
    if (status)     where.status     = status;

    const tickets = await db.ticket.findMany({
      where,
      include: { schedule: { include: { route: true } } },
      orderBy: { seatNumber: 'asc' },
    });

    const result = transportType
      ? tickets.filter((t: any) => t.schedule?.route?.transportType === transportType)
      : tickets;

    return { total: result.length, data: result };
  }

  async getSeatMap(scheduleId: string) {
    const db = this.prisma as any;
    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true },
    });
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan.');

    const tickets = await db.ticket.findMany({
      where: { scheduleId },
      orderBy: [{ seatClass: 'asc' }, { seatNumber: 'asc' }],
    });

    const seats: any = { ekonomi: [], vip: [], eksekutif: [] };
    tickets.forEach((t: any) => {
      if (seats[t.seatClass]) {
        seats[t.seatClass].push({ id: t.id, seatNumber: t.seatNumber, price: t.price, status: t.status });
      }
    });

    const summary: any = {};
    for (const cls of ['ekonomi', 'vip', 'eksekutif']) {
      summary[cls] = {
        total:    seats[cls].length,
        tersedia: seats[cls].filter((s: any) => s.status === 'tersedia').length,
        dipesan:  seats[cls].filter((s: any) => s.status === 'dipesan').length,
      };
    }

    return { data: { schedule, summary, seats } };
  }

  async getPassengers(scheduleId: string, role: string) {
    const db = this.prisma as any;
    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      include: { route: true },
    });
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan.');
    this.checkAccess(schedule.route.transportType, role);

    const orders = await db.order.findMany({
      where: {
        ticket: { scheduleId },
        status: { in: ['aktif', 'digunakan'] },
      },
      include: {
        ticket: true,
        user:   { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      total_passengers: orders.length,
      schedule: {
        id: schedule.id, vehicleName: schedule.vehicleName,
        departureTime: schedule.departureTime, route: schedule.route,
      },
      data: orders.map((o: any) => ({
        id:                 o.id,
        orderCode:          o.orderCode,
        seatNumber:         o.ticket.seatNumber,
        seatClass:          o.ticket.seatClass,
        passengerName:      o.passengerName,
        passengerIdNumber:  o.passengerIdNumber,
        passengerPhone:     o.passengerPhone,
        status:             o.status,
        boardingStatus:     o.boardingStatus,
        baggageWeight:      o.baggageWeight,
        buyer:              o.user,
      })),
    };
  }

  async updateBoardingStatus(orderId: string, boardingStatus: string, role: string) {
    const db = this.prisma as any;
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { ticket: { include: { schedule: { include: { route: true } } } } },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan.');
    this.checkAccess(order.ticket.schedule.route.transportType, role);

    const updated = await db.order.update({
      where: { id: orderId },
      data: { boardingStatus },
    });
    return { message: 'Status boarding berhasil diperbarui.', data: updated };
  }

  async updateBaggageWeight(orderId: string, baggageWeight: number, role: string) {
    const db = this.prisma as any;
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { ticket: { include: { schedule: { include: { route: true } } } } },
    });
    if (!order) throw new NotFoundException('Pesanan tidak ditemukan.');
    this.checkAccess(order.ticket.schedule.route.transportType, role);

    const updated = await db.order.update({
      where: { id: orderId },
      data: { baggageWeight },
    });
    return { message: 'Berat bagasi berhasil diperbarui.', data: updated };
  }

  async getById(id: string) {
    const db = this.prisma as any;
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        schedule: { include: { route: true } },
        order:    { include: { user: { select: { id:true, name:true, username:true, email:true } } } },
      },
    });
    if (!ticket) throw new NotFoundException('Tiket tidak ditemukan.');
    return { data: ticket };
  }

  async create(dto: any, role: string) {
    const db = this.prisma as any;
    const schedule = await db.schedule.findUnique({
      where: { id: dto.scheduleId },
      include: { route: true },
    });
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan.');
    this.checkAccess(schedule.route.transportType, role);

    const exists = await db.ticket.findFirst({
      where: { scheduleId: dto.scheduleId, seatNumber: dto.seatNumber },
    });
    if (exists) throw new BadRequestException(`Kursi ${dto.seatNumber} sudah ada.`);

    const ticket = await db.ticket.create({ data: dto });
    return { message: 'Tiket berhasil ditambahkan.', data: ticket };
  }

  async update(id: string, dto: any, role: string) {
    const db = this.prisma as any;
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { schedule: { include: { route: true } } },
    });
    if (!ticket) throw new NotFoundException('Tiket tidak ditemukan.');
    if (ticket.status === 'dipesan') throw new BadRequestException('Tiket sudah dipesan, tidak bisa diubah.');
    this.checkAccess(ticket.schedule.route.transportType, role);

    const data = await db.ticket.update({ where: { id }, data: dto });
    return { message: 'Tiket berhasil diperbarui.', data };
  }

  async delete(id: string, role: string) {
    const db = this.prisma as any;
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: { schedule: { include: { route: true } } },
    });
    if (!ticket) throw new NotFoundException('Tiket tidak ditemukan.');
    if (ticket.status === 'dipesan') throw new BadRequestException('Tiket sudah dipesan, tidak bisa dihapus.');
    this.checkAccess(ticket.schedule.route.transportType, role);

    await db.ticket.delete({ where: { id } });
    return { message: 'Tiket berhasil dihapus.' };
  }
}
