'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Clock, MapPin, User } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad'];
const LOKASI_OPSI = ['Offline (Home Visit)', 'Online (Zoom/Meet)', 'Di Tempat Kami', 'Kantor (Goes to Office)'];

export default function SlotKosongPage() {
  const [data, setData] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({ guruId: '', guruNama: '', hari: 'Senin', jam: '', lokasi: ['Offline (Home Visit)'], catatan: '' });

  const load = async () => {
    try {
      const res = await apiFetch('slot-kosong'); setData(res.data || []);
      if (isAdmin) { const a = await apiFetch('asatidz'); setAsatidzList(a.data || []); }
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm({
      guruId: '',
      guruNama: isAdmin ? '' : user?.name || '',
      hari: 'Senin', jam: '', lokasi: ['Offline (Home Visit)'], catatan: ''
    });
    setOpen(true);
  };
  const onGuruChange = (id) => { const g = asatidzList.find(x => x.id === id); if (g) setForm({ ...form, guruId: g.id, guruNama: g.nama }); };
  const toggleLokasi = (l) => setForm({ ...form, lokasi: form.lokasi.includes(l) ? form.lokasi.filter(x => x !== l) : [...form.lokasi, l] });

  const save = async () => {
    if (!form.guruNama || !form.jam || form.lokasi.length === 0) { toast.error('Lengkapi guru, jam, dan minimal 1 lokasi'); return; }
    try { await apiFetch('slot-kosong', { method: 'POST', body: JSON.stringify(form) }); toast.success('Slot kosong ditambahkan'); setOpen(false); load(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus slot?')) return; try { await apiFetch('slot-kosong/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };

  const filtered = isAdmin ? data : data.filter(s => s.guruNama === user?.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">{isAdmin ? 'Slot Kosong Semua Guru' : 'Slot Kosong Saya'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAdmin ? 'Lihat ketersediaan jam mengajar tiap asatidz.' : 'Daftarkan jam-jam kosong Anda.'}</p>
        </div>
        <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Tambah Slot Kosong</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground col-span-full">Belum ada slot kosong</Card>}
        {filtered.map(s => (
          <Card key={s.id} className="p-5 hover:shadow-md transition border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><User className="w-3 h-3"/> {s.guruNama}</div>
                <div className="font-bold text-lg text-emerald-700">{s.hari}</div>
                <div className="flex items-center gap-1 text-sm text-sky-700 mt-1"><Clock className="w-3.5 h-3.5"/> {s.jam}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(Array.isArray(s.lokasi) ? s.lokasi : [s.lokasi]).map((l, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"><MapPin className="w-3 h-3"/>{l}</span>
                  ))}
                </div>
                {s.catatan && <div className="text-xs text-muted-foreground mt-2 italic">"{s.catatan}"</div>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(s.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Slot Kosong</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {isAdmin && (
              <div><Label>Asatidz</Label>
                <Select value={form.guruId} onValueChange={onGuruChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih asatidz"/></SelectTrigger>
                  <SelectContent>{asatidzList.map(a => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Hari</Label>
              <Select value={form.hari} onValueChange={(v) => setForm({...form, hari: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{HARI.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Jam</Label><Input value={form.jam} onChange={(e) => setForm({...form, jam: e.target.value})} placeholder="16:00-17:00"/></div>
            <div>
              <Label>Lokasi (boleh pilih beberapa)</Label>
              <div className="mt-2 space-y-2">
                {LOKASI_OPSI.map(l => (
                  <label key={l} className={`flex items-center gap-2 p-2 rounded border-2 cursor-pointer ${form.lokasi.includes(l) ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                    <Checkbox checked={form.lokasi.includes(l)} onCheckedChange={() => toggleLokasi(l)} />
                    <span className="text-sm">{l}</span>
                  </label>
                ))}
              </div>
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
