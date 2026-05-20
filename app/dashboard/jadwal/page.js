'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

const HARI = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Ahad'];

export default function JadwalPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ guruNama: '', santriNama: '', hari: 'Senin', jam: '', lokasi: 'Offline' });
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const load = async () => {
    try { const res = await apiFetch('jadwal'); setData(res.data || []); }
    catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ guruNama: '', santriNama: '', hari: 'Senin', jam: '', lokasi: 'Offline' }); setOpen(true); };
  const openEdit = (j) => { setEditing(j); setForm({ guruNama: j.guruNama, santriNama: j.santriNama, hari: j.hari, jam: j.jam, lokasi: j.lokasi }); setOpen(true); };

  const save = async () => {
    if (!form.guruNama || !form.santriNama || !form.jam) { toast.error('Mohon lengkapi data'); return; }
    try {
      if (editing) await apiFetch(`jadwal/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await apiFetch('jadwal', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Jadwal tersimpan');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => {
    if (!confirm('Hapus jadwal ini?')) return;
    try { await apiFetch(`jadwal/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const grouped = HARI.map(h => ({ hari: h, items: data.filter(j => j.hari === h).sort((a,b) => (a.jam||'').localeCompare(b.jam||'')) }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Jadwal Mengajar</h1>
          <p className="text-sm text-muted-foreground mt-1">Jadwal pengajaran dikelompokkan per hari.</p>
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
                  <div key={j.id} className="p-3 rounded-lg bg-sky-50 border border-sky-100 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{j.santriNama}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Guru: {j.guruNama}</div>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Guru</Label><Input value={form.guruNama} onChange={(e) => setForm({...form, guruNama: e.target.value})} placeholder="Ust./Ustdz. ..."/></div>
            <div><Label>Nama Santri</Label><Input value={form.santriNama} onChange={(e) => setForm({...form, santriNama: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hari</Label>
                <Select value={form.hari} onValueChange={(v) => setForm({...form, hari: v})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{HARI.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Jam</Label><Input value={form.jam} onChange={(e) => setForm({...form, jam: e.target.value})} placeholder="16:00 - 17:00"/></div>
            </div>
            <div><Label>Lokasi</Label>
              <Select value={form.lokasi} onValueChange={(v) => setForm({...form, lokasi: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Offline">Offline (Home Visit)</SelectItem>
                  <SelectItem value="Online">Online (Zoom/Meet)</SelectItem>
                  <SelectItem value="Kantor">Kantor (Goes To Office)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
