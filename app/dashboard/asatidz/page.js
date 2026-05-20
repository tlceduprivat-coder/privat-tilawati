'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function AsatidzPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nama: '', nomorHp: '', alamat: '', status: 'aktif' });

  const load = async () => {
    try { const res = await apiFetch('asatidz'); setData(res.data || []); }
    catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ nama: '', nomorHp: '', alamat: '', status: 'aktif' }); setOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ nama: a.nama, nomorHp: a.nomorHp, alamat: a.alamat, status: a.status }); setOpen(true); };

  const save = async () => {
    if (!form.nama) { toast.error('Nama wajib diisi'); return; }
    try {
      if (editing) await apiFetch(`asatidz/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await apiFetch('asatidz', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Data asatidz tersimpan');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => {
    if (!confirm('Hapus data asatidz ini?')) return;
    try { await apiFetch(`asatidz/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); load(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Data Asatidz</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data ustadz/ustadzah dan jumlah santri.</p>
        </div>
        <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Tambah Asatidz</Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-3">Nama</th>
                <th className="py-2 px-3">No HP</th>
                <th className="py-2 px-3">Alamat</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Jumlah Santri</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (<tr><td colSpan="6" className="py-8 text-center text-muted-foreground">Belum ada data</td></tr>)}
              {data.map(a => (
                <tr key={a.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3 font-medium">{a.nama}</td>
                  <td className="py-3 px-3">{a.nomorHp}</td>
                  <td className="py-3 px-3 max-w-[200px] truncate">{a.alamat}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-1 rounded text-xs ${a.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{a.status}</span></td>
                  <td className="py-3 px-3"><span className="px-2 py-1 rounded bg-sky-100 text-sky-700 text-xs font-semibold">{a.jumlahSantri || 0} santri</span></td>
                  <td className="py-3 px-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Pencil className="w-4 h-4"/></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Asatidz' : 'Tambah Asatidz'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} /></div>
            <div><Label>Nomor HP</Label><Input value={form.nomorHp} onChange={(e) => setForm({...form, nomorHp: e.target.value})} /></div>
            <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
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
