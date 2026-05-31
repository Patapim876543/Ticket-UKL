import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors();

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation pipe ───────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ── Global response interceptor ───────────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('🚆✈️ Tiket App API')
    .setDescription(
      `## Backend Pemesanan Tiket Kereta & Pesawat
      
**4 Role:** Admin · Petugas Kereta · Petugas Pesawat · User

### Cara menggunakan:
1. Login via \`POST /api/auth/login\`
2. Copy token dari response
3. Klik tombol **Authorize** di atas → paste token
4. Semua endpoint bertanda 🔒 sudah terautentikasi`
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('🔑 Auth',           'Login & profil')
    .addTag('👑 Admin',          'Manajemen user, saldo, semua order')
    .addTag('🛤️ Rute Perjalanan','CRUD rute kereta & pesawat')
    .addTag('📅 Jadwal',         'CRUD jadwal + auto-generate kursi')
    .addTag('🎟️ Tiket',          'Manajemen tiket & peta kursi')
    .addTag('🛒 Pemesanan',      'Beli & refund tiket')
    .addTag('👤 Fitur User',     'Saldo, transaksi, CS, cari tiket')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
    },
    customSiteTitle: 'Tiket App API Docs',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 Server    : http://localhost:${port}`);
  console.log(`📚 Swagger   : http://localhost:${port}/docs`);
  console.log(`🗄️  Database  : MySQL via Prisma`);
  console.log(`🔧 Mode      : ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
