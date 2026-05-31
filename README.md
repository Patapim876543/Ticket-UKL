# 🚆✈️ Tiket App — NestJS Backend

Backend pemesanan tiket **Kereta & Pesawat** dengan **NestJS + Prisma + MySQL**.  
Dilengkapi **Swagger UI** dan siap **deploy ke production**.

---

## ⚡ Quick Start (Lokal)

```bash
# 1. Install packages
npm install

# 2. Edit DATABASE_URL di .env sesuai MySQL kamu
#    Contoh: mysql://root:@localhost:3306/tiket_app

# 3. Push schema ke database + generate Prisma Client
npm run prisma:push

# 4. Isi data awal
npm run seed

# 5. Jalankan
npm run start:dev
```

| URL | Keterangan |
|-----|------------|
| http://localhost:3000/api | Base API |
| http://localhost:3000/docs | **Swagger UI** |

---

## 🔑 Akun Default

| Username | Password | Role | Saldo |
|---|---|---|---|
| `admin` | password123 | admin | - |
| `petugas_kereta1` | password123 | petugas_kereta | - |
| `petugas_pesawat1` | password123 | petugas_pesawat | - |
| `rudi123` | password123 | user | Rp2.000.000 |
| `anita456` | password123 | user | Rp1.500.000 |

---

## 📁 Struktur Folder

```
tiket-nestjs/
├── prisma/
│   ├── schema.prisma        ← Skema database (Prisma)
│   └── seed.ts              ← Data awal
├── src/
│   ├── main.ts              ← Entry point + Swagger setup
│   ├── app.module.ts        ← Root module
│   ├── prisma/              ← PrismaService (global)
│   ├── common/
│   │   ├── decorators/      ← @Roles, @CurrentUser
│   │   ├── guards/          ← RolesGuard (RBAC)
│   │   ├── enums/           ← Role enum
│   │   └── interceptors/    ← Response format
│   ├── auth/                ← Login, JWT, profil
│   ├── admin/               ← CRUD user, topup, semua order
│   ├── routes/              ← CRUD rute perjalanan
│   ├── schedules/           ← CRUD jadwal + auto-generate kursi
│   ├── tickets/             ← CRUD tiket, peta kursi, penumpang
│   ├── orders/              ← Beli & refund tiket
│   └── users/               ← Saldo, transaksi, CS, cari tiket
├── .env
├── .env.example
└── package.json
```

---

## 🗄️ Setup Database MySQL

**1. Buat database di phpMyAdmin / MySQL CLI:**
```sql
CREATE DATABASE tiket_app;
```

**2. Edit `.env`:**
```env
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/tiket_app"
```

**3. Push schema & seed:**
```bash
npm run prisma:push
npm run seed
```

---

## 🚀 Deploy ke Production

### Opsi A — Railway (paling mudah, gratis)
1. Push kode ke GitHub
2. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Tambah MySQL service di Railway
4. Set environment variables:
   ```
   DATABASE_URL=mysql://...  ← dari Railway MySQL
   JWT_SECRET=random_string_panjang
   NODE_ENV=production
   ```
5. Set start command: `npm run build && npm run prisma:migrate && npm run seed && npm run start:prod`

### Opsi B — VPS (Ubuntu)
```bash
# Di server
git clone https://github.com/kamu/tiket-nestjs
cd tiket-nestjs
npm install
npm run build
npm run prisma:migrate
npm run seed

# Jalankan dengan PM2
npm install -g pm2
pm2 start dist/main.js --name tiket-app
pm2 startup
pm2 save
```

### Opsi C — Vercel / Render
- Sama seperti Railway, tinggal connect GitHub + set env variables

---

## 📡 Semua Endpoint

Semua endpoint terdokumentasi lengkap di **Swagger UI**: `http://localhost:3000/docs`

### Auth
| Method | URL | Akses |
|--------|-----|-------|
| POST | `/api/auth/login` | Public |
| GET  | `/api/auth/profile` | Login |
| PUT  | `/api/auth/profile` | Login |

### Admin *(admin only)*
| Method | URL |
|--------|-----|
| GET | `/api/admin/dashboard` |
| GET/POST/PUT/DELETE | `/api/admin/users` |
| POST | `/api/admin/users/:id/topup` |
| GET | `/api/admin/orders` |

### Rute, Jadwal, Tiket
| Method | URL | Akses |
|--------|-----|-------|
| GET | `/api/routes` | Public |
| POST/PUT/DELETE | `/api/routes` | Admin/Petugas |
| GET | `/api/schedules` | Public |
| POST/PUT/DELETE | `/api/schedules` | Admin/Petugas |
| GET | `/api/tickets` | Public |
| GET | `/api/tickets/seats/:id` | Public |
| GET | `/api/tickets/passengers/:id` | Admin/Petugas |
| POST/PUT/DELETE | `/api/tickets` | Admin/Petugas |

### Pemesanan
| Method | URL |
|--------|-----|
| POST | `/api/orders` — beli tiket |
| POST | `/api/orders/:id/refund` — refund |
| GET  | `/api/orders/my` — riwayat saya |
| GET  | `/api/orders/:id` — detail |

### Fitur User
| Method | URL |
|--------|-----|
| GET | `/api/users/balance` |
| GET | `/api/users/transactions` |
| GET | `/api/users/cs-contact` |
| GET | `/api/users/search-tickets` |

---

## 🛡️ RBAC

| Fitur | Admin | Petugas Kereta | Petugas Pesawat | User |
|---|:---:|:---:|:---:|:---:|
| Kelola user & saldo | ✅ | ❌ | ❌ | ❌ |
| CRUD tiket kereta | ✅ | ✅ | ❌ | ❌ |
| CRUD tiket pesawat | ✅ | ❌ | ✅ | ❌ |
| Lihat penumpang | ✅ | ✅* | ✅* | ❌ |
| Beli / refund tiket | ✅ | ✅ | ✅ | ✅ |
| Saldo & transaksi | ❌ | ❌ | ❌ | ✅ |

*Sesuai jenis transportasinya
