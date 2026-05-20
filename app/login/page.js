'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const logo = process.env.NEXT_PUBLIC_LOGO_URL;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.toLowerCase().trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');
      localStorage.setItem('pt_token', data.token);
      localStorage.setItem('pt_user', JSON.stringify(data.user));
      toast.success(`Selamat datang, ${data.user.name}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-sky-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-green-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke beranda
        </Link>
        <Card className="p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="logo" className="h-20 w-auto object-contain mb-3" />
            <h1 className="text-2xl font-extrabold">Login Dashboard</h1>
            <p className="text-sm text-muted-foreground text-center">Privat Tilawati - Sistem Manajemen</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@privattilawati.id" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 h-11">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Sedang masuk...</> : <><LogIn className="w-4 h-4 mr-2"/> Login</>}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-xs">
            <div className="font-semibold text-yellow-900 mb-1">Demo Credentials:</div>
            <div className="text-yellow-800">Admin: <code className="bg-white px-1 rounded">privattilawati@gmail.com</code> / <code className="bg-white px-1 rounded">admin123</code></div>
            <div className="text-yellow-800 mt-1">Asatidz: <code className="bg-white px-1 rounded">guru@privattilawati.id</code> / <code className="bg-white px-1 rounded">guru123</code></div>
          </div>
        </Card>
      </div>
    </main>
  );
}
