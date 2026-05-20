'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle2, Calendar, X } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

const STATUSES = ['Hadir', 'Izin', 'Sakit', 'Alpa'];

export default function AbsensiPage() {
  const [data, setData] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [open, setOpen] = useState(false);
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0,7));
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [picked, setPicked] = useState({ santriId: '', santriNama: '', program: '', jam: '' });
  const [entries, setEntries] = useState([{ tanggal: new Date().toISOString().slice(0,10), status: 'Hadir', catatan: '' }]);

  const load = async () => {
    try {
      const params = new URLSearchParams({ bulan });
      if (!isAdmin) params.set('guruNama', user.name);
      const res = await apiFetch('absensi?' + params); setData(res.data || []);
      const s = await apiFetch('santri?status=aktif'); setSantriList(s.data || []);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, [bulan]);

  const openAdd = () => {
    setPicked({ santriId: '', santriNama: '', program: '', jam: '' });
    setEntries([{ tanggal: new Date().toISOString().slice(0,10), status: 'Hadir', catatan: '' }]);
    setOpen(true);
  };

  const onSantriChange = (id) => {
    const s = santriList.find(x => x.id === id);
    if (s) setPicked({ ...picked, santriId: s.id, santriNama: s.nama, program: s.program });
  };
  const addRow = () => setEntries([...entries, { tanggal: new Date().toISOString().slice(0,10), status: 'Hadir', catatan: '' }]);
  const removeRow = (idx) => setEntries(entries.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) => setEntries(entries.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const save = async () => {
    if (!picked.santriNama || !picked.program) { toast.error('Pilih santri'); return; }
    if (entries.length === 0) { toast.error('Tambah minimal 1 baris tanggal'); return; }
    const payload = {
      santriId: picked.santriId,
      santriNama: picked.santriNama,
      program: picked.program,
      guruNama: user.name,
      jam: picked.jam,
      entries: entries.map(e => ({ tanggal: e.tanggal, status: e.status, catatan: e.catatan })),
    };
    try { const res = await apiFetch('absensi', { method: 'POST', body: JSON.stringify(payload) }); toast.success(`${res.count || 1} absensi tersimpan`); setOpen(false); load(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus?')) return; try { await apiFetch('absensi/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };
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
          <p className="text-sm text-muted-foreground mt-1">{isAdmin ? 'Verifikasi setoran absensi dari asatidz.' : 'Pilih santri, lalu input beberapa tanggal sekaligus.'}</p>
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
                    {isAdmin && !a.verified && <Button size="sm" variant="ghost" onClick={() => verify(a.id)} className="text-green-600"><CheckCircle2 className="w-4 h-4"/></Button>}
                    <Button size="sm" variant="ghost" onClick={() => del(a.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle><Calendar className="w-5 h-5 inline mr-2"/> Catat Absensi Pertemuan</DialogTitle>
            <DialogDescription>Pilih santri, lalu tambah beberapa tanggal pertemuan sekaligus untuk efisiensi.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div><Label>Santri</Label>
              <Select value={picked.santriId} onValueChange={onSantriChange}>
                <SelectTrigger><SelectValue placeholder="Pilih santri"/></SelectTrigger>
                <SelectContent className="max-h-[250px]">{santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} — {s.program}</SelectItem>)}</SelectContent>
              </Select>
              {picked.program && <div className="text-xs text-sky-600 mt-1">Program: {picked.program}</div>}
            </div>
            <div><Label>Jam Pertemuan</Label><Input value={picked.jam} onChange={(e) => setPicked({...picked, jam: e.target.value})} placeholder="16:00-17:00 (optional)"/></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Daftar Tanggal Pertemuan</Label>
                <Button size="sm" variant="outline" onClick={addRow}><Plus className="w-3 h-3 mr-1"/> Tambah Tanggal</Button>
              </div>
              <div className="space-y-2">
                {entries.map((e, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded">
                    <Input type="date" value={e.tanggal} onChange={(ev) => updateRow(i, 'tanggal', ev.target.value)} className="col-span-4"/>
                    <Select value={e.status} onValueChange={(v) => updateRow(i, 'status', v)}>
                      <SelectTrigger className="col-span-3"><SelectValue/></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={e.catatan} onChange={(ev) => updateRow(i, 'catatan', ev.target.value)} placeholder="Catatan" className="col-span-4"/>
                    <Button size="sm" variant="ghost" className="col-span-1 text-red-600" onClick={() => removeRow(i)} disabled={entries.length === 1}><X className="w-4 h-4"/></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">Simpan ({entries.length} pertemuan)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
