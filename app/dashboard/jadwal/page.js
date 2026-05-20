'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad'];
const LOKASI_OPSI = ['Offline (Home Visit)', 'Online (Zoom/Meet)', 'Di Tempat Kami', 'Kantor (Goes to Office)'];

export default function JadwalPage() {
  const [data, setData] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({ guruId: '', guruNama: '', santriId: '', santriNama: '', program: '', hari: [], jam: '', lokasi: 'Offline (Home Visit)' });

  const load = async () => {
    try {
      const res = await apiFetch('jadwal'); setData(res.data || []);
      const s = await apiFetch('santri?status=aktif'); setSantriList(s.data || []);
      const a = await apiFetch('asatidz'); setAsatidzList(a.data || []);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ guruId: '', guruNama: '', santriId: '', santriNama: '', program: '', hari: [], jam: '', lokasi: 'Offline (Home Visit)' }); setOpen(true); };
  const openEdit = (j) => { setEditing(j); setForm({ guruId: j.guruId || '', guruNama: j.guruNama, santriId: j.santriId || '', santriNama: j.santriNama, program: j.program || '', hari: [j.hari], jam: j.jam, lokasi: j.lokasi }); setOpen(true); };

  const onSantriChange = (id) => {
    const s = santriList.find(x => x.id === id);
    if (s) setForm({ ...form, santriId: s.id, santriNama: s.nama, program: s.program });
  };
  const onGuruChange = (id) => {
    const g = asatidzList.find(x => x.id === id);
    if (g) setForm({ ...form, guruId: g.id, guruNama: g.nama });
  };
  const toggleHari = (h) => setForm({ ...form, hari: form.hari.includes(h) ? form.hari.filter(x => x !== h) : [...form.hari, h] });

  const save = async () => {
    if (!form.guruNama || !form.santriNama || !form.jam || form.hari.length === 0) { toast.error('Mohon lengkapi data dan pilih minimal 1 hari'); return; }
    try {
      if (editing) {
        await apiFetch('jadwal/' + editing.id, { method: 'PUT', body: JSON.stringify({ ...form, hari: form.hari[0] }) });
        toast.success('Jadwal diperbarui');
      } else {
        await apiFetch('jadwal', { method: 'POST', body: JSON.stringify(form) });
        toast.success(`${form.hari.length} jadwal dibuat`);
      }
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus jadwal ini?')) return; try { await apiFetch('jadwal/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };

  const grouped = HARI.map(h => ({ hari: h, items: data.filter(j => j.hari === h).sort((a,b) => (a.jam||'').localeCompare(b.jam||'')) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Jadwal Mengajar</h1>
          <p className="text-sm text-muted-foreground mt-1">Jadwal terintegrasi dengan data Asatidz &amp; Santri. Bisa pilih beberapa hari sekaligus.</p>
        </div>
        {isAdmin && <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Tambah Jadwal</Button>}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grouped.map(g => (
          <Card key={g.hari} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg text-sky-600">{g.hari}</h3>
              <span className="text-xs text-muted-foreground">{g.items.length} jadwal</span>
            </div>
            {g.items.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center border-2 border-dashed rounded-lg">Tidak ada jadwal</div>
            ) : (
              <div className="space-y-2">
                {g.items.map(j => (
                  <div key={j.id} className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{j.santriNama}</div>
                        <div className="text-xs text-muted-foreground">Guru: {j.guruNama}</div>
                        {j.program && <div className="text-xs text-sky-700 mt-0.5">{j.program}</div>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-sky-700"><Clock className="w-3 h-3"/> {j.jam}</span>
                          <span className="flex items-center gap-1 text-green-700"><MapPin className="w-3 h-3"/> {j.lokasi}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(j)}><Pencil className="w-3 h-3"/></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => del(j.id)}><Trash2 className="w-3 h-3"/></Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
            <DialogDescription>Pilih guru &amp; santri dari data master. Boleh pilih beberapa hari sekaligus untuk 1 kelas yang sama.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div><Label>Nama Guru</Label>
              <Select value={form.guruId} onValueChange={onGuruChange}>
                <SelectTrigger><SelectValue placeholder="Pilih asatidz"/></SelectTrigger>
                <SelectContent>{asatidzList.map(a => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nama Santri</Label>
              <Select value={form.santriId} onValueChange={onSantriChange}>
                <SelectTrigger><SelectValue placeholder="Pilih santri"/></SelectTrigger>
                <SelectContent className="max-h-[250px]">{santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} — {s.program}</SelectItem>)}</SelectContent>
              </Select>
              {form.program && <div className="text-xs text-sky-600 mt-1">Program: {form.program}</div>}
            </div>
            <div>
              <Label>Hari (boleh pilih lebih dari satu)</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {HARI.map(h => (
                  <label key={h} className={`flex items-center gap-2 p-2 rounded border-2 cursor-pointer ${form.hari.includes(h) ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                    <Checkbox checked={form.hari.includes(h)} onCheckedChange={() => toggleHari(h)} />
                    <span className="text-xs font-medium">{h}</span>
                  </label>
                ))}
              </div>
              {editing && <div className="text-xs text-muted-foreground mt-1">Edit hanya berlaku 1 hari (hari pertama dipilih).</div>}
            </div>
            <div><Label>Jam</Label><Input value={form.jam} onChange={(e) => setForm({...form, jam: e.target.value})} placeholder="16:00 - 17:00"/></div>
            <div><Label>Lokasi</Label>
              <Select value={form.lokasi} onValueChange={(v) => setForm({...form, lokasi: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{LOKASI_OPSI.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Update' : `Simpan (${form.hari.length} hari)`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
