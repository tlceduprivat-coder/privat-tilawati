'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, KeyRound, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function UsersPage() {
  const [data, setData] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [asatidzList, setAsatidzList] = useState([]);
  const [open, setOpen] = useState(false);
  const [credOpen, setCredOpen] = useState(false);
  const [credData, setCredData] = useState(null);
  const [tab, setTab] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'asatidz', whatsapp: '', santriId: '', asatidzId: '', password: '' });

  const load = async () => {
    try {
      const res = await apiFetch('users'); setData(res.data || []);
      const s = await apiFetch('santri?status=aktif'); setSantriList(s.data || []);
      const a = await apiFetch('asatidz'); setAsatidzList(a.data || []);
    } catch (e) { toast.error(e.message); }
  };
  useEffect(() => { load(); }, []);

  const filtered = tab === 'all' ? data : data.filter(u => u.role === tab);

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', role: 'asatidz', whatsapp: '', santriId: '', asatidzId: '', password: '' }); setOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, whatsapp: u.whatsapp || '', santriId: u.santriId || '', asatidzId: u.asatidzId || '', password: '' }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.email || !form.role) { toast.error('Lengkapi nama, email, dan role'); return; }
    try {
      if (editing) {
        const upd = { ...form };
        if (!upd.password) delete upd.password;
        await apiFetch(`users/${editing.id}`, { method: 'PUT', body: JSON.stringify(upd) });
        toast.success('Akun diperbarui');
        setOpen(false); load();
      } else {
        const res = await apiFetch('users', { method: 'POST', body: JSON.stringify(form) });
        setOpen(false);
        setCredData(res.data);
        setCredOpen(true);
        load();
      }
    } catch (e) { toast.error(e.message); }
  };

  const resetPassword = async (u) => {
    if (!confirm(`Reset password untuk ${u.name}?`)) return;
    try {
      const res = await apiFetch(`users/${u.id}/reset-password`, { method: 'POST' });
      setCredData(res.data);
      setCredOpen(true);
    } catch (e) { toast.error(e.message); }
  };
  const del = async (u) => {
    if (!confirm(`Hapus akun ${u.name}?`)) return;
    try { await apiFetch(`users/${u.id}`, { method: 'DELETE' }); toast.success('Akun dihapus'); load(); }
    catch (e) { toast.error(e.message); }
  };

  const sendWA = (cred) => {
    if (!cred.whatsapp) { toast.error('Nomor WA belum diisi pada akun ini'); return; }
    const phone = '62' + cred.whatsapp.replace(/^0/, '').replace(/\D/g, '');
    const loginUrl = window.location.origin + '/login';
    const msg = encodeURIComponent(
      "Assalamu'alaikum " + cred.name + ",\n\n" +
      "Berikut akun login Dashboard Privat Tilawati Anda:\n\n" +
      "Link: " + loginUrl + "\n" +
      "Email: " + cred.email + "\n" +
      "Password: " + cred.plainPassword + "\n\n" +
      "Role: " + cred.role.toUpperCase() + "\n\n" +
      "Mohon segera login dan ubah password Anda di menu Pengaturan.\n\nBarakallahu fiik."
    );
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
  };
  const copyCred = (cred) => {
    const txt = 'Email: ' + cred.email + '\nPassword: ' + cred.plainPassword;
    navigator.clipboard.writeText(txt);
    toast.success('Kredensial disalin ke clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Manajemen Akun</h1>
          <p className="text-sm text-muted-foreground mt-1">Buat akun login untuk Admin, Asatidz, dan Wali/Santri.</p>
        </div>
        <Button onClick={openAdd} className="bg-sky-500 hover:bg-sky-600"><Plus className="w-4 h-4 mr-2"/> Tambah Akun</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="asatidz">Asatidz</TabsTrigger>
          <TabsTrigger value="wali">Wali/Santri</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 px-3">Nama</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">WhatsApp</th>
                <th className="py-2 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td colSpan="5" className="py-8 text-center text-muted-foreground">Belum ada data</td></tr>)}
              {filtered.map(u => (
                <tr key={u.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-3 font-medium">{u.name}</td>
                  <td className="py-3 px-3">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'asatidz' ? 'bg-sky-100 text-sky-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span>
                  </td>
                  <td className="py-3 px-3">{u.whatsapp || '-'}</td>
                  <td className="py-3 px-3 text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => resetPassword(u)} title="Reset Password"><KeyRound className="w-4 h-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="w-4 h-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={() => del(u)} className="text-red-600"><Trash2 className="w-4 h-4"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Akun' : 'Tambah Akun'}</DialogTitle>
            <DialogDescription>{!editing && 'Password akan digenerate otomatis dan ditampilkan setelah disimpan.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Lengkap</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
            <div><Label>Nomor WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp: e.target.value})} placeholder="08xxx"/></div>
            <div><Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({...form, role: v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="asatidz">Asatidz (Guru)</SelectItem>
                  <SelectItem value="wali">Wali / Santri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.role === 'wali' && (
              <div><Label>Pilih Santri (untuk melihat progress &amp; SPP)</Label>
                <Select value={form.santriId} onValueChange={(v) => setForm({...form, santriId: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih santri"/></SelectTrigger>
                  <SelectContent>{santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {form.role === 'asatidz' && asatidzList.length > 0 && (
              <div><Label>Link ke Profile Asatidz (opsional)</Label>
                <Select value={form.asatidzId} onValueChange={(v) => setForm({...form, asatidzId: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih asatidz"/></SelectTrigger>
                  <SelectContent>{asatidzList.map(a => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {editing && (
              <div><Label>Password baru (kosongkan jika tidak diubah)</Label><Input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} className="bg-sky-500 hover:bg-sky-600">{editing ? 'Update' : 'Buat Akun'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={credOpen} onOpenChange={setCredOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600"/> Akun Berhasil Dibuat</DialogTitle>
            <DialogDescription>Simpan kredensial ini. Password TIDAK akan ditampilkan lagi.</DialogDescription>
          </DialogHeader>
          {credData && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-yellow-50 border-2 border-yellow-300 space-y-2">
                <div><span className="text-xs text-muted-foreground">Nama:</span><div className="font-semibold">{credData.name}</div></div>
                <div><span className="text-xs text-muted-foreground">Email:</span><div className="font-mono text-sm">{credData.email}</div></div>
                <div><span className="text-xs text-muted-foreground">Password:</span><div className="font-mono text-lg font-bold text-sky-600">{credData.plainPassword}</div></div>
                <div><span className="text-xs text-muted-foreground">Role:</span><div className="font-semibold uppercase">{credData.role}</div></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => copyCred(credData)} variant="outline" className="flex-1"><Copy className="w-4 h-4 mr-2"/> Salin</Button>
                <Button onClick={() => sendWA(credData)} className="flex-1 bg-green-600 hover:bg-green-700"><MessageCircle className="w-4 h-4 mr-2"/> Kirim ke WhatsApp</Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
