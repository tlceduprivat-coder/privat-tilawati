import Link from 'next/link';
import { Instagram, MessageCircle, MapPin, Music2 } from 'lucide-react';

export default function SiteFooter() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP || '085117253381';
  const ig = process.env.NEXT_PUBLIC_INSTAGRAM || 'privattilawati.id';
  const logo = process.env.NEXT_PUBLIC_LOGO_URL;
  return (
    <footer className="bg-gradient-to-br from-sky-900 via-blue-900 to-sky-950 text-white mt-20">
      <div className="container mx-auto px-6 lg:px-10 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <img src={logo} alt="logo" className="h-14 w-auto object-contain mb-4" />
          <p className="text-sm text-white/80 max-w-md">
            Lembaga pendidikan Al-Qur'an yang berdiri sejak 2017. Mendidik generasi Qur'ani dengan metode Tilawati yang sistematis, menyenangkan, dan efektif.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-3">Navigasi</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/">Beranda</Link></li>
            <li><Link href="/about">Tentang Kami</Link></li>
            <li><Link href="/daftar">Pendaftaran</Link></li>
            <li><Link href="/login">Login</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Kontak &amp; Sosial</div>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0"/> Kp Sekemandung RT03 RW14, Girimekar, Cilengkrang, Kab. Bandung</li>
            <li className="flex gap-2"><MessageCircle className="w-4 h-4"/> <a href={`https://wa.me/62${wa.replace(/^0/,'')}`} target="_blank">{wa}</a></li>
            <li className="flex gap-2"><Instagram className="w-4 h-4"/> <a href={`https://instagram.com/${ig}`} target="_blank">@{ig}</a></li>
            <li className="flex gap-2"><Music2 className="w-4 h-4"/> <a href={`https://tiktok.com/@${ig}`} target="_blank">@{ig} (TikTok)</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 lg:px-10 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Privat Tilawati. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
