'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, MessageCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function PendaftaranPage() {
  const [data, setData] = useState([]);

  const load = async () => {
    try { const res = await apiFetch('registrations'); setData(res.data || []); }
    catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Hapus pendaftaran ini?')) return;
    try { await apiFetch(`registrations/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const convertToSantri = async (r) => {
    if (!confirm(`Konversi ${r.nama} menjadi santri aktif?`)) return;
    try {
      await apiFetch('santri', { method: 'POST', body: JSON.stringify({
        nama: r.nama, umur: r.umur, alamat: r.alamat, nomorHp: r.whatsapp, program: r.program, status: 'aktif'
      })});
      await apiFetch(`registrations/${r.id}`, { method: 'DELETE' });
      toast.success('Berhasil dikonversi ke santri aktif');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const waLink = (no, nama) => {
    const phone = `62${(no || '').replace(/^0/,'').replace(/\D/g,'')}`;
    const msg = encodeURIComponent(`Assalamu'alaikum ${nama}, terima kasih telah mendaftar di Privat Tilawati. Kami ingin konfirmasi pendaftaran Anda.`);
    return `https://wa.me/${phone}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Pendaftaran Masuk</h1>
        <p className="text-sm text-muted-foreground mt-1">Calon santri yang baru saja mendaftar melalui website.</p>
      </div>

      {data.length === 0 ? (
        <Card className="p-12 text-center">
          <Inbox className="w-16 h-16 mx-auto text-slate-300 mb-3"/>
          <div className="text-muted-foreground">Belum ada pendaftaran baru</div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.map(r => (
            <Card key={r.id} className="p-5 hover:shadow-lg transition">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                  {r.nama?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg">{r.nama}</div>
                  <div className="text-xs text-muted-foreground">{r.umur} tahun · {r.whatsapp}</div>
                  <span className="mt-2 inline-block px-2 py-1 rounded text-xs bg-sky-100 text-sky-700">{r.program}</span>
                  <div className="text-xs text-muted-foreground mt-2">{r.alamat}</div>
                  {r.keterangan && <div className="mt-2 text-xs italic bg-yellow-50 p-2 rounded border border-yellow-100">"{r.keterangan}"</div>}
                  <div className="text-xs text-muted-foreground mt-2">Daftar pada: {new Date(r.createdAt).toLocaleString('id-ID')}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                <a href={waLink(r.whatsapp, r.nama)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50"><MessageCircle className="w-3.5 h-3.5 mr-1"/> WA</Button>
                </a>
                <Button size="sm" onClick={() => convertToSantri(r)} className="bg-sky-500 hover:bg-sky-600"><CheckCircle2 className="w-3.5 h-3.5 mr-1"/> Jadikan Santri</Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(r.id)}><Trash2 className="w-3.5 h-3.5"/></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
