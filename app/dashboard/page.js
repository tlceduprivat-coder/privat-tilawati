'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, GraduationCap, Inbox, Wallet, UserX, CheckCircle2 } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState({ santriAktif: 0, santriNon: 0, asatidz: 0, pendingReg: 0, lunas: 0, belum: 0 });
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    apiFetch('stats').then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Santri Aktif', value: stats.santriAktif, icon: Users, color: 'from-sky-500 to-blue-600', bg: 'bg-sky-50', text: 'text-sky-600' },
    { label: 'Santri Non-Aktif', value: stats.santriNon, icon: UserX, color: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', text: 'text-slate-600' },
    { label: 'Total Asatidz', value: stats.asatidz, icon: GraduationCap, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Pendaftaran Baru', value: stats.pendingReg, icon: Inbox, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
    { label: 'SPP Lunas', value: stats.lunas, icon: CheckCircle2, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'SPP Belum Bayar', value: stats.belum, icon: Wallet, color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan data Privat Tilawati hari ini.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="p-5 hover:shadow-lg transition border-2 hover:border-sky-200">
            <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-3`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-extrabold text-slate-800">{loading ? '…' : c.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-3">Akses Cepat</h3>
          <div className="grid grid-cols-2 gap-2">
            {user?.role === 'admin' && (
              <>
                <Link href="/dashboard/pendaftaran" className="p-3 rounded-lg border hover:bg-sky-50 hover:border-sky-300 transition text-sm flex items-center gap-2"><Inbox className="w-4 h-4 text-sky-500"/> Pendaftaran</Link>
                <Link href="/dashboard/keuangan" className="p-3 rounded-lg border hover:bg-sky-50 hover:border-sky-300 transition text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-sky-500"/> Keuangan</Link>
                <Link href="/dashboard/asatidz" className="p-3 rounded-lg border hover:bg-sky-50 hover:border-sky-300 transition text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4 text-sky-500"/> Asatidz</Link>
              </>
            )}
            <Link href="/dashboard/santri" className="p-3 rounded-lg border hover:bg-sky-50 hover:border-sky-300 transition text-sm flex items-center gap-2"><Users className="w-4 h-4 text-sky-500"/> Santri</Link>
            <Link href="/dashboard/jadwal" className="p-3 rounded-lg border hover:bg-sky-50 hover:border-sky-300 transition text-sm flex items-center gap-2"><GraduationCap className="w-4 h-4 text-sky-500"/> Jadwal</Link>
            <Link href="/dashboard/progress" className="p-3 rounded-lg border hover:bg-sky-50 hover:border-sky-300 transition text-sm flex items-center gap-2"><Users className="w-4 h-4 text-sky-500"/> Progress</Link>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-sky-500 to-blue-600 text-white">
          <h3 className="font-bold text-lg mb-2">Assalamu'alaikum, {user?.name}</h3>
          <p className="text-sm text-white/90 mb-4">Semoga Allah memudahkan tugas Anda hari ini dalam mengelola dan mengajarkan Al-Qur'an. Aamiin.</p>
          <div className="font-arabic text-xl text-yellow-200">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</div>
        </Card>
      </div>
    </div>
  );
}
