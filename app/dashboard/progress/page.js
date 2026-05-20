'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

export default function ProgressPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ santriNama: '', guruNama: '', materi: '', halaman: '', catatan: '', tanggal: new Date().toISOString().slice(0,10) });
  const user = getCurrentUser();

  const load = async () => {
    try { const res = await apiFetch('progress'); setData(res.data || []); }
    catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({ santriNama: '', guruNama: user?.name || '', materi: '', halaman: '', catatan: '', tanggal: new Date().toISOString().slice(0,10) });
    setOpen(true);
  };

  const save = async () => {
    if (!form.santriNama || !form.materi) { toast.error('Santri dan materi wajib diisi'); return; }
    try {
      await apiFetch('progress', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Progress tersimpan');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => {
    if (!confirm('Hapus catatan progress ini?')) return;
    try { await apiFetch(`progress/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Progress Pembelajaran</h1>
          <p className="text-sm text-muted-foreground mt-1">Catat dan pantau perkembangan setiap santri.</p>
        </div>
        <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Catat Progress</Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Santri</th>
                <th className="py-2 px-3">Guru</th>
                <th className="py-2 px-3">Materi</th>
                <th className="py-2 px-3">Halaman</th>
                <th className="py-2 px-3">Catatan</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (<tr><td colSpan="7" className="py-8 text-center text-muted-foreground">Belum ada catatan progress</td></tr>)}
              {data.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3 whitespace-nowrap">{p.tanggal}</td>
                  <td className="py-3 px-3 font-medium">{p.santriNama}</td>
                  <td className="py-3 px-3">{p.guruNama}</td>
                  <td className="py-3 px-3"><span className="px-2 py-1 rounded text-xs bg-sky-100 text-sky-700">{p.materi}</span></td>
                  <td className="py-3 px-3">{p.halaman}</td>
                  <td className="py-3 px-3 max-w-[250px] truncate" title={p.catatan}>{p.catatan}</td>
                  <td className="py-3 px-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => del(p.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle><BookOpen className="w-5 h-5 inline mr-2"/> Catat Progress</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nama Santri</Label><Input value={form.santriNama} onChange={(e) => setForm({...form, santriNama: e.target.value})} /></div>
              <div><Label>Nama Guru</Label><Input value={form.guruNama} onChange={(e) => setForm({...form, guruNama: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Materi</Label><Input value={form.materi} onChange={(e) => setForm({...form, materi: e.target.value})} placeholder="Jilid 3 / Juz 1 / dll."/></div>
              <div><Label>Halaman</Label><Input value={form.halaman} onChange={(e) => setForm({...form, halaman: e.target.value})} placeholder="hal 12-15"/></div>
            </div>
            <div><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})} /></div>
            <div><Label>Catatan</Label><Textarea value={form.catatan} onChange={(e) => setForm({...form, catatan: e.target.value})} rows={3} placeholder="Bagus, tajwid sudah benar, lanjut..."/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
