'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, BookOpen, TrendingUp, User, Users } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HURUF = ['A', 'B', 'C', 'D', 'E'];

export default function ProgressPage() {
  const [data, setData] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [open, setOpen] = useState(false);
  const [tipeKelas, setTipeKelas] = useState('mandiri');
  const [filterSantri, setFilterSantri] = useState('all');
  // Mandiri form
  const [mandiri, setMandiri] = useState({ santriId: '', santriNama: '', program: '', materi: '', halaman: '', catatan: '', nilai: '', nilaiAngka: '', tanggal: new Date().toISOString().slice(0,10) });
  // Grup form
  const [grup, setGrup] = useState({ materi: '', halaman: '', program: '', tanggal: new Date().toISOString().slice(0,10), santriEntries: [] });
  const user = getCurrentUser();
  const isWali = user?.role === 'wali';
  const canEdit = user?.role === 'admin' || user?.role === 'asatidz';

  const load = async () => {
    try {
      const res = await apiFetch('progress'); setData(res.data || []);
      if (canEdit) { const s = await apiFetch('santri?status=aktif'); setSantriList(s.data || []); }
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setTipeKelas('mandiri');
    setMandiri({ santriId: '', santriNama: '', program: '', materi: '', halaman: '', catatan: '', nilai: '', nilaiAngka: '', tanggal: new Date().toISOString().slice(0,10) });
    setGrup({ materi: '', halaman: '', program: '', tanggal: new Date().toISOString().slice(0,10), santriEntries: [] });
    setOpen(true);
  };

  const onMandiriSantriChange = (id) => {
    const s = santriList.find(x => x.id === id);
    if (s) setMandiri({ ...mandiri, santriId: s.id, santriNama: s.nama, program: s.program });
  };

  const toggleGrupSantri = (s) => {
    const exists = grup.santriEntries.find(e => e.santriId === s.id);
    if (exists) setGrup({ ...grup, santriEntries: grup.santriEntries.filter(e => e.santriId !== s.id) });
    else setGrup({ ...grup, santriEntries: [...grup.santriEntries, { santriId: s.id, santriNama: s.nama, nilai: '', nilaiAngka: '', catatan: '' }] });
  };
  const updateGrupEntry = (id, field, value) => setGrup({ ...grup, santriEntries: grup.santriEntries.map(e => e.santriId === id ? { ...e, [field]: value } : e) });

  const save = async () => {
    try {
      if (tipeKelas === 'mandiri') {
        if (!mandiri.santriNama || !mandiri.materi) { toast.error('Lengkapi santri dan materi'); return; }
        await apiFetch('progress', { method: 'POST', body: JSON.stringify({ ...mandiri, tipeKelas: 'mandiri' }) });
        toast.success('Progress tersimpan');
      } else {
        if (grup.santriEntries.length < 2) { toast.error('Kelas grup minimal 2 santri'); return; }
        if (!grup.materi) { toast.error('Lengkapi materi'); return; }
        const res = await apiFetch('progress', { method: 'POST', body: JSON.stringify({
          materi: grup.materi, halaman: grup.halaman, program: grup.program, tanggal: grup.tanggal, tipeKelas: 'grup',
          entries: grup.santriEntries,
        }) });
        toast.success(`Progress ${res.count} santri tersimpan`);
      }
      setOpen(false); load();
    } catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus?')) return; try { await apiFetch('progress/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };

  const santriUniq = [...new Set(data.map(d => d.santriNama))];
  const filtered = filterSantri === 'all' ? data : data.filter(d => d.santriNama === filterSantri);
  const chartData = filterSantri !== 'all' ? [...filtered].filter(d => d.nilaiAngka).reverse().map(d => ({ tanggal: d.tanggal, nilai: d.nilaiAngka, materi: d.materi })) : [];
  const avgNilai = filtered.filter(d => d.nilaiAngka).reduce((s, d, _, arr) => s + d.nilaiAngka / arr.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2"><BookOpen className="w-7 h-7 text-sky-500"/> {isWali ? 'Progress Anak Saya' : 'Progress Pembelajaran'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isWali ? 'Perkembangan harian & nilai anak Anda.' : 'Catat progress untuk kelas Mandiri (1 santri) atau Grup (>1 santri).'}</p>
        </div>
        <div className="flex gap-2">
          {santriUniq.length > 0 && (
            <Select value={filterSantri} onValueChange={setFilterSantri}>
              <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Santri</SelectItem>
                {santriUniq.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <XAxis dataKey="tanggal" fontSize={11}/><YAxis domain={[0, 100]} fontSize={11}/><Tooltip/>
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
                <th className="py-2 px-3">Tipe</th>
                <th className="py-2 px-3">Materi</th>
                <th className="py-2 px-3">Halaman</th>
                <th className="py-2 px-3">Nilai</th>
                <th className="py-2 px-3">Catatan</th>
                {canEdit && <th className="py-2 px-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-muted-foreground">Belum ada progress</td></tr>)}
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3 whitespace-nowrap">{p.tanggal}</td>
                  <td className="py-3 px-3 font-medium">{p.santriNama}</td>
                  <td className="py-3 px-3"><span className={`px-2 py-0.5 rounded text-xs ${p.tipeKelas === 'grup' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{p.tipeKelas === 'grup' ? 'Grup' : 'Mandiri'}</span></td>
                  <td className="py-3 px-3"><span className="px-2 py-1 rounded text-xs bg-sky-100 text-sky-700">{p.materi}</span></td>
                  <td className="py-3 px-3">{p.halaman}</td>
                  <td className="py-3 px-3">
                    {(p.nilai || p.nilaiAngka) && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${(p.nilaiAngka >= 80 || ['A','B'].includes(p.nilai)) ? 'bg-green-100 text-green-700' : (p.nilaiAngka >= 60 || p.nilai === 'C') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.nilai || p.nilaiAngka}</span>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Catat Progress Pembelajaran</DialogTitle>
            <DialogDescription>Pilih tipe kelas sesuai jenis pertemuan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTipeKelas('mandiri')} className={`p-3 rounded-lg border-2 text-left ${tipeKelas === 'mandiri' ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                <User className="w-5 h-5 text-sky-600 mb-1"/>
                <div className="font-bold text-sm">Kelas Mandiri</div>
                <div className="text-xs text-muted-foreground">1 santri</div>
              </button>
              <button onClick={() => setTipeKelas('grup')} className={`p-3 rounded-lg border-2 text-left ${tipeKelas === 'grup' ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}>
                <Users className="w-5 h-5 text-purple-600 mb-1"/>
                <div className="font-bold text-sm">Kelas Grup</div>
                <div className="text-xs text-muted-foreground">2+ santri sekaligus</div>
              </button>
            </div>

            {tipeKelas === 'mandiri' ? (
              <div className="space-y-3">
                <div><Label>Santri</Label>
                  <Select value={mandiri.santriId} onValueChange={onMandiriSantriChange}>
                    <SelectTrigger><SelectValue placeholder="Pilih santri"/></SelectTrigger>
                    <SelectContent className="max-h-[200px]">{santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} — {s.program}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Materi</Label><Input value={mandiri.materi} onChange={(e) => setMandiri({...mandiri, materi: e.target.value})} placeholder="Jilid 3"/></div>
                  <div><Label>Halaman</Label><Input value={mandiri.halaman} onChange={(e) => setMandiri({...mandiri, halaman: e.target.value})} placeholder="hal 12-15"/></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Tanggal</Label><Input type="date" value={mandiri.tanggal} onChange={(e) => setMandiri({...mandiri, tanggal: e.target.value})}/></div>
                  <div><Label>Nilai Huruf</Label>
                    <Select value={mandiri.nilai} onValueChange={(v) => setMandiri({...mandiri, nilai: v})}>
                      <SelectTrigger><SelectValue placeholder="-"/></SelectTrigger>
                      <SelectContent>{HURUF.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Nilai 0-100</Label><Input type="number" min="0" max="100" value={mandiri.nilaiAngka} onChange={(e) => setMandiri({...mandiri, nilaiAngka: e.target.value})}/></div>
                </div>
                <div><Label>Catatan</Label><Textarea value={mandiri.catatan} onChange={(e) => setMandiri({...mandiri, catatan: e.target.value})} rows={2}/></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Materi</Label><Input value={grup.materi} onChange={(e) => setGrup({...grup, materi: e.target.value})} placeholder="Jilid 3 / Juz 1"/></div>
                  <div><Label>Halaman</Label><Input value={grup.halaman} onChange={(e) => setGrup({...grup, halaman: e.target.value})} placeholder="hal 12-15"/></div>
                </div>
                <div><Label>Tanggal</Label><Input type="date" value={grup.tanggal} onChange={(e) => setGrup({...grup, tanggal: e.target.value})}/></div>
                <div>
                  <Label>Pilih Santri (centang untuk include)</Label>
                  <div className="mt-2 max-h-[150px] overflow-y-auto border rounded p-2 space-y-1.5">
                    {santriList.map(s => (
                      <label key={s.id} className="flex items-center gap-2 p-1.5 hover:bg-sky-50 rounded cursor-pointer">
                        <Checkbox checked={!!grup.santriEntries.find(e => e.santriId === s.id)} onCheckedChange={() => toggleGrupSantri(s)} />
                        <span className="text-sm flex-1">{s.nama}</span>
                        <span className="text-xs text-muted-foreground">{s.program}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {grup.santriEntries.length > 0 && (
                  <div>
                    <Label>Nilai per Santri</Label>
                    <div className="mt-2 space-y-2">
                      {grup.santriEntries.map(e => (
                        <div key={e.santriId} className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-50 rounded">
                          <div className="col-span-4 text-sm font-medium truncate">{e.santriNama}</div>
                          <Select value={e.nilai} onValueChange={(v) => updateGrupEntry(e.santriId, 'nilai', v)}>
                            <SelectTrigger className="col-span-2"><SelectValue placeholder="-"/></SelectTrigger>
                            <SelectContent>{HURUF.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="number" min="0" max="100" value={e.nilaiAngka} onChange={(ev) => updateGrupEntry(e.santriId, 'nilaiAngka', ev.target.value)} className="col-span-2" placeholder="0-100"/>
                          <Input value={e.catatan} onChange={(ev) => updateGrupEntry(e.santriId, 'catatan', ev.target.value)} className="col-span-4" placeholder="Catatan"/>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{tipeKelas === 'grup' ? `Simpan (${grup.santriEntries.length} santri)` : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
