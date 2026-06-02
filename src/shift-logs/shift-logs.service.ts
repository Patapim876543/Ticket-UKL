import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShiftLogsService {
  constructor(private prisma: PrismaService) {}

  async getLogs() {
    const db = this.prisma as any;
    const data = await db.shiftLog.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { data };
  }

  async createLog(dto: any, user: any) {
    const db = this.prisma as any;
    
    // Map roles standardly
    const roleMap: Record<string, string> = {
      admin: 'Super Admin',
      petugas_kereta: 'Petugas Kereta',
      petugas_pesawat: 'Petugas Pesawat',
    };
    const roleName = roleMap[user.role] || 'Petugas Operasional';

    // Retrieve officer user full name if available
    const officer = await db.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });
    const name = officer?.name || user.username || 'Petugas';

    const log = await db.shiftLog.create({
      data: {
        officerName: name,
        officerRole: roleName,
        text: dto.text,
        status: dto.status || 'Normal',
      },
    });

    return { message: 'Catatan shift berhasil ditambahkan.', data: log };
  }
}
