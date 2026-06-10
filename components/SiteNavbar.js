'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const logo = process.env.NEXT_PUBLIC_LOGO_URL;
  const links = [
    { href: '/', label: 'Beranda' },
    { href: '/about', label: 'Tentang' },
    { href: '/daftar', label: 'Pendaftaran' },
  ];
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-border">
      <div className="container mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center py-3">
          <img src="/privattilawati-long.png" alt="Privat Tilawati" className="h-9 md:h-10 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm font-medium hover:text-sky-600 transition">{l.label}</Link>
          ))}
          <Link href="/login">
            <Button variant="outline" className="border-sky-500 text-sky-600 hover:bg-sky-50">Login</Button>
          </Link>
          <Link href="/daftar">
            <Button className="bg-sky-500 hover:bg-sky-600">Daftar Sekarang</Button>
          </Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium py-2" onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full border-sky-500 text-sky-600">Login</Button>
            </Link>
            <Link href="/daftar" onClick={() => setOpen(false)}>
              <Button className="w-full bg-sky-500 hover:bg-sky-600">Daftar Sekarang</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
