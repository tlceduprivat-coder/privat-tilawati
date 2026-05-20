'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { PROGRAM_NAMES } from '@/lib/programs';

const PROGRAMS = PROGRAM_NAMES;

export default function SantriPage() {
  const [data, setData] = useState([]);
  const [tab, setTab] = useState('aktif');
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nama: '', umur: '', alamat: '', nomorHp: '', program: '', status: 'aktif' });

  const load = async () => {
    try {
      const res = await apiFetch(`santri?status=${tab}`);
      setData(res.data || []);
    } catch (e) { toast.error(e.message); }
  };

  useEffect(() => { load(); }, [tab]);

  const filtered = data.filter(s => {
    const matchSearch = !search || s.nama?.toLowerCase().includes(search.toLowerCase()) || s.nomorHp?.includes(search);
    const matchProg = program === 'all' || s.program === program;
    return matchSearch && matchProg;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ nama: '', umur: '', alamat: '', nomorHp: '', program: '', status: tab });
    setOpen(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ nama: s.nama, umur: s.umur, alamat: s.alamat, nomorHp: s.nomorHp, program: s.program, status: s.status });
    setOpen(true);
  };

  const save = async () => {
    if (!form.nama || !form.program) { toast.error('Nama dan program wajib diisi'); return; }
    try {
      if (editing) {
        await apiFetch(`santri/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
        toast.success('Data santri diperbarui');
      } else {
        await apiFetch('santri', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Santri baru ditambahkan');
      }
      setOpen(false);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const del = async (id) => {
    if (!confirm('Hapus data santri ini?')) return;
    try {
      await apiFetch(`santri/${id}`, { method: 'DELETE' });
      toast.success('Santri dihapus');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Data Santri</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data santri aktif dan non-aktif.</p>
        </div>
        <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Tambah Santri</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="aktif">Santri Aktif</TabsTrigger>
          <TabsTrigger value="non-aktif">Santri Non-Aktif</TabsTrigger>
        </TabsList>

        <Card className="p-4 mt-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input placeholder="Cari nama / nomor HP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Program</SelectItem>
                {PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 px-3">Nama</th>
                  <th className="py-2 px-3">Umur</th>
                  <th className="py-2 px-3">Alamat</th>
                  <th className="py-2 px-3">No HP</th>
                  <th className="py-2 px-3">Program</th>
                  <th className="py-2 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">Belum ada data</td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium">{s.nama}</td>
                    <td className="py-3 px-3">{s.umur} th</td>
                    <td className="py-3 px-3 max-w-[200px] truncate" title={s.alamat}>{s.alamat}</td>
                    <td className="py-3 px-3">{s.nomorHp}</td>
                    <td className="py-3 px-3"><span className="px-2 py-1 rounded text-xs bg-sky-100 text-sky-700">{s.program}</span></td>
                    <td className="py-3 px-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-4 h-4"/></Button>
                      <Button size="sm" variant="ghost" onClick={() => del(s.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Santri' : 'Tambah Santri'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Lengkap</Label><Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Umur</Label><Input type="number" value={form.umur} onChange={(e) => setForm({...form, umur: e.target.value})} /></div>
              <div><Label>Nomor HP</Label><Input value={form.nomorHp} onChange={(e) => setForm({...form, nomorHp: e.target.value})} /></div>
            </div>
            <div><Label>Alamat</Label><Input value={form.alamat} onChange={(e) => setForm({...form, alamat: e.target.value})} /></div>
            <div><Label>Program</Label>
              <Select value={form.program} onValueChange={(v) => setForm({...form, program: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih program"/></SelectTrigger>
                <SelectContent>{PROGRAMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
