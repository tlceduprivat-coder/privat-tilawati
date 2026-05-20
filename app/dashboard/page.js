'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, Inbox, Wallet, UserX, CheckCircle2, BookOpen, ClipboardList, Receipt, TrendingUp, Calendar } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardHome() {
  const [stats, setStats] = useState({ santriAktif: 0, santriNon: 0, asatidz: 0, pendingReg: 0, lunas: 0, belum: 0 });
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getCurrentUser(); setUser(u);
    apiFetch('stats').then(setStats).catch(() => {});
    if (u?.role !== 'admin') {
      apiFetch('progress').then(r => setProgress(r.data || [])).catch(() => {});
    }
    setTimeout(() => setLoading(false), 400);
  }, []);

  if (!user) return null;

  if (user.role === 'admin') {
    const cards = [
      { label: 'Santri Aktif', value: stats.santriAktif, icon: Users, color: 'sky', href: '/dashboard/santri' },
      { label: 'Santri Non-Aktif', value: stats.santriNon, icon: UserX, color: 'slate', href: '/dashboard/santri' },
      { label: 'Total Asatidz', value: stats.asatidz, icon: GraduationCap, color: 'green', href: '/dashboard/asatidz' },
      { label: 'Pendaftaran Baru', value: stats.pendingReg, icon: Inbox, color: 'yellow', href: '/dashboard/pendaftaran' },
      { label: 'SPP Lunas', value: stats.lunas, icon: CheckCircle2, color: 'emerald', href: '/dashboard/keuangan' },
      { label: 'SPP Belum Bayar', value: stats.belum, icon: Wallet, color: 'red', href: '/dashboard/keuangan' },
    ];
    const colorMap = {
      sky: 'bg-sky-50 text-sky-600', green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600',
      slate: 'bg-slate-100 text-slate-600', emerald: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600',
    };
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Dashboard Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan data Privat Tilawati.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <Link key={i} href={c.href}>
              <Card className="p-5 hover:shadow-lg transition border-2 hover:border-sky-200 cursor-pointer">
                <div className={`w-12 h-12 rounded-xl ${colorMap[c.color]} flex items-center justify-center mb-3`}><c.icon className="w-6 h-6"/></div>
                <div className="text-3xl font-extrabold text-slate-800">{loading ? '…' : c.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
              </Card>
            </Link>
          ))}
        </div>
        <Card className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <h3 className="font-bold text-lg mb-2">Assalamu'alaikum, {user.name}</h3>
          <p className="text-sm text-white/90 mb-4">Lihat <Link href="/dashboard/laporan" className="underline font-semibold">Laporan &amp; Grafik</Link> untuk analisis mendalam.</p>
          <div className="font-arabic text-xl text-yellow-200">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</div>
        </Card>
      </div>
    );
  }

  if (user.role === 'asatidz') {
    const mySantri = [...new Set(progress.map(p => p.santriNama))];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Dashboard Asatidz</h1>
          <p className="text-sm text-muted-foreground mt-1">Selamat datang, {user.name}.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/absensi"><Card className="p-5 hover:shadow-lg transition cursor-pointer">
            <ClipboardList className="w-8 h-8 text-sky-500 mb-2"/><div className="font-bold">Setor Absensi</div>
            <div className="text-xs text-muted-foreground">Catat kehadiran santri</div>
          </Card></Link>
          <Link href="/dashboard/progress"><Card className="p-5 hover:shadow-lg transition cursor-pointer">
            <BookOpen className="w-8 h-8 text-sky-500 mb-2"/><div className="font-bold">Update Progress</div>
            <div className="text-xs text-muted-foreground">Catat materi & nilai</div>
          </Card></Link>
          <Link href="/dashboard/slot-kosong"><Card className="p-5 hover:shadow-lg transition cursor-pointer">
            <Calendar className="w-8 h-8 text-sky-500 mb-2"/><div className="font-bold">Slot Kosong</div>
            <div className="text-xs text-muted-foreground">Tambah jam kosong</div>
          </Card></Link>
          <Link href="/dashboard/receipt"><Card className="p-5 hover:shadow-lg transition cursor-pointer">
            <Receipt className="w-8 h-8 text-sky-500 mb-2"/><div className="font-bold">Receipt</div>
            <div className="text-xs text-muted-foreground">Lihat & unduh PDF</div>
          </Card></Link>
        </div>
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-500"/> Santri yang Anda bimbing</h2>
          {mySantri.length === 0 ? <div className="text-muted-foreground text-sm">Belum ada progress santri</div> : (
            <div className="flex flex-wrap gap-2">{mySantri.map(s => <span key={s} className="px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm">{s}</span>)}</div>
          )}
        </Card>
      </div>
    );
  }

  // WALI
  const chartData = progress.filter(p => p.nilaiAngka).reverse().slice(-10).map(p => ({ tanggal: p.tanggal, nilai: p.nilaiAngka }));
  const lastProgress = progress[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Dashboard Wali / Santri</h1>
        <p className="text-sm text-muted-foreground mt-1">Selamat datang, {user.name}.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <BookOpen className="w-8 h-8 mb-2"/><div className="text-3xl font-extrabold">{progress.length}</div><div className="text-sm opacity-90">Total Catatan Progress</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <TrendingUp className="w-8 h-8 mb-2"/><div className="text-3xl font-extrabold">{lastProgress?.nilai || lastProgress?.nilaiAngka || '-'}</div><div className="text-sm opacity-90">Nilai Terakhir</div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <BookOpen className="w-8 h-8 mb-2"/><div className="text-xl font-extrabold">{lastProgress?.materi || '-'}</div><div className="text-sm opacity-90">Materi Terakhir</div>
        </Card>
      </div>
      {chartData.length > 0 && (
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-500"/> Grafik Perkembangan Nilai</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="tanggal" fontSize={11}/><YAxis domain={[0, 100]} fontSize={11}/><Tooltip/>
              <Line type="monotone" dataKey="nilai" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 5 }}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/progress"><Card className="p-6 hover:shadow-lg transition cursor-pointer">
          <BookOpen className="w-10 h-10 text-sky-500 mb-2"/><h3 className="font-bold text-lg">Detail Progress Pembelajaran</h3>
          <p className="text-sm text-muted-foreground mt-1">Lihat catatan harian, materi, nilai, dan komentar guru.</p>
        </Card></Link>
        <Link href="/dashboard/keuangan"><Card className="p-6 hover:shadow-lg transition cursor-pointer">
          <Wallet className="w-10 h-10 text-sky-500 mb-2"/><h3 className="font-bold text-lg">SPP &amp; Tagihan</h3>
          <p className="text-sm text-muted-foreground mt-1">Cek status SPP per bulan & tagihan yang belum dibayar.</p>
        </Card></Link>
      </div>
    </div>
  );
}
