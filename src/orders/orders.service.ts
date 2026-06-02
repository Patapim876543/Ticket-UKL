import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // =========================
  // CREATE ORDER
  // =========================
  async create(dto: any, requestUser: any) {
    const db = this.prisma as any;

    const {
      ticketId,
      passengerName,
      passengerIdNumber,
      passengerPhone,
      buyerUserId,
      notes,
    } = dto;

    if (
      !ticketId ||
      !passengerName ||
      !passengerIdNumber
    ) {
      throw new BadRequestException(
        'ticketId, passengerName, passengerIdNumber wajib diisi.',
      );
    }

    // =========================
    // TENTUKAN PEMBELI
    // =========================
    let buyerId = requestUser.id;

    if (
      ['admin', 'petugas_kereta', 'petugas_pesawat']
        .includes(requestUser.role)
    ) {
      if (!buyerUserId) {
        throw new BadRequestException(
          'buyerUserId wajib diisi saat petugas/admin membelikan tiket.',
        );
      }

      buyerId = buyerUserId;
    }

    // =========================
    // CEK TIKET
    // =========================
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        schedule: {
          include: {
            route: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        'Tiket tidak ditemukan.',
      );
    }

    if (ticket.status !== 'tersedia') {
      throw new BadRequestException(
        `Kursi ${ticket.seatNumber} tidak tersedia.`,
      );
    }

    // =========================
    // VALIDASI PETUGAS
    // =========================
    if (
      requestUser.role === 'petugas_kereta' &&
      ticket.schedule.route.transportType !== 'kereta'
    ) {
      throw new ForbiddenException(
        'Petugas kereta hanya bisa melayani tiket kereta.',
      );
    }

    if (
      requestUser.role === 'petugas_pesawat' &&
      ticket.schedule.route.transportType !== 'pesawat'
    ) {
      throw new ForbiddenException(
        'Petugas pesawat hanya bisa melayani tiket pesawat.',
      );
    }

    // =========================
    // CEK USER
    // =========================
    const buyer = await db.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new NotFoundException(
        'User pembeli tidak ditemukan.',
      );
    }

    const price = Number(ticket.price);
    const before = Number(buyer.balance);

    if (before < price) {
      throw new BadRequestException(
        `Saldo tidak cukup. Saldo: Rp${before.toLocaleString(
          'id-ID',
        )}, Harga: Rp${price.toLocaleString('id-ID')}.`,
      );
    }

    // =========================
    // GENERATE ORDER CODE
    // =========================
    const d = new Date();

    const r = Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

    const orderCode = `TKT-${d
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')}-${r}`;

    // =========================
    // TRANSACTION
    // =========================
    return db.$transaction(async (tx: any) => {
      // potong saldo
      await tx.user.update({
        where: { id: buyerId },
        data: {
          balance: before - price,
        },
      });

      // update tiket
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'dipesan',
        },
      });

      // create order
      const order = await tx.order.create({
        data: {
          orderCode,
          userId: buyerId,
          ticketId,
          passengerName,
          passengerIdNumber,
          passengerPhone:
            passengerPhone || null,
          totalPrice: price,
          processedBy:
            requestUser.role !== 'user'
              ? requestUser.id
              : null,
          notes: notes || null,
        },
      });

      // create transaction
      await tx.transaction.create({
        data: {
          userId: buyerId,
          type: 'pembelian',
          amount: -price,
          balanceBefore: before,
          balanceAfter: before - price,
          description:
            `Beli tiket ${ticket.schedule.route.transportType} ` +
            `${ticket.schedule.route.origin}→${ticket.schedule.route.destination} ` +
            `kursi ${ticket.seatNumber}`,
          referenceId: order.id,
          processedBy:
            requestUser.role !== 'user'
              ? requestUser.id
              : null,
        },
      });

      // =========================
      // RESPONSE
      // =========================
      return {
        message: 'Tiket berhasil dibeli.',
        data: {
          id: order.id,
          order_code: orderCode,
          passengerName,
          seatNumber: ticket.seatNumber,
          seatClass: ticket.seatClass,
          route: `${ticket.schedule.route.origin} → ${ticket.schedule.route.destination}`,
          transportType:
            ticket.schedule.route.transportType,
          vehicle:
            ticket.schedule.vehicleName,
          departureTime:
            ticket.schedule.departureTime,
          arrivalTime:
            ticket.schedule.arrivalTime,
          totalPrice: price,
          balanceRemaining:
            before - price,
        },
      };
    });
  }

  // =========================
  // REFUND
  // =========================
  async refund(
    id: string,
    requestUser: any,
    reason?: string,
  ) {
    const db = this.prisma as any;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        ticket: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order tidak ditemukan.',
      );
    }

    if (
      requestUser.role === 'user' &&
      order.userId !== requestUser.id
    ) {
      throw new ForbiddenException(
        'Akses ditolak.',
      );
    }

    if (order.status !== 'aktif' && order.status !== 'pending_refund') {
      throw new BadRequestException(
        `Status '${order.status}' tidak bisa direfund.`,
      );
    }

    const buyer = await db.user.findUnique({
      where: { id: order.userId },
    });

    const amount = Number(order.totalPrice);
    const before = Number(buyer.balance);

    return db.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: order.userId },
        data: {
          balance: before + amount,
        },
      });

      await tx.ticket.update({
        where: { id: order.ticketId },
        data: {
          status: 'tersedia',
        },
      });

      await tx.order.update({
        where: { id },
        data: {
          status: 'direfund',
          refundReason:
            reason || 'Refund oleh pengguna',
          refundedAt: new Date(),
          processedBy:
            requestUser.role !== 'user'
              ? requestUser.id
              : undefined,
        },
      });

      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'refund',
          amount,
          balanceBefore: before,
          balanceAfter: before + amount,
          description:
            `Refund tiket ${order.orderCode}`,
          referenceId: order.id,
          processedBy:
            requestUser.role !== 'user'
              ? requestUser.id
              : null,
        },
      });

      return {
        message:
          `Refund Rp${amount.toLocaleString('id-ID')} berhasil.`,
        data: {
          orderCode: order.orderCode,
          refundAmount: amount,
          balanceAfter: before + amount,
        },
      };
    });
  }

  // =========================
  // GET MY ORDERS
  // =========================
  async getMyOrders(
    userId: string,
    status?: string,
    page = 1,
    limit = 10,
  ) {
    const db = this.prisma as any;

    const where: any = {
      userId,
    };

    if (status)
      where.status = status;

    const [total, data] =
      await Promise.all([
        db.order.count({ where }),

        db.order.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            ticket: {
              include: {
                schedule: {
                  include: {
                    route: true,
                  },
                },
              },
            },

            processor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        }),
      ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // =========================
  // GET ORDER BY ID
  // =========================
  async getById(
    id: string,
    requestUser: any,
  ) {
    const db = this.prisma as any;

    const order = await db.order.findUnique({
      where: { id },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        processor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },

        ticket: {
          include: {
            schedule: {
              include: {
                route: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order tidak ditemukan.',
      );
    }

    if (
      requestUser.role === 'user' &&
      order.userId !== requestUser.id
    ) {
      throw new ForbiddenException(
        'Akses ditolak.',
      );
    }

    return {
      data: order,
    };
  }

  // =========================
  // REQUEST REFUND (CUSTOMER)
  // =========================
  async requestRefund(id: string, requestUser: any, reason: string) {
    const db = this.prisma as any;
    if (!reason || !reason.trim()) {
      throw new BadRequestException('Alasan refund harus diisi.');
    }

    const order = await db.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order tidak ditemukan.');
    }

    if (requestUser.role === 'user' && order.userId !== requestUser.id) {
      throw new ForbiddenException('Akses ditolak.');
    }

    if (order.status !== 'aktif') {
      throw new BadRequestException('Order tidak aktif / tidak bisa direfund.');
    }

    if (order.boardingStatus === 'Boarded') {
      throw new BadRequestException('Tiket yang sudah boarding tidak bisa direfund.');
    }

    return db.order.update({
      where: { id },
      data: {
        status: 'pending_refund',
        refundReason: reason,
      },
    });
  }
}
