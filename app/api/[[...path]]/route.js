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
      const doc = {
        id: uuidv4(),
        guruNama: body.guruNama,
        santriNama: body.santriNama,
        hari: body.hari,
        jam: body.jam,
        lokasi: body.lokasi || 'Offline',
        createdAt: new Date().toISOString(),
      };
      await db.collection('jadwal').insertOne(doc);
      return json({ data: doc });
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
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const data = await db.collection('progress').find({}, { projection: { _id: 0 } }).sort({ tanggal: -1 }).toArray();
      return json({ data });
    }
    if (path === 'progress' && method === 'POST') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        santriNama: body.santriNama,
        guruNama: body.guruNama || auth.user.name,
        materi: body.materi,
        halaman: body.halaman || '',
        catatan: body.catatan || '',
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
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const data = await db.collection('keuangan').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      return json({ data });
    }
    if (path === 'keuangan' && method === 'POST') {
      const auth = await requireAuth(['admin']); if (auth.error) return auth.error;
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        santriNama: body.santriNama,
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

    // ===== STATS for dashboard =====
    if (path === 'stats' && method === 'GET') {
      const auth = await requireAuth(['admin', 'asatidz']); if (auth.error) return auth.error;
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
