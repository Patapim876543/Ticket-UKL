# 🚀 Cara Menjalankan Tiket App (NestJS)

## ✅ LANGKAH 1 — Pastikan XAMPP Jalan
Buka XAMPP Control Panel → Start **Apache** dan **MySQL**

---

## ✅ LANGKAH 2 — Buat Database di phpMyAdmin
1. Buka browser → `http://localhost/phpmyadmin`
2. Klik **New** di sidebar kiri
3. Ketik nama database: `tiket_app`
4. Klik **Create**

---

## ✅ LANGKAH 3 — Cek file `.env`
Buka file `.env` di VS Code, pastikan isinya:
```
DATABASE_URL="mysql://root:@localhost:3306/tiket_app"
```
> Jika MySQL XAMPP kamu pakai password, ubah jadi:
> `DATABASE_URL="mysql://root:PASSWORD_KAMU@localhost:3306/tiket_app"`

---

## ✅ LANGKAH 4 — Install & Setup (jalankan SEKALI saja)
Buka Terminal di VS Code (`Ctrl + backtick`):
```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
```

---

## ✅ LANGKAH 5 — Jalankan Server
```bash
npm run start:dev
```

### Hasilnya:
```
🚀 Server    : http://localhost:3000
📚 Swagger   : http://localhost:3000/docs
```

---

## 🧪 Test di Postman / Swagger

### Cara pakai Swagger:
1. Buka `http://localhost:3000/docs`
2. Cari endpoint `POST /api/auth/login`
3. Klik **Try it out** → isi body → Execute
4. Copy token dari response
5. Klik tombol **Authorize** (atas kanan) → paste token
6. Semua endpoint sekarang bisa ditest!

### Akun login default:
| Username | Password | Role |
|---|---|---|
| admin | password123 | admin |
| petugas_kereta1 | password123 | petugas_kereta |
| petugas_pesawat1 | password123 | petugas_pesawat |
| rudi123 | password123 | user |

---

## 🚀 Deploy ke Railway

1. Push ke GitHub:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/tiket-nestjs
git push -u origin main
```

2. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Tambah **MySQL** plugin di Railway
4. Set environment variables:
   - `DATABASE_URL` → copy dari Railway MySQL
   - `JWT_SECRET` → isi string random panjang
   - `NODE_ENV` → `production`
5. **Done!** Railway otomatis build, migrate, seed, dan deploy

---

## ❓ Troubleshooting

**Error: Can't reach database server**
→ Pastikan XAMPP MySQL sudah Start

**Error: Access denied for user 'root'**
→ MySQL XAMPP kamu pakai password, update DATABASE_URL di .env

**Error: Unknown database 'tiket_app'**
→ Buat databasenya dulu di phpMyAdmin (Langkah 2)

**Port 3000 sudah dipakai**
→ Ubah PORT=3001 di file .env
