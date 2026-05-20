'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';
import { PROGRAMS } from '@/lib/programs';

const STATUSES = ['Hadir', 'Izin', 'Sakit', 'Alpa'];

export default function AbsensiPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0,7));
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({ santriNama: '', program: '', tanggal: new Date().toISOString().slice(0,10), jam: '', status: 'Hadir', catatan: '' });

  const load = async () => {
    try {
      const params = new URLSearchParams({ bulan });
      if (!isAdmin) params.set('guruNama', user.name);
      const res = await apiFetch('absensi?' + params); setData(res.data || []);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, [bulan]);

  const openAdd = () => { setForm({ santriNama: '', program: '', tanggal: new Date().toISOString().slice(0,10), jam: '', status: 'Hadir', catatan: '' }); setOpen(true); };

  const save = async () => {
    if (!form.santriNama || !form.program) { toast.error('Lengkapi santri dan program'); return; }
    try {
      await apiFetch('absensi', { method: 'POST', body: JSON.stringify({ ...form, guruNama: user.name }) });
      toast.success('Absensi tersimpan');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus absensi ini?')) return; try { await apiFetch('absensi/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };
  const verify = async (id) => { try { await apiFetch('absensi/' + id + '/verify', { method: 'POST' }); toast.success('Diverifikasi'); load(); } catch (e) { toast.error(e.message); } };

  const totalHadir = data.filter(a => a.status === 'Hadir').length;
  const totalIzin = data.filter(a => a.status === 'Izin').length;
  const totalSakit = data.filter(a => a.status === 'Sakit').length;
  const totalAlpa = data.filter(a => a.status === 'Alpa').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">{isAdmin ? 'Absensi Pertemuan' : 'Setor Absensi'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAdmin ? 'Pantau & verifikasi absensi pertemuan dari asatidz.' : 'Catat absensi pertemuan Anda setiap hari.'}</p>
        </div>
        <div className="flex gap-2">
          <Input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className="w-[180px]"/>
          <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Catat Absensi</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50"><div className="text-3xl font-extrabold text-green-700">{totalHadir}</div><div className="text-sm text-green-700">Hadir</div></Card>
        <Card className="p-4 bg-yellow-50"><div className="text-3xl font-extrabold text-yellow-700">{totalIzin}</div><div className="text-sm text-yellow-700">Izin</div></Card>
        <Card className="p-4 bg-orange-50"><div className="text-3xl font-extrabold text-orange-700">{totalSakit}</div><div className="text-sm text-orange-700">Sakit</div></Card>
        <Card className="p-4 bg-red-50"><div className="text-3xl font-extrabold text-red-700">{totalAlpa}</div><div className="text-sm text-red-700">Alpa</div></Card>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Jam</th>
                <th className="py-2 px-3">Santri</th>
                {isAdmin && <th className="py-2 px-3">Guru</th>}
                <th className="py-2 px-3">Program</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Verified</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (<tr><td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-muted-foreground">Belum ada absensi bulan ini</td></tr>)}
              {data.map(a => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3">{a.tanggal}</td>
                  <td className="py-3 px-3">{a.jam || '-'}</td>
                  <td className="py-3 px-3 font-medium">{a.santriNama}</td>
                  {isAdmin && <td className="py-3 px-3">{a.guruNama}</td>}
                  <td className="py-3 px-3 text-xs">{a.program}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'Hadir' ? 'bg-green-100 text-green-700' : a.status === 'Izin' ? 'bg-yellow-100 text-yellow-700' : a.status === 'Sakit' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                  </td>
                  <td className="py-3 px-3">{a.verified ? <CheckCircle2 className="w-4 h-4 text-green-600"/> : <span className="text-xs text-muted-foreground">Belum</span>}</td>
                  <td className="py-3 px-3 text-right">
                    {isAdmin && !a.verified && <Button size="sm" variant="ghost" onClick={() => verify(a.id)} className="text-green-600" title="Verifikasi"><CheckCircle2 className="w-4 h-4"/></Button>}
                    <Button size="sm" variant="ghost" onClick={() => del(a.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Absensi Pertemuan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Santri</Label><Input value={form.santriNama} onChange={(e) => setForm({...form, santriNama: e.target.value})} /></div>
            <div><Label>Program / Jenis Kelas</Label>
              <Select value={form.program} onValueChange={(v) => setForm({...form, program: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih program"/></SelectTrigger>
                <SelectContent className="max-h-[300px]">{PROGRAMS.map(p => <SelectItem key={p.id} value={p.nama}>{p.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})}/></div>
              <div><Label>Jam</Label><Input value={form.jam} onChange={(e) => setForm({...form, jam: e.target.value})} placeholder="16:00-17:00"/></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Catatan</Label><Input value={form.catatan} onChange={(e) => setForm({...form, catatan: e.target.value})} placeholder="Optional"/></div>
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
