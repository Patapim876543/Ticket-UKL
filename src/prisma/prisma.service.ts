import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Dynamic import agar tidak crash saat prisma belum di-generate
let PrismaClientClass: any;
try {
  PrismaClientClass = require('@prisma/client').PrismaClient;
} catch {
  PrismaClientClass = class MockPrisma {};
}

@Injectable()
export class PrismaService extends PrismaClientClass implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }

  async onModuleInit() {
    if (typeof (this as any).$connect === 'function') {
      await (this as any).$connect();
    }
  }

  async onModuleDestroy() {
    if (typeof (this as any).$disconnect === 'function') {
      await (this as any).$disconnect();
    }
  }
}
