import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/mongo';
import { signToken, hashPassword, comparePassword, getCurrentUser, ensureSeedAdmin } from '@/lib/auth';

const json = (data, status = 200) => NextResponse.json(data, { status });

async function handle(request, { params }) {
  const path = (params?.path || []).join('/');
  const method = request.method;
  await ensureSeedAdmin();
  const db = await getDb();

  try {
    // Health
    if (path === '' || path === 'health') return json({ ok: true, service: 'privat-tilawati' });

    // ===== AUTH =====
    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = await request.json();
      if (!email || !password) return json({ error: 'Email dan password wajib diisi' }, 400);
      const user = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (!user) return json({ error: 'Email tidak ditemukan' }, 401);
      const ok = await comparePassword(password, user.passwordHash);
      if (!ok) return json({ error: 'Password salah' }, 401);
      const token = signToken({ id: user.id, role: user.role });
      return json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    if (path === 'auth/me' && method === 'GET') {
      const user = await getCurrentUser(request);
      if (!user) return json({ error: 'Unauthorized' }, 401);
      return json({ user });
    }
    if (path === 'auth/update-profile' && method === 'PUT') {
      const u = await getCurrentUser(request);
      if (!u) return json({ error: 'Unauthorized' }, 401);
      const body = await request.json();
      const update = {};
      if (body.name) update.name = body.name;
      if (body.email) update.email = body.email.toLowerCase();
      if (body.whatsapp !== undefined) update.whatsapp = body.whatsapp;
      if (body.password && body.password.length >= 6) {
        update.passwordHash = await hashPassword(body.password);
      }
      await db.collection('users').updateOne({ id: u.id }, { $set: update });
      return json({ success: true });
    }

    // ===== USERS MANAGEMENT (admin only) =====
    if (path === 'users' && method === 'GET') {
      const u = await getCurrentUser(request);
      if (!u || u.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const users = await db.collection('users').find({}, { projection: { _id: 0, passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data: users });
    }
    if (path === 'users' && method === 'POST') {
      const u = await getCurrentUser(request);
      if (!u || u.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const body = await request.json();
      if (!body.name || !body.email || !body.role) return json({ error: 'Nama, email, dan role wajib' }, 400);
      const existing = await db.collection('users').findOne({ email: body.email.toLowerCase() });
      if (existing) return json({ error: 'Email sudah terdaftar' }, 400);
      // Generate random password if not provided
      const plainPassword = body.password || (Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4)).toUpperCase().slice(0,8);
      const passwordHash = await hashPassword(plainPassword);
      const doc = {
        id: uuidv4(),
        name: body.name,
        email: body.email.toLowerCase(),
        role: body.role, // 'admin' | 'asatidz' | 'wali'
        whatsapp: body.whatsapp || '',
        santriId: body.santriId || null, // untuk wali (link ke santri)
        asatidzId: body.asatidzId || null, // untuk asatidz (link ke profile asatidz)
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      await db.collection('users').insertOne(doc);
      return json({ success: true, data: { id: doc.id, name: doc.name, email: doc.email, role: doc.role, whatsapp: doc.whatsapp, plainPassword } });
    }
    if (path.startsWith('users/') && method === 'PUT') {
      const u = await getCurrentUser(request);
      if (!u || u.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id; delete body.passwordHash;
      if (body.password) { body.passwordHash = await hashPassword(body.password); delete body.password; }
      if (body.email) body.email = body.email.toLowerCase();
      await db.collection('users').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('users/') && path.endsWith('/reset-password') && method === 'POST') {
      const u = await getCurrentUser(request);
      if (!u || u.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      const plainPassword = (Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4)).toUpperCase().slice(0,8);
      const passwordHash = await hashPassword(plainPassword);
      await db.collection('users').updateOne({ id }, { $set: { passwordHash } });
      const user = await db.collection('users').findOne({ id }, { projection: { _id: 0, passwordHash: 0 } });
      return json({ success: true, data: { ...user, plainPassword } });
    }
    if (path.startsWith('users/') && method === 'DELETE') {
      const u = await getCurrentUser(request);
      if (!u || u.role !== 'admin') return json({ error: 'Forbidden' }, 403);
      const id = path.split('/')[1];
      if (id === u.id) return json({ error: 'Tidak bisa menghapus diri sendiri' }, 400);
      await db.collection('users').deleteOne({ id });
      return json({ success: true });
    }

    // Helper to require auth
    const requireAuth = async (roles = null) => {
      const u = await getCurrentUser(request);
      if (!u) return { error: json({ error: 'Unauthorized' }, 401) };
      if (roles && !roles.includes(u.role)) return { error: json({ error: 'Forbidden' }, 403) };
      return { user: u };
    };

    // ===== REGISTRATIONS (public POST, admin GET) =====
    if (path === 'registrations' && method === 'POST') {
      const body = await request.json();
      const required = ['nama', 'umur', 'alamat', 'whatsapp', 'program'];
      for (const k of required) if (!body[k]) return json({ error: `Field ${k} wajib diisi` }, 400);
      const doc = {
        id: uuidv4(),
        nama: body.nama,
        umur: Number(body.umur),
        alamat: body.alamat,
        whatsapp: body.whatsapp,
        program: body.program,
        keterangan: body.keterangan || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await db.collection('registrations').insertOne(doc);
      return json({ success: true, data: doc });
    }
    if (path === 'registrations' && method === 'GET') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const data = await db.collection('registrations').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data });
    }
    if (path.startsWith('registrations/') && method === 'DELETE') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('registrations').deleteOne({ id });
      return json({ success: true });
    }

    // ===== SANTRI =====
    if (path === 'santri' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const q = status ? { status } : {};
      const data = await db.collection('santri').find(q, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data });
    }
    if (path === 'santri' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        nama: body.nama,
        umur: Number(body.umur || 0),
        alamat: body.alamat || '',
        nomorHp: body.nomorHp || '',
        program: body.program || '',
        status: body.status || 'aktif',
        gurId: body.gurId || null,
        createdAt: new Date().toISOString(),
      };
      await db.collection('santri').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('santri/') && method === 'PUT') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id;
      await db.collection('santri').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('santri/') && method === 'DELETE') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('santri').deleteOne({ id });
      return json({ success: true });
    }

    // ===== ASATIDZ =====
    if (path === 'asatidz' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const data = await db.collection('asatidz').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      // hitung jumlah santri per guru
      const santri = await db.collection('santri').find({}, { projection: { _id: 0, gurId: 1 } }).toArray();
      const dataWithCount = data.map(g => ({ ...g, jumlahSantri: santri.filter(s => s.gurId === g.id).length }));
      return json({ data: dataWithCount });
    }
    if (path === 'asatidz' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        nama: body.nama,
        nomorHp: body.nomorHp || '',
        alamat: body.alamat || '',
        status: body.status || 'aktif',
        createdAt: new Date().toISOString(),
      };
      await db.collection('asatidz').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('asatidz/') && method === 'PUT') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id;
      await db.collection('asatidz').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('asatidz/') && method === 'DELETE') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('asatidz').deleteOne({ id });
      return json({ success: true });
    }

    // ===== JADWAL =====
    if (path === 'jadwal' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const data = await db.collection('jadwal').find({}, { projection: { _id: 0 } }).sort({ hari: 1 }).toArray();
      return json({ data });
    }
    if (path === 'jadwal' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json();
      // Support multi-hari: if hari is array, create one record per day
      const haris = Array.isArray(body.hari) ? body.hari : [body.hari];
      const docs = haris.map(h => ({
        id: uuidv4(),
        guruId: body.guruId || null,
        guruNama: body.guruNama,
        santriId: body.santriId || null,
        santriNama: body.santriNama,
        program: body.program || '',
        hari: h,
        jam: body.jam,
        lokasi: body.lokasi || 'Offline',
        createdAt: new Date().toISOString(),
      }));
      await db.collection('jadwal').insertMany(docs);
      return json({ data: docs });
    }
    if (path.startsWith('jadwal/') && method === 'PUT') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id;
      await db.collection('jadwal').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('jadwal/') && method === 'DELETE') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('jadwal').deleteOne({ id });
      return json({ success: true });
    }

    // ===== PROGRESS =====
    if (path === 'progress' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz', 'wali']); if (auth.error) return auth.error;
      let query = {};
      // wali only sees their child's progress
      if (auth.user.role === 'wali' && auth.user.santriId) {
        const santri = await db.collection('santri').findOne({ id: auth.user.santriId });
        if (santri) query.santriNama = santri.nama;
        else return json({ data: [] });
      }
      const data = await db.collection('progress').find(query, { projection: { _id: 0 } }).sort({ tanggal: -1 }).toArray();
      return json({ data });
    }
    if (path === 'progress' && method === 'POST') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const body = await request.json();
      // Batch mode for group classes (multiple santri per session)
      if (Array.isArray(body.entries) && body.entries.length > 0) {
        const docs = body.entries.map(e => ({
          id: uuidv4(),
          santriId: e.santriId || null,
          santriNama: e.santriNama,
          guruNama: body.guruNama || auth.user.name,
          program: body.program || e.program || '',
          materi: body.materi || e.materi || '',
          halaman: e.halaman || body.halaman || '',
          catatan: e.catatan || '',
          nilai: e.nilai || '',
          nilaiAngka: e.nilaiAngka ? Number(e.nilaiAngka) : null,
          tipeKelas: body.tipeKelas || 'grup',
          tanggal: body.tanggal || new Date().toISOString().slice(0,10),
          createdAt: new Date().toISOString(),
        }));
        await db.collection('progress').insertMany(docs);
        return json({ data: docs, count: docs.length });
      }
      const doc = {
        id: uuidv4(),
        santriId: body.santriId || null,
        santriNama: body.santriNama,
        guruNama: body.guruNama || auth.user.name,
        program: body.program || '',
        materi: body.materi,
        halaman: body.halaman || '',
        catatan: body.catatan || '',
        nilai: body.nilai || '',
        nilaiAngka: body.nilaiAngka ? Number(body.nilaiAngka) : null,
        tipeKelas: body.tipeKelas || 'mandiri',
        tanggal: body.tanggal || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      };
      await db.collection('progress').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('progress/') && method === 'DELETE') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('progress').deleteOne({ id });
      return json({ success: true });
    }

    // ===== KEUANGAN =====
    if (path === 'keuangan' && method === 'GET') {
      const auth = await requireAuth(['admin', 'wali']); if (auth.error) return auth.error;
      let query = {};
      if (auth.user.role === 'wali' && auth.user.santriId) {
        const santri = await db.collection('santri').findOne({ id: auth.user.santriId });
        if (santri) query.santriNama = santri.nama;
        else return json({ data: [] });
      }
      const data = await db.collection('keuangan').find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data });
    }
    if (path === 'keuangan' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        santriId: body.santriId || null,
        santriNama: body.santriNama,
        program: body.program || '',
        bulan: body.bulan,
        nominal: Number(body.nominal || 0),
        status: body.status || 'Belum',
        catatan: body.catatan || '',
        createdAt: new Date().toISOString(),
      };
      await db.collection('keuangan').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('keuangan/') && method === 'PUT') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id;
      if (body.nominal !== undefined) body.nominal = Number(body.nominal);
      await db.collection('keuangan').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('keuangan/') && method === 'DELETE') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('keuangan').deleteOne({ id });
      return json({ success: true });
    }

    // ===== ABSENSI (per pertemuan) =====
    if (path === 'absensi' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const { searchParams } = new URL(request.url);
      const bulan = searchParams.get('bulan'); // format YYYY-MM
      const guruNama = searchParams.get('guruNama');
      const query = {};
      if (guruNama) query.guruNama = guruNama;
      if (bulan) query.tanggal = { $regex: '^' + bulan };
      const data = await db.collection('absensi').find(query, { projection: { _id: 0 } }).sort({ tanggal: -1 }).toArray();
      return json({ data });
    }
    if (path === 'absensi' && method === 'POST') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const body = await request.json();
      // Support batch: if body.entries is array, create one per entry
      if (Array.isArray(body.entries) && body.entries.length > 0) {
        const docs = body.entries.map(e => ({
          id: uuidv4(),
          santriId: e.santriId || body.santriId || null,
          santriNama: e.santriNama || body.santriNama,
          guruNama: body.guruNama || auth.user.name,
          program: e.program || body.program,
          tanggal: e.tanggal || new Date().toISOString().slice(0,10),
          jam: e.jam || body.jam || '',
          status: e.status || 'Hadir',
          catatan: e.catatan || '',
          verified: false,
          createdAt: new Date().toISOString(),
        }));
        await db.collection('absensi').insertMany(docs);
        return json({ data: docs, count: docs.length });
      }
      const doc = {
        id: uuidv4(),
        santriId: body.santriId || null,
        santriNama: body.santriNama,
        guruNama: body.guruNama || auth.user.name,
        program: body.program,
        tanggal: body.tanggal || new Date().toISOString().slice(0,10),
        jam: body.jam || '',
        status: body.status || 'Hadir',
        catatan: body.catatan || '',
        verified: false,
        createdAt: new Date().toISOString(),
      };
      await db.collection('absensi').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('absensi/') && path.endsWith('/verify') && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('absensi').updateOne({ id }, { $set: { verified: true } });
      return json({ success: true });
    }
    if (path.startsWith('absensi/') && method === 'PUT') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id;
      await db.collection('absensi').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('absensi/') && method === 'DELETE') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('absensi').deleteOne({ id });
      return json({ success: true });
    }

    // ===== SLOT KOSONG ASATIDZ =====
    if (path === 'slot-kosong' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const data = await db.collection('slot_kosong').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data });
    }
    if (path === 'slot-kosong' && method === 'POST') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const body = await request.json();
      // Lokasi can be array (multi-checkbox)
      const lokasiArr = Array.isArray(body.lokasi) ? body.lokasi : [body.lokasi || 'Offline'];
      const doc = {
        id: uuidv4(),
        guruId: body.guruId || null,
        guruNama: body.guruNama || auth.user.name,
        hari: body.hari,
        jam: body.jam,
        lokasi: lokasiArr,
        catatan: body.catatan || '',
        status: 'tersedia',
        createdAt: new Date().toISOString(),
      };
      await db.collection('slot_kosong').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('slot-kosong/') && method === 'DELETE') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('slot_kosong').deleteOne({ id });
      return json({ success: true });
    }

    // ===== RECEIPT ASATIDZ =====
    if (path === 'receipts' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      let query = {};
      if (auth.user.role === 'asatidz') query.guruNama = auth.user.name;
      const data = await db.collection('receipts').find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data });
    }
    if (path === 'receipts/calculate' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json(); // { guruNama, bulan, potonganPersen, tarifMap }
      const { guruNama, bulan, potonganPersen = 20, tarifMap = {} } = body;
      const absensiList = await db.collection('absensi').find({
        guruNama,
        tanggal: { $regex: '^' + bulan },
        status: 'Hadir',
      }, { projection: { _id: 0 } }).toArray();
      const items = absensiList.map(a => ({
        tanggal: a.tanggal,
        santri: a.santriNama,
        program: a.program,
        tarif: Number(tarifMap[a.program] || 0),
      }));
      const subtotal = items.reduce((s, i) => s + i.tarif, 0);
      const potongan = Math.round(subtotal * (potonganPersen / 100));
      const total = subtotal - potongan;
      return json({ data: { guruNama, bulan, items, subtotal, potonganPersen, potongan, total, jumlahPertemuan: items.length } });
    }
    if (path === 'receipts' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        nomor: 'PT/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-6),
        guruNama: body.guruNama,
        bulan: body.bulan,
        items: body.items || [],
        subtotal: Number(body.subtotal || 0),
        potonganPersen: Number(body.potonganPersen || 20),
        potongan: Number(body.potongan || 0),
        total: Number(body.total || 0),
        jumlahPertemuan: Number(body.jumlahPertemuan || 0),
        status: 'belum_dibayar',
        createdAt: new Date().toISOString(),
      };
      await db.collection('receipts').insertOne(doc);
      return json({ data: doc });
    }
    if (path.startsWith('receipts/') && method === 'PUT') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      const body = await request.json();
      delete body._id; delete body.id;
      await db.collection('receipts').updateOne({ id }, { $set: body });
      return json({ success: true });
    }
    if (path.startsWith('receipts/') && method === 'DELETE') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const id = path.split('/')[1];
      await db.collection('receipts').deleteOne({ id });
      return json({ success: true });
    }

    // ===== CHARTS DATA =====
    if (path === 'charts' && method === 'GET') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const { searchParams } = new URL(request.url);
      const range = searchParams.get('range') || 'month'; // day|week|month|year
      const now = new Date();
      let start, groupFormat;
      if (range === 'day') { start = new Date(now); start.setDate(start.getDate() - 30); groupFormat = (d) => d.slice(0,10); }
      else if (range === 'week') { start = new Date(now); start.setDate(start.getDate() - 84); groupFormat = (d) => { const dt = new Date(d); const wk = Math.ceil((dt.getDate() + new Date(dt.getFullYear(), dt.getMonth(), 1).getDay()) / 7); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-W${wk}`; }; }
      else if (range === 'year') { start = new Date(now); start.setFullYear(start.getFullYear() - 5); groupFormat = (d) => d.slice(0,4); }
      else { start = new Date(now); start.setMonth(start.getMonth() - 12); groupFormat = (d) => d.slice(0,7); }
      const startIso = start.toISOString();

      // Pendaftaran (santri masuk) per period
      const santri = await db.collection('santri').find({ createdAt: { $gte: startIso } }, { projection: { _id: 0, createdAt: 1, status: 1 } }).toArray();
      const masukKeluar = {};
      santri.forEach(s => {
        const k = groupFormat(s.createdAt);
        if (!masukKeluar[k]) masukKeluar[k] = { period: k, masuk: 0, keluar: 0 };
        masukKeluar[k].masuk += 1;
        if (s.status === 'non-aktif') masukKeluar[k].keluar += 1;
      });

      // Keuangan per period
      const keu = await db.collection('keuangan').find({ createdAt: { $gte: startIso } }, { projection: { _id: 0 } }).toArray();
      const keuangan = {};
      keu.forEach(k => {
        const key = groupFormat(k.createdAt);
        if (!keuangan[key]) keuangan[key] = { period: key, lunas: 0, belum: 0 };
        if (k.status === 'Lunas') keuangan[key].lunas += k.nominal || 0;
        else keuangan[key].belum += k.nominal || 0;
      });

      // Santri per asatidz
      const allAsatidz = await db.collection('asatidz').find({}, { projection: { _id: 0 } }).toArray();
      const allSantri = await db.collection('santri').find({ status: 'aktif' }, { projection: { _id: 0 } }).toArray();
      const santriPerAsatidz = allAsatidz.map(a => ({
        nama: a.nama,
        jumlah: allSantri.filter(s => s.gurId === a.id).length,
      })).sort((a,b) => b.jumlah - a.jumlah).slice(0, 10);

      return json({
        masukKeluar: Object.values(masukKeluar).sort((a,b) => a.period.localeCompare(b.period)),
        keuangan: Object.values(keuangan).sort((a,b) => a.period.localeCompare(b.period)),
        santriPerAsatidz,
      });
    }

    // ===== STATS for dashboard =====
    if (path === 'stats' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz', 'wali']); if (auth.error) return auth.error;
      const santriAktif = await db.collection('santri').countDocuments({ status: 'aktif' });
      const santriNon = await db.collection('santri').countDocuments({ status: 'non-aktif' });
      const asatidz = await db.collection('asatidz').countDocuments({});
      const pendingReg = await db.collection('registrations').countDocuments({ status: 'pending' });
      const lunas = await db.collection('keuangan').countDocuments({ status: 'Lunas' });
      const belum = await db.collection('keuangan').countDocuments({ status: 'Belum' });
      return json({ santriAktif, santriNon, asatidz, pendingReg, lunas, belum });
    }

    return json({ error: 'Not Found', path, method }, 404);
  } catch (err) {
    console.error('API error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
