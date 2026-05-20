'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Clock, MapPin } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad'];

export default function SlotKosongPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({ hari: 'Senin', jam: '', lokasi: 'Offline', catatan: '' });

  const load = async () => { try { const res = await apiFetch('slot-kosong'); setData(res.data || []); } catch (e) { toast.error(e.message); } };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.jam) { toast.error('Jam wajib diisi'); return; }
    try { await apiFetch('slot-kosong', { method: 'POST', body: JSON.stringify({ ...form, guruNama: user.name }) }); toast.success('Slot kosong ditambahkan'); setOpen(false); load(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus slot ini?')) return; try { await apiFetch('slot-kosong/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };

  const filtered = isAdmin ? data : data.filter(s => s.guruNama === user?.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">{isAdmin ? 'Slot Kosong Semua Guru' : 'Slot Kosong Saya'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAdmin ? 'Lihat ketersediaan jam mengajar semua asatidz untuk asign santri baru.' : 'Daftarkan jam-jam kosong Anda agar admin bisa menjadwalkan santri baru.'}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Tambah Slot Kosong</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <Card className="p-8 text-center text-muted-foreground col-span-full">Belum ada slot kosong</Card>}
        {filtered.map(s => (
          <Card key={s.id} className="p-5 hover:shadow-md transition border-l-4 border-l-emerald-500">
            <div className="flex items-start justify-between">
              <div>
                {isAdmin && <div className="text-xs text-muted-foreground">{s.guruNama}</div>}
                <div className="font-bold text-lg text-emerald-700">{s.hari}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {s.jam}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/> {s.lokasi}</span>
                </div>
                {s.catatan && <div className="text-xs text-muted-foreground mt-2 italic">{s.catatan}</div>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => del(s.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Slot Kosong</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Hari</Label>
              <Select value={form.hari} onValueChange={(v) => setForm({...form, hari: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{HARI.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Jam</Label><Input value={form.jam} onChange={(e) => setForm({...form, jam: e.target.value})} placeholder="16:00-17:00"/></div>
            <div><Label>Lokasi</Label>
              <Select value={form.lokasi} onValueChange={(v) => setForm({...form, lokasi: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Offline">Offline (Home Visit)</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Di Tempat">Di Tempat Kami</SelectItem>
                </SelectContent>
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
