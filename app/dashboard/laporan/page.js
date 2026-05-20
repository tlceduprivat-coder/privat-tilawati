'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, Users, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#a855f7', '#ec4899'];

export default function LaporanPage() {
  const [range, setRange] = useState('month');
  const [chart, setChart] = useState({ masukKeluar: [], keuangan: [], santriPerAsatidz: [] });
  const [loading, setLoading] = useState(true);
  const [santri, setSantri] = useState([]);
  const [keuangan, setKeuangan] = useState([]);
  const [absensi, setAbsensi] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const c = await apiFetch('charts?range=' + range);
      setChart(c);
      const s = await apiFetch('santri?status=aktif');
      setSantri(s.data || []);
      const k = await apiFetch('keuangan');
      setKeuangan(k.data || []);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [range]);

  const fmt = (n) => 'Rp ' + (n / 1000000).toFixed(1) + 'M';

  const exportExcel = (sheetName, rows) => {
    if (!rows || rows.length === 0) { toast.error('Data kosong'); return; }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, sheetName + '_' + new Date().toISOString().slice(0,10) + '.xlsx');
    toast.success('File Excel diunduh');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2"><TrendingUp className="w-7 h-7 text-sky-500"/> Laporan &amp; Grafik</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualisasi data santri, keuangan, dan kinerja asatidz.</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Per Hari (30hr)</SelectItem>
              <SelectItem value="week">Per Minggu (12mg)</SelectItem>
              <SelectItem value="month">Per Bulan (12bln)</SelectItem>
              <SelectItem value="year">Per Tahun (5th)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? <Card className="p-12 text-center">Memuat...</Card> : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-sky-500"/> Santri Masuk vs Keluar</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart.masukKeluar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="period" fontSize={11}/>
                <YAxis fontSize={11}/>
                <Tooltip/>
                <Legend/>
                <Line type="monotone" dataKey="masuk" stroke="#22c55e" strokeWidth={2} name="Santri Masuk"/>
                <Line type="monotone" dataKey="keluar" stroke="#ef4444" strokeWidth={2} name="Santri Keluar"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-sky-500"/> Laporan Keuangan</h2>
              <Button size="sm" variant="outline" onClick={() => exportExcel('Keuangan', keuangan)}><Download className="w-3.5 h-3.5 mr-1"/> Excel</Button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chart.keuangan}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                <XAxis dataKey="period" fontSize={11}/>
                <YAxis fontSize={11} tickFormatter={fmt}/>
                <Tooltip formatter={(v) => 'Rp ' + Number(v).toLocaleString('id-ID')}/>
                <Legend/>
                <Bar dataKey="lunas" fill="#22c55e" name="Lunas"/>
                <Bar dataKey="belum" fill="#ef4444" name="Belum Bayar"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Top Asatidz (Jumlah Santri)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chart.santriPerAsatidz} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis type="number" fontSize={11}/>
                  <YAxis type="category" dataKey="nama" fontSize={11} width={120}/>
                  <Tooltip/>
                  <Bar dataKey="jumlah" fill="#0ea5e9" name="Jumlah Santri"/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Distribusi Program (Santri Aktif)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={Object.entries(santri.reduce((acc, s) => ({ ...acc, [s.program]: (acc[s.program] || 0) + 1 }), {})).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {Object.keys(santri.reduce((acc, s) => ({ ...acc, [s.program]: 1 }), {})).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Export Data Master</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Button variant="outline" onClick={() => exportExcel('Santri', santri)}><Download className="w-4 h-4 mr-2"/> Export Santri</Button>
              <Button variant="outline" onClick={() => exportExcel('Keuangan', keuangan)}><Download className="w-4 h-4 mr-2"/> Export Keuangan</Button>
              <Button variant="outline" onClick={async () => { try { const r = await apiFetch('progress'); exportExcel('Progress', r.data); } catch (e) { toast.error(e.message); } }}><Download className="w-4 h-4 mr-2"/> Export Progress</Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
