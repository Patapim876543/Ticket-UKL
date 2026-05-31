// seed.js — pakai node biasa, tidak butuh ts-node
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 Memulai seeder...\n');

  const pw = await bcrypt.hash('password123', 12);

  // ── USERS ──────────────────────────────────────────────────────────────────
  await prisma.user.upsert({ where: { username: 'admin' },            update: {}, create: { name: 'Super Admin',      username: 'admin',            email: 'admin@tiketapp.id',    phone: '08100000001', password: pw, role: 'admin',           balance: 0       } });
  await prisma.user.upsert({ where: { username: 'petugas_kereta1' },  update: {}, create: { name: 'Budi Santoso',     username: 'petugas_kereta1',  email: 'budi@tiketapp.id',     phone: '08100000002', password: pw, role: 'petugas_kereta',  balance: 0       } });
  await prisma.user.upsert({ where: { username: 'petugas_kereta2' },  update: {}, create: { name: 'Siti Rahayu',      username: 'petugas_kereta2',  email: 'siti@tiketapp.id',     phone: '08100000003', password: pw, role: 'petugas_kereta',  balance: 0       } });
  await prisma.user.upsert({ where: { username: 'petugas_pesawat1' }, update: {}, create: { name: 'Ahmad Fauzi',      username: 'petugas_pesawat1', email: 'ahmad@tiketapp.id',    phone: '08100000004', password: pw, role: 'petugas_pesawat', balance: 0       } });
  await prisma.user.upsert({ where: { username: 'petugas_pesawat2' }, update: {}, create: { name: 'Dewi Lestari',     username: 'petugas_pesawat2', email: 'dewi@tiketapp.id',     phone: '08100000005', password: pw, role: 'petugas_pesawat', balance: 0       } });
  await prisma.user.upsert({ where: { username: 'rudi123' },          update: {}, create: { name: 'Rudi Hermawan',    username: 'rudi123',          email: 'rudi@gmail.com',       phone: '08211111111', password: pw, role: 'user',            balance: 2000000 } });
  await prisma.user.upsert({ where: { username: 'anita456' },         update: {}, create: { name: 'Anita Kusuma',     username: 'anita456',         email: 'anita@gmail.com',      phone: '08222222222', password: pw, role: 'user',            balance: 1500000 } });
  await prisma.user.upsert({ where: { username: 'joko789' },          update: {}, create: { name: 'Joko Widodo',      username: 'joko789',          email: 'joko@gmail.com',       phone: '08233333333', password: pw, role: 'user',            balance: 500000  } });
  console.log('✅ 8 users dibuat.');

  // ── ROUTES ─────────────────────────────────────────────────────────────────
  const routeDefs = [
    { transportType: 'kereta',  origin: 'Malang',         destination: 'Surabaya',       originCode: 'ML',  destinationCode: 'SB',  distanceKm: 89   },
    { transportType: 'kereta',  origin: 'Surabaya',       destination: 'Malang',         originCode: 'SB',  destinationCode: 'ML',  distanceKm: 89   },
    { transportType: 'kereta',  origin: 'Surabaya',       destination: 'Jakarta',        originCode: 'SB',  destinationCode: 'JKT', distanceKm: 726  },
    { transportType: 'kereta',  origin: 'Jakarta',        destination: 'Surabaya',       originCode: 'JKT', destinationCode: 'SB',  distanceKm: 726  },
    { transportType: 'kereta',  origin: 'Jakarta',        destination: 'Bandung',        originCode: 'JKT', destinationCode: 'BDG', distanceKm: 150  },
    { transportType: 'kereta',  origin: 'Yogyakarta',     destination: 'Jakarta',        originCode: 'YK',  destinationCode: 'JKT', distanceKm: 511  },
    { transportType: 'pesawat', origin: 'Surabaya (SUB)', destination: 'Jakarta (CGK)',  originCode: 'SUB', destinationCode: 'CGK', distanceKm: 665  },
    { transportType: 'pesawat', origin: 'Jakarta (CGK)',  destination: 'Surabaya (SUB)', originCode: 'CGK', destinationCode: 'SUB', distanceKm: 665  },
    { transportType: 'pesawat', origin: 'Jakarta (CGK)',  destination: 'Bali (DPS)',     originCode: 'CGK', destinationCode: 'DPS', distanceKm: 1012 },
    { transportType: 'pesawat', origin: 'Bali (DPS)',     destination: 'Jakarta (CGK)',  originCode: 'DPS', destinationCode: 'CGK', distanceKm: 1012 },
    { transportType: 'pesawat', origin: 'Surabaya (SUB)', destination: 'Bali (DPS)',    originCode: 'SUB', destinationCode: 'DPS', distanceKm: 291  },
    { transportType: 'pesawat', origin: 'Jakarta (CGK)',  destination: 'Medan (KNO)',    originCode: 'CGK', destinationCode: 'KNO', distanceKm: 1400 },
  ];

  const existingRoutes = await prisma.route.count();
  let routes = [];
  if (existingRoutes === 0) {
    routes = await Promise.all(routeDefs.map(r => prisma.route.create({ data: r })));
    console.log(`✅ ${routes.length} rute dibuat.`);
  } else {
    routes = await prisma.route.findMany({ orderBy: { createdAt: 'asc' } });
    console.log(`ℹ️  ${routes.length} rute sudah ada, skip.`);
  }

  // ── SCHEDULES + TIKET ──────────────────────────────────────────────────────
  const existingSchedules = await prisma.schedule.count();
  if (existingSchedules === 0) {
    const d1 = new Date(); d1.setDate(d1.getDate() + 1);
    const d2 = new Date(); d2.setDate(d2.getDate() + 2);
    const d3 = new Date(); d3.setDate(d3.getDate() + 3);
    const mk = (base, h, m) => { const t = new Date(base); t.setHours(h, m, 0, 0); return t; };

    const defs = [
      { r:routes[0], v:'Kereta Penataran',       c:'KA-345', dep:mk(d1,6,0),  arr:mk(d1,8,30),  eco:60, vip:0,  exe:20, pe:35000,  pv:0,       px:85000   },
      { r:routes[0], v:'Malioboro Ekspres',       c:'KA-456', dep:mk(d1,14,0), arr:mk(d1,16,30), eco:80, vip:20, exe:20, pe:35000,  pv:60000,   px:85000   },
      { r:routes[2], v:'Argo Bromo Anggrek',      c:'KA-001', dep:mk(d2,8,0),  arr:mk(d2,20,0),  eco:0,  vip:50, exe:50, pe:0,      pv:350000,  px:650000  },
      { r:routes[2], v:'Gumarang',                c:'KA-002', dep:mk(d2,16,0), arr:mk(d3,5,0),   eco:100,vip:30, exe:20, pe:200000, pv:350000,  px:600000  },
      { r:routes[4], v:'Argo Parahyangan',        c:'KA-101', dep:mk(d1,7,0),  arr:mk(d1,10,0),  eco:50, vip:20, exe:20, pe:80000,  pv:150000,  px:200000  },
      { r:routes[6], v:'Garuda Indonesia GA-301', c:'GA-301', dep:mk(d1,7,30), arr:mk(d1,8,45),  eco:120,vip:30, exe:12, pe:750000, pv:1200000, px:2500000 },
      { r:routes[6], v:'Lion Air JT-501',         c:'JT-501', dep:mk(d1,11,0), arr:mk(d1,12,15), eco:180,vip:0,  exe:0,  pe:450000, pv:0,       px:0       },
      { r:routes[8], v:'Garuda Indonesia GA-401', c:'GA-401', dep:mk(d1,9,0),  arr:mk(d1,11,30), eco:120,vip:30, exe:12, pe:900000, pv:1500000, px:3000000 },
      { r:routes[8], v:'AirAsia QZ-7512',         c:'QZ-7512',dep:mk(d2,13,0), arr:mk(d2,15,30), eco:180,vip:0,  exe:0,  pe:650000, pv:0,       px:0       },
      { r:routes[10],v:'Garuda Indonesia GA-501', c:'GA-501', dep:mk(d1,8,0),  arr:mk(d1,9,0),   eco:120,vip:20, exe:8,  pe:600000, pv:1000000, px:2000000 },
    ];

    let totalTickets = 0;
    for (const s of defs) {
      const sch = await prisma.schedule.create({
        data: { routeId: s.r.id, vehicleName: s.v, vehicleCode: s.c, departureTime: s.dep, arrivalTime: s.arr, totalSeatsEconomy: s.eco, totalSeatsVip: s.vip, totalSeatsExecutive: s.exe },
      });
      const gen = (count, cls, prefix, price) =>
        Array.from({ length: count }, (_, i) => ({
          scheduleId: sch.id, seatClass: cls,
          seatNumber: `${prefix}${Math.ceil((i+1)/6)}${['A','B','C','D','E','F'][i%6]}`,
          price,
        }));
      const tickets = [
        ...(s.eco > 0 ? gen(s.eco, 'ekonomi',   'E', s.pe) : []),
        ...(s.vip > 0 ? gen(s.vip, 'vip',        'V', s.pv) : []),
        ...(s.exe > 0 ? gen(s.exe, 'eksekutif', 'X', s.px) : []),
      ];
      if (tickets.length > 0) await prisma.ticket.createMany({ data: tickets });
      totalTickets += tickets.length;
    }
    console.log(`✅ ${defs.length} jadwal & ${totalTickets} tiket dibuat.`);
  } else {
    console.log(`ℹ️  Jadwal sudah ada (${existingSchedules}), skip.`);
  }

  console.log('\n🎉 Seeder selesai!\n');
  console.log('┌─────────────────────┬─────────────┬──────────────────┬─────────────┐');
  console.log('│ Username            │ Password    │ Role             │ Saldo       │');
  console.log('├─────────────────────┼─────────────┼──────────────────┼─────────────┤');
  console.log('│ admin               │ password123 │ admin            │ -           │');
  console.log('│ petugas_kereta1     │ password123 │ petugas_kereta   │ -           │');
  console.log('│ petugas_pesawat1    │ password123 │ petugas_pesawat  │ -           │');
  console.log('│ rudi123             │ password123 │ user             │ Rp2.000.000 │');
  console.log('│ anita456            │ password123 │ user             │ Rp1.500.000 │');
  console.log('└─────────────────────┴─────────────┴──────────────────┴─────────────┘');
}

main()
  .catch(e => { console.error('❌ Seed gagal:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());