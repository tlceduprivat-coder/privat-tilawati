'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, GraduationCap, Calendar, BookOpen, Wallet, Inbox, LogOut, Menu, X, Settings, UserCog, ClipboardList, Receipt, CalendarClock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout } from '@/lib/api';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const logo = process.env.NEXT_PUBLIC_LOGO_URL;

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { router.replace('/login'); return; }
    setUser(u);
  }, [router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Memuat...</div>;

  const adminMenu = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/pendaftaran', label: 'Pendaftaran Masuk', icon: Inbox },
    { href: '/dashboard/santri', label: 'Data Santri', icon: Users },
    { href: '/dashboard/asatidz', label: 'Data Asatidz', icon: GraduationCap },
    { href: '/dashboard/users', label: 'Manajemen Akun', icon: UserCog },
    { href: '/dashboard/jadwal', label: 'Jadwal Mengajar', icon: Calendar },
    { href: '/dashboard/slot-kosong', label: 'Slot Kosong Guru', icon: CalendarClock },
    { href: '/dashboard/absensi', label: 'Absensi Pertemuan', icon: ClipboardList },
    { href: '/dashboard/progress', label: 'Progress Pembelajaran', icon: BookOpen },
    { href: '/dashboard/keuangan', label: 'Administrasi Keuangan', icon: Wallet },
    { href: '/dashboard/receipt', label: 'Receipt Asatidz', icon: Receipt },
    { href: '/dashboard/laporan', label: 'Laporan & Grafik', icon: TrendingUp },
    { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
  ];
  const asatidzMenu = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/jadwal', label: 'Jadwal Mengajar', icon: Calendar },
    { href: '/dashboard/slot-kosong', label: 'Slot Kosong Saya', icon: CalendarClock },
    { href: '/dashboard/absensi', label: 'Setor Absensi', icon: ClipboardList },
    { href: '/dashboard/progress', label: 'Progress Pembelajaran', icon: BookOpen },
    { href: '/dashboard/receipt', label: 'Receipt Saya', icon: Receipt },
    { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
  ];
  const waliMenu = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/progress', label: 'Progress Anak', icon: BookOpen },
    { href: '/dashboard/keuangan', label: 'SPP & Tagihan', icon: Wallet },
    { href: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
  ];
  const menu = user.role === 'admin' ? adminMenu : user.role === 'asatidz' ? asatidzMenu : waliMenu;
  const roleLabel = { admin: 'Admin Panel', asatidz: 'Asatidz Panel', wali: 'Wali/Santri Panel' }[user.role] || 'Panel';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky top-0 left-0 z-30 w-72 h-screen bg-white border-r border-border transition-transform flex flex-col`}>
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
          <div className="leading-tight flex-1">
            <div className="font-extrabold text-sky-600 text-sm">Privat Tilawati</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{roleLabel}</div>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)}><X className="w-5 h-5"/></button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map(m => {
            const active = pathname === m.href;
            return (
              <Link key={m.href} href={m.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? 'bg-sky-500 text-white shadow' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-600'}`}>
                <m.icon className="w-4 h-4" />
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">{user.name?.[0] || 'U'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <Button onClick={logout} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-white border-b border-border h-14 flex items-center px-4 md:px-6 gap-3">
          <button className="md:hidden" onClick={() => setOpen(true)}><Menu className="w-5 h-5"/></button>
          <div className="font-semibold text-slate-700">Selamat datang, {user.name}</div>
          <div className="ml-auto text-xs text-muted-foreground hidden md:block">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </header>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
