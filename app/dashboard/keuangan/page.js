'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { getProgramByName, formatRupiah } from '@/lib/programs';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function KeuanganPage() {
  const [data, setData] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ santriId: '', santriNama: '', program: '', bulan: '', nominal: '', status: 'Belum', catatan: '' });
  const user = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('pt_user') || 'null')) : null;
  const isAdmin = user?.role === 'admin';
  const isWali = user?.role === 'wali';

  const load = async () => {
    try {
      const res = await apiFetch('keuangan'); setData(res.data || []);
      if (isAdmin) { const s = await apiFetch('santri?status=aktif'); setSantriList(s.data || []); }
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ santriId: '', santriNama: '', program: '', bulan: BULAN[new Date().getMonth()], nominal: '', status: 'Belum', catatan: '' }); setOpen(true); };
  const openEdit = (k) => { setEditing(k); setForm({ santriId: k.santriId || '', santriNama: k.santriNama, program: k.program || '', bulan: k.bulan, nominal: k.nominal, status: k.status, catatan: k.catatan }); setOpen(true); };

  const onSantriChange = (id) => {
    const s = santriList.find(x => x.id === id);
    if (s) {
      const prog = getProgramByName(s.program);
      setForm({ ...form, santriId: s.id, santriNama: s.nama, program: s.program, nominal: prog?.tarif || '' });
    }
  };

  const save = async () => {
    if (!form.santriNama || !form.bulan) { toast.error('Lengkapi data'); return; }
    try {
      if (editing) await apiFetch('keuangan/' + editing.id, { method: 'PUT', body: JSON.stringify(form) });
      else await apiFetch('keuangan', { method: 'POST', body: JSON.stringify(form) });
      toast.success('Data SPP tersimpan');
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus data SPP?')) return; try { await apiFetch('keuangan/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };
  const toggleStatus = async (k) => {
    const newStatus = k.status === 'Lunas' ? 'Belum' : 'Lunas';
    try { await apiFetch('keuangan/' + k.id, { method: 'PUT', body: JSON.stringify({ status: newStatus }) }); load(); } catch (e) { toast.error(e.message); }
  };

  const totalLunas = data.filter(k => k.status === 'Lunas').reduce((s, k) => s + (k.nominal || 0), 0);
  const totalBelum = data.filter(k => k.status === 'Belum').reduce((s, k) => s + (k.nominal || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">{isWali ? 'SPP & Tagihan Saya' : 'Administrasi Keuangan'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isWali ? 'Cek status pembayaran SPP.' : 'Terintegrasi dengan data Santri & Master Program.'}</p>
        </div>
        {isAdmin && <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Catat SPP</Button>}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white"><CheckCircle2 className="w-7 h-7 mb-2"/><div className="text-2xl font-extrabold">{formatRupiah(totalLunas)}</div><div className="text-sm opacity-90">Total SPP Lunas</div></Card>
        <Card className="p-5 bg-gradient-to-br from-red-500 to-rose-600 text-white"><AlertCircle className="w-7 h-7 mb-2"/><div className="text-2xl font-extrabold">{formatRupiah(totalBelum)}</div><div className="text-sm opacity-90">Total Tunggakan</div></Card>
        <Card className="p-5 bg-gradient-to-br from-sky-500 to-blue-600 text-white"><Wallet className="w-7 h-7 mb-2"/><div className="text-2xl font-extrabold">{data.length}</div><div className="text-sm opacity-90">Total Transaksi</div></Card>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-3">Santri</th>
                <th className="py-2 px-3">Program</th>
                <th className="py-2 px-3">Bulan</th>
                <th className="py-2 px-3">Nominal</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Catatan</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (<tr><td colSpan="7" className="py-8 text-center text-muted-foreground">Belum ada data SPP</td></tr>)}
              {data.map(k => (
                <tr key={k.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3 font-medium">{k.santriNama}</td>
                  <td className="py-3 px-3 text-xs">{k.program || '-'}</td>
                  <td className="py-3 px-3">{k.bulan}</td>
                  <td className="py-3 px-3 font-mono">{formatRupiah(k.nominal)}</td>
                  <td className="py-3 px-3">
                    <button onClick={() => isAdmin && toggleStatus(k)} className={`px-2.5 py-1 rounded text-xs font-medium ${k.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} ${isAdmin ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`} disabled={!isAdmin}>{k.status}</button>
                  </td>
                  <td className="py-3 px-3 max-w-[200px] truncate">{k.catatan}</td>
                  <td className="py-3 px-3 text-right">
                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => openEdit(k)}><Pencil className="w-4 h-4"/></Button>}
                    {isAdmin && <Button size="sm" variant="ghost" onClick={() => del(k.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit SPP' : 'Tambah SPP'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Santri</Label>
              {editing ? <Input value={form.santriNama} disabled/> : (
                <Select value={form.santriId} onValueChange={onSantriChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih santri"/></SelectTrigger>
                  <SelectContent className="max-h-[300px]">{santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} — {s.program}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {form.program && <div className="text-xs text-sky-600 mt-1">Program: {form.program}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bulan</Label>
                <Select value={form.bulan} onValueChange={(v) => setForm({...form, bulan: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih bulan"/></SelectTrigger>
                  <SelectContent>{BULAN.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Nominal (Rp)</Label><Input type="number" value={form.nominal} onChange={(e) => setForm({...form, nominal: e.target.value})}/></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum">Belum Bayar</SelectItem>
                  <SelectItem value="Lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Catatan</Label><Input value={form.catatan} onChange={(e) => setForm({...form, catatan: e.target.value})}/></div>
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
