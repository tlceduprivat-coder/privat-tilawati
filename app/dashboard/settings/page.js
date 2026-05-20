'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    if (u) setForm({ name: u.name || '', email: u.email || '', whatsapp: u.whatsapp || '' });
  }, []);

  const saveProfile = async () => {
    try {
      await apiFetch('auth/update-profile', { method: 'PUT', body: JSON.stringify(form) });
      const updated = { ...user, ...form };
      localStorage.setItem('pt_user', JSON.stringify(updated));
      toast.success('Profil tersimpan');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) { toast.error(e.message); }
  };

  const changePassword = async () => {
    if (passwordForm.password.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    if (passwordForm.password !== passwordForm.confirm) { toast.error('Password tidak cocok'); return; }
    try {
      await apiFetch('auth/update-profile', { method: 'PUT', body: JSON.stringify({ password: passwordForm.password }) });
      setPasswordForm({ password: '', confirm: '' });
      toast.success('Password berhasil diubah');
    } catch (e) { toast.error(e.message); }
  };

  if (!user) return <div className="text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2"><SettingsIcon className="w-7 h-7 text-sky-500"/> Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola profil dan keamanan akun Anda.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-4">Profil</h2>
        <div className="space-y-4">
          <div><Label>Nama Lengkap</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1.5"/></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1.5"/></div>
          <div><Label>Nomor WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp: e.target.value})} placeholder="08xxx" className="mt-1.5"/></div>
          <Button onClick={saveProfile} className="bg-sky-500 hover:bg-sky-600"><Save className="w-4 h-4 mr-2"/> Simpan Profil</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-bold text-lg mb-4">Ganti Password</h2>
        <div className="space-y-4">
          <div><Label>Password Baru</Label><Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({...passwordForm, password: e.target.value})} className="mt-1.5" placeholder="Minimal 6 karakter"/></div>
          <div><Label>Konfirmasi Password</Label><Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} className="mt-1.5"/></div>
          <Button onClick={changePassword} className="bg-sky-500 hover:bg-sky-600">Ubah Password</Button>
        </div>
      </Card>

      <Card className="p-6 bg-slate-50">
        <h2 className="font-bold text-lg mb-3">Info Akun</h2>
        <div className="text-sm space-y-1">
          <div><span className="text-muted-foreground">Role:</span> <span className="font-semibold uppercase">{user.role}</span></div>
          <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{user.id}</span></div>
        </div>
      </Card>
    </div>
  );
}
