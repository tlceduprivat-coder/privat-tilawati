'use client';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP || '085117253381';
  const phone = `62${wa.replace(/^0/,'')}`;
  const msg = encodeURIComponent('Assalamu\'alaikum, saya tertarik untuk mendaftar di Privat Tilawati.');
  return (
    <a href={`https://wa.me/${phone}?text=${msg}`} target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-xl flex items-center justify-center text-white transition hover:scale-110">
      <MessageCircle className="w-7 h-7" />
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
    </a>
  );
}
