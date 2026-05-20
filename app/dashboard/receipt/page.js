'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Download, MessageCircle, Trash2, Receipt as ReceiptIcon, Calculator } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';
import { PROGRAMS, formatRupiah } from '@/lib/programs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReceiptPage() {
  const [data, setData] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({ guruNama: '', bulan: new Date().toISOString().slice(0,7), potonganPersen: 20 });
  const [tarifMap, setTarifMap] = useState(() => Object.fromEntries(PROGRAMS.map(p => [p.nama, p.tarif])));
  const [calcOpen, setCalcOpen] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch('receipts'); setData(res.data || []);
      if (isAdmin) { const a = await apiFetch('asatidz'); setAsatidzList(a.data || []); }
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const calculate = async () => {
    if (!form.guruNama || !form.bulan) { toast.error('Pilih guru dan bulan'); return; }
    try {
      const res = await apiFetch('receipts/calculate', { method: 'POST', body: JSON.stringify({ ...form, tarifMap }) });
      setPreview(res.data);
      setCalcOpen(true);
    } catch (e) { toast.error(e.message); }
  };

  const saveReceipt = async () => {
    if (!preview) return;
    try { await apiFetch('receipts', { method: 'POST', body: JSON.stringify({ ...preview, potonganPersen: form.potonganPersen }) }); toast.success('Receipt disimpan'); setCalcOpen(false); setOpen(false); load(); }
    catch (e) { toast.error(e.message); }
  };
  const del = async (id) => { if (!confirm('Hapus receipt?')) return; try { await apiFetch('receipts/' + id, { method: 'DELETE' }); toast.success('Dihapus'); load(); } catch (e) { toast.error(e.message); } };

  const generatePDF = (r) => {
    const doc = new jsPDF();
    const sky = [14, 165, 233];
    // Header
    doc.setFillColor(...sky);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('PRIVAT TILAWATI', 14, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Tahsin Al-Quran Metode Tilawati', 14, 20);
    doc.text('Cilengkrang, Kab. Bandung | WA: 085117253381', 14, 25);
    doc.setTextColor(0, 0, 0);
    // Title
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT JASA MENGAJAR', 14, 42);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('No. Receipt: ' + r.nomor, 14, 50);
    doc.text('Tanggal: ' + new Date(r.createdAt).toLocaleDateString('id-ID'), 14, 55);
    // Info
    doc.setFont('helvetica', 'bold'); doc.text('Diterbitkan untuk:', 14, 65);
    doc.setFont('helvetica', 'normal');
    doc.text('Ustadz/Ustadzah: ' + r.guruNama, 14, 71);
    doc.text('Periode: ' + r.bulan, 14, 76);
    doc.text('Jumlah Pertemuan: ' + r.jumlahPertemuan, 14, 81);
    // Items table
    autoTable(doc, {
      startY: 88,
      head: [['Tanggal', 'Santri', 'Program', 'Tarif (Rp)']],
      body: r.items.map(i => [i.tanggal, i.santri, i.program, Number(i.tarif).toLocaleString('id-ID')]),
      headStyles: { fillColor: sky, textColor: [255,255,255] },
      styles: { fontSize: 9 },
    });
    let y = doc.lastAutoTable.finalY + 10;
    // Summary
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', 130, y); doc.text('Rp ' + r.subtotal.toLocaleString('id-ID'), 200, y, { align: 'right' });
    y += 6;
    doc.text('Potongan Kas Lembaga (' + r.potonganPersen + '%)', 130, y); doc.text('- Rp ' + r.potongan.toLocaleString('id-ID'), 200, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(...sky); doc.line(130, y, 200, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('TOTAL DITERIMA', 130, y); doc.text('Rp ' + r.total.toLocaleString('id-ID'), 200, y, { align: 'right' });
    // Footer
    y = 275;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text('Receipt ini diterbitkan secara digital oleh sistem Privat Tilawati.', 105, y, { align: 'center' });
    doc.text('Barakallahu fii kum. Jazaakallahu khairan atas pengabdian Anda.', 105, y + 4, { align: 'center' });
    return doc;
  };

  const downloadPDF = (r) => {
    const doc = generatePDF(r);
    doc.save('Receipt-' + r.nomor.replace(/\//g, '-') + '.pdf');
  };
  const sendWAReceipt = (r) => {
    const asatidz = asatidzList.find(a => a.nama === r.guruNama);
    const phone = asatidz?.nomorHp ? '62' + asatidz.nomorHp.replace(/^0/, '').replace(/\D/g, '') : '';
    const msg = encodeURIComponent(
      "Assalamu'alaikum " + r.guruNama + ",\n\n" +
      "Berikut receipt jasa mengajar Anda:\n\n" +
      "No: " + r.nomor + "\nPeriode: " + r.bulan + "\nJumlah Pertemuan: " + r.jumlahPertemuan + "\n" +
      "Subtotal: Rp " + r.subtotal.toLocaleString('id-ID') + "\nPotongan " + r.potonganPersen + "%: Rp " + r.potongan.toLocaleString('id-ID') + "\nTotal Diterima: Rp " + r.total.toLocaleString('id-ID') + "\n\n" +
      "File PDF dapat diunduh dari dashboard. Barakallahu fii kum."
    );
    const url = phone ? 'https://wa.me/' + phone + '?text=' + msg : 'https://wa.me/?text=' + msg;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2"><ReceiptIcon className="w-7 h-7 text-sky-500"/> {isAdmin ? 'Receipt Asatidz' : 'Receipt Saya'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isAdmin ? 'Generate receipt jasa mengajar dari data absensi.' : 'Lihat & unduh receipt jasa mengajar Anda.'}</p>
        </div>
        {isAdmin && <Button onClick={() => setOpen(true)} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Generate Receipt</Button>}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.length === 0 && <Card className="p-8 text-center text-muted-foreground col-span-full">Belum ada receipt</Card>}
        {data.map(r => (
          <Card key={r.id} className="p-5 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-muted-foreground font-mono">{r.nomor}</div>
                <div className="font-bold">{r.guruNama}</div>
                <div className="text-xs text-muted-foreground">{r.bulan} &middot; {r.jumlahPertemuan} pertemuan</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${r.status === 'sudah_dibayar' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status === 'sudah_dibayar' ? 'Sudah Dibayar' : 'Belum Dibayar'}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatRupiah(r.subtotal)}</span></div>
              <div className="flex justify-between text-red-600"><span>Potongan {r.potonganPersen}%</span><span>-{formatRupiah(r.potongan)}</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span className="text-sky-600">{formatRupiah(r.total)}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => downloadPDF(r)}><Download className="w-3.5 h-3.5 mr-1"/> PDF</Button>
              {isAdmin && <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => sendWAReceipt(r)}><MessageCircle className="w-3.5 h-3.5 mr-1"/> WA</Button>}
              {isAdmin && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => del(r.id)}><Trash2 className="w-3.5 h-3.5"/></Button>}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Calculator className="w-5 h-5"/> Generate Receipt Asatidz</DialogTitle>
            <DialogDescription>Pilih guru, bulan, dan sesuaikan tarif. Sistem akan menghitung dari data absensi (status Hadir).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Asatidz</Label>
                <Select value={form.guruNama} onValueChange={(v) => setForm({...form, guruNama: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih asatidz"/></SelectTrigger>
                  <SelectContent>{asatidzList.map(a => <SelectItem key={a.id} value={a.nama}>{a.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Bulan</Label><Input type="month" value={form.bulan} onChange={(e) => setForm({...form, bulan: e.target.value})}/></div>
            </div>
            <div><Label>Potongan Kas Lembaga (%)</Label><Input type="number" value={form.potonganPersen} onChange={(e) => setForm({...form, potonganPersen: Number(e.target.value)})} min="0" max="100"/></div>
            <div>
              <Label>Tarif per Program (boleh diubah)</Label>
              <div className="mt-2 max-h-[200px] overflow-y-auto space-y-1.5 p-2 border rounded">
                {PROGRAMS.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate">{p.nama}</span>
                    <Input type="number" value={tarifMap[p.nama] || 0} onChange={(e) => setTarifMap({...tarifMap, [p.nama]: Number(e.target.value)})} className="w-32 h-8"/>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={calculate} className="bg-sky-500 hover:bg-sky-600"><Calculator className="w-4 h-4 mr-2"/> Hitung</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Preview Receipt</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="p-4 bg-sky-50 rounded-lg">
                <div className="font-bold">{preview.guruNama}</div>
                <div className="text-sm text-muted-foreground">Periode: {preview.bulan} &middot; {preview.jumlahPertemuan} pertemuan</div>
              </div>
              <div className="max-h-[250px] overflow-y-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100"><tr><th className="p-2 text-left">Tanggal</th><th className="p-2 text-left">Santri</th><th className="p-2 text-left">Program</th><th className="p-2 text-right">Tarif</th></tr></thead>
                  <tbody>{preview.items.map((i, idx) => <tr key={idx} className="border-t"><td className="p-2">{i.tanggal}</td><td className="p-2">{i.santri}</td><td className="p-2 truncate max-w-[150px]">{i.program}</td><td className="p-2 text-right">{formatRupiah(i.tarif)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(preview.subtotal)}</span></div>
                <div className="flex justify-between text-red-600"><span>Potongan {preview.potonganPersen}%</span><span>-{formatRupiah(preview.potongan)}</span></div>
                <div className="flex justify-between font-bold text-base pt-2 border-t"><span>TOTAL</span><span className="text-sky-600">{formatRupiah(preview.total)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalcOpen(false)}>Batal</Button>
            <Button onClick={saveReceipt} className="bg-sky-500 hover:bg-sky-600">Simpan Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
