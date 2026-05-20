'use client';
import { useState } from 'react';
import SiteNavbar from '@/components/SiteNavbar';
import SiteFooter from '@/components/SiteFooter';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { PROGRAMS, formatRupiah } from '@/lib/programs';

export default function DaftarPage() {
  const [form, setForm] = useState({ nama: '', umur: '', alamat: '', whatsapp: '', program: '', keterangan: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onChange = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nama || !form.umur || !form.alamat || !form.whatsapp || !form.program) {
      toast.error('Semua field wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal');
      toast.success('Pendaftaran berhasil! Kami akan menghubungi Anda via WhatsApp.');
      setDone(true);
      const wa = process.env.NEXT_PUBLIC_WHATSAPP || '085117253381';
      const phone = `62${wa.replace(/^0/,'')}`;
      const msg = encodeURIComponent(
        `Assalamu'alaikum, saya baru saja mendaftar di Privat Tilawati.\n\nNama: ${form.nama}\nUmur: ${form.umur}\nProgram: ${form.program}\nAlamat: ${form.alamat}\n\nMohon info selanjutnya.`
      );
      setTimeout(() => { window.open(`https://wa.me/${phone}?text=${msg}`, '_blank'); }, 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <SiteNavbar />
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-sky-600 text-white py-16">
        <div className="container mx-auto px-6 lg:px-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Pendaftaran Santri</h1>
          <p className="text-white/90 max-w-xl mx-auto">Isi formulir di bawah ini untuk memulai perjalanan belajar Al-Qur'an bersama kami.</p>
        </div>
      </section>

      <section className="container mx-auto px-6 lg:px-10 py-12 max-w-3xl">
        {done ? (
          <Card className="p-10 text-center border-2 border-green-500">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-extrabold mb-2">Pendaftaran Berhasil!</h2>
            <p className="text-muted-foreground mb-6">Terima kasih telah mendaftar. Tim kami akan menghubungi Anda melalui WhatsApp dalam 1x24 jam.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setDone(false); setForm({ nama: '', umur: '', alamat: '', whatsapp: '', program: '', keterangan: '' }); }} variant="outline">Daftar Lagi</Button>
              <a href="/"><Button className="bg-green-600 hover:bg-green-700">Kembali ke Beranda</Button></a>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input id="nama" value={form.nama} onChange={(e) => onChange('nama', e.target.value)} placeholder="Nama lengkap calon santri" className="mt-1.5" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="umur">Umur *</Label>
                  <Input id="umur" type="number" value={form.umur} onChange={(e) => onChange('umur', e.target.value)} placeholder="Contoh: 8" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
                  <Input id="whatsapp" value={form.whatsapp} onChange={(e) => onChange('whatsapp', e.target.value)} placeholder="08xxx" className="mt-1.5" />
                </div>
              </div>
              <div>
                <Label htmlFor="alamat">Alamat *</Label>
                <Textarea id="alamat" value={form.alamat} onChange={(e) => onChange('alamat', e.target.value)} placeholder="Alamat lengkap" className="mt-1.5" rows={2} />
              </div>
              <div>
                <Label htmlFor="program">Pilih Program *</Label>
                <Select value={form.program} onValueChange={(v) => onChange('program', v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Pilih program" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {PROGRAMS.map(p => (
                      <SelectItem key={p.id} value={p.nama}>
                        {p.nama} {p.tarif > 0 ? ` — ${formatRupiah(p.tarif)}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                <Textarea id="keterangan" value={form.keterangan} onChange={(e) => onChange('keterangan', e.target.value)} placeholder="Misal: preferensi jadwal, kemampuan saat ini, dsb." className="mt-1.5" rows={3} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Mengirim...</> : <><MessageCircle className="w-4 h-4 mr-2"/> Kirim Pendaftaran &amp; Lanjut ke WhatsApp</>}
              </Button>
            </form>
          </Card>
        )}
      </section>

      <SiteFooter />
      <WhatsAppFloat />
    </main>
  );
}
