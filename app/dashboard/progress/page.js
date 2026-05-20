'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, BookOpen, TrendingUp } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HURUF = ['A', 'B', 'C', 'D', 'E'];

export default function ProgressPage() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [filterSantri, setFilterSantri] = useState('all');
  const [form, setForm] = useState({ santriNama: '', guruNama: '', materi: '', halaman: '', catatan: '', nilai: '', nilaiAngka: '', tanggal: new Date().toISOString().slice(0,10) });
  const user = getCurrentUser();
  const isWali = user?.role === 'wali';
  const canEdit = user?.role === 'admin' || user?.role === 'asatidz';

  const load = async () => { try { const res = await apiFetch('progress'); setData(res.data || []); } catch (e) { toast.error(e.message); } };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm({ santriNama: '', guruNama: user?.name || '', materi: '', halaman: '', catatan: '', nilai: '', nilaiAngka: '', tanggal: new Date().toISOString().slice(0,10) }); setOpen(true); };

  const save = async () => {
    if (!form.santriNama || !form.materi) { toast.error('Santri dan materi wajib diisi'); return; }
    try { await apiFetch('progress', { method: 'POST', body: JSON.stringify(form) }); toast.success('Progress tersimpan'); setOpen(false); load(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus catatan progress ini?')) return; try { await apiFetch('progress/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };

  const santriList = [...new Set(data.map(d => d.santriNama))];
  const filtered = filterSantri === 'all' ? data : data.filter(d => d.santriNama === filterSantri);

  // Chart data: only when filtering by 1 santri
  const chartData = filterSantri !== 'all' ? [...filtered].filter(d => d.nilaiAngka).reverse().map(d => ({ tanggal: d.tanggal, nilai: d.nilaiAngka, materi: d.materi })) : [];

  const avgNilai = filtered.filter(d => d.nilaiAngka).reduce((s, d, _, arr) => s + d.nilaiAngka / arr.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2"><BookOpen className="w-7 h-7 text-sky-500"/> {isWali ? 'Progress Anak Saya' : 'Progress Pembelajaran'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isWali ? 'Pantau perkembangan harian dan nilai pembelajaran anak Anda.' : 'Catat dan pantau perkembangan setiap santri.'}</p>
        </div>
        <div className="flex gap-2">
          {santriList.length > 0 && (
            <Select value={filterSantri} onValueChange={setFilterSantri}>
              <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Santri</SelectItem>
                {santriList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {canEdit && <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Catat Progress</Button>}
        </div>
      </div>

      {filterSantri !== 'all' && chartData.length > 0 && (
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-2 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-sky-500"/> Grafik Nilai - {filterSantri}</h2>
          <p className="text-sm text-muted-foreground mb-4">Rata-rata: <span className="font-bold text-sky-600">{avgNilai.toFixed(1)}</span></p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
              <XAxis dataKey="tanggal" fontSize={11}/>
              <YAxis domain={[0, 100]} fontSize={11}/>
              <Tooltip/>
              <Line type="monotone" dataKey="nilai" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 5 }}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

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
                <th className="py-2 px-3">Nilai</th>
                <th className="py-2 px-3">Catatan</th>
                {canEdit && <th className="py-2 px-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-muted-foreground">Belum ada catatan progress</td></tr>)}
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3 whitespace-nowrap">{p.tanggal}</td>
                  <td className="py-3 px-3 font-medium">{p.santriNama}</td>
                  <td className="py-3 px-3">{p.guruNama}</td>
                  <td className="py-3 px-3"><span className="px-2 py-1 rounded text-xs bg-sky-100 text-sky-700">{p.materi}</span></td>
                  <td className="py-3 px-3">{p.halaman}</td>
                  <td className="py-3 px-3">
                    {(p.nilai || p.nilaiAngka) && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${(p.nilaiAngka >= 80 || ['A','B'].includes(p.nilai)) ? 'bg-green-100 text-green-700' : (p.nilaiAngka >= 60 || p.nilai === 'C') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {p.nilai || p.nilaiAngka}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 max-w-[250px] truncate" title={p.catatan}>{p.catatan}</td>
                  {canEdit && <td className="py-3 px-3 text-right"><Button size="sm" variant="ghost" onClick={() => del(p.id)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button></td>}
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
              <div><Label>Materi</Label><Input value={form.materi} onChange={(e) => setForm({...form, materi: e.target.value})} placeholder="Jilid 3 / Juz 1"/></div>
              <div><Label>Halaman</Label><Input value={form.halaman} onChange={(e) => setForm({...form, halaman: e.target.value})} placeholder="hal 12-15"/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Tanggal</Label><Input type="date" value={form.tanggal} onChange={(e) => setForm({...form, tanggal: e.target.value})}/></div>
              <div><Label>Nilai (Huruf)</Label>
                <Select value={form.nilai} onValueChange={(v) => setForm({...form, nilai: v})}>
                  <SelectTrigger><SelectValue placeholder="-"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Tidak diisi</SelectItem>
                    {HURUF.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nilai Angka (0-100)</Label><Input type="number" min="0" max="100" value={form.nilaiAngka} onChange={(e) => setForm({...form, nilaiAngka: e.target.value})}/></div>
            </div>
            <div><Label>Catatan</Label><Textarea value={form.catatan} onChange={(e) => setForm({...form, catatan: e.target.value})} rows={3} placeholder="Bagus, tajwid sudah benar..."/></div>
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
