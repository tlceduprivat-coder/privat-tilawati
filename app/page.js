'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SiteNavbar from '@/components/SiteNavbar';
import SiteFooter from '@/components/SiteFooter';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { BookOpen, Users, Award, Calendar, CheckCircle2, GraduationCap, Heart, Sparkles, Star, Quote, Building2, Wifi, Home as HomeIcon } from 'lucide-react';

export default function HomePage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP || '085117253381';
  const waLink = `https://wa.me/62${wa.replace(/^0/,'')}?text=${encodeURIComponent('Assalamu\'alaikum, saya tertarik mendaftar di Privat Tilawati.')}`;
  const hero = 'https://images.pexels.com/photos/15979873/pexels-photo-15979873.jpeg';
  const learning2 = 'https://images.unsplash.com/photo-1582033131298-5bb54c589518';

  return (
    <main className="min-h-screen bg-white">
      <SiteNavbar />

      {/* HERO */}
      <section className="relative overflow-hidden bg-pattern">
        <div className="container mx-auto px-6 lg:px-10 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Berdiri sejak 2017 · Bandung
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
              Belajar Membaca <br/>
              <span className="gradient-text">Al-Qur'an</span> dengan <br/>
              Metode <span className="text-sky-500">Tilawati</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Pendidikan Tahsin Al-Qur'an profesional bersama 30+ ustadz/ustadzah tersertifikasi Metode Tilawati dan berpengalaman. Metode sistematis, menyenangkan, dan terbukti efektif untuk segala usia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/daftar">
                <Button size="lg" className="bg-sky-500 hover:bg-sky-600 h-12 px-6 text-base">
                  Daftar Sekarang
                </Button>
              </Link>
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base border-green-500 text-green-600 hover:bg-green-50">
                  Hubungi via WhatsApp
                </Button>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500"/> Tersertifikasi Tilawati</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500"/> Berpengalaman</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500"/> Online &amp; Offline</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-40 h-40 bg-yellow-300/30 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-sky-300/40 rounded-full blur-3xl"></div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
              <img src={hero} alt="Al-Qur'an" className="w-full h-[500px] object-cover" />
            </div>
            <div className="absolute -bottom-6 left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-sky-500"/>
              </div>
              <div>
                <div className="font-bold text-lg">200+ Santri</div>
                <div className="text-xs text-muted-foreground">Aktif belajar bersama kami</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: GraduationCap, value: '30+', label: 'Guru Profesional', color: 'sky' },
            { icon: Users, value: '200+', label: 'Santri Aktif', color: 'sky' },
            { icon: Calendar, value: '2017', label: 'Berdiri Sejak', color: 'yellow' },
            { icon: Award, value: 'Tilawati', label: 'Metode Resmi', color: 'green' },
          ].map((s, i) => (
            <Card key={i} className="p-6 text-center hover:shadow-lg transition border-2 hover:border-sky-500">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${s.color === 'sky' ? 'bg-sky-100 text-sky-500' : s.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              <s.icon className="w-7 h-7" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="container mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <img src={learning2} alt="Quran learning" className="rounded-3xl shadow-xl w-full h-[400px] object-cover" />
          <div className="absolute -bottom-6 -right-6 bg-sky-500 text-white rounded-2xl p-5 shadow-xl max-w-[220px]">
            <div className="font-arabic text-2xl">خَيْرُكُمْ</div>
            <div className="text-xs mt-1 opacity-90">“Sebaik-baik kalian adalah yang belajar Al-Qur'an dan mengajarkannya.” (HR. Bukhari)</div>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-sky-500 mb-3">TENTANG KAMI</div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-5">Mendidik Generasi Qur'ani Sejak 2017</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Privat Tilawati adalah lembaga pendidikan Al-Qur'an yang berfokus pada pengajaran tahsin dengan <strong>Metode Tilawati</strong>. Berbasis di Cilengkrang, Bandung, kami melayani santri dari berbagai usia—anak-anak, remaja, dewasa, hingga lansia—baik secara <strong>privat di rumah</strong> maupun <strong>online</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Dengan dukungan 30+ ustadz/ustadzah tersertifikasi Metode Tilawati dan berpengalaman, kami berkomitmen menjadikan proses belajar Al-Qur'an mudah, terstruktur, dan menyenangkan.
          </p>
          <Link href="/about">
            <Button variant="outline" className="border-sky-500 text-sky-600 hover:bg-sky-50">Pelajari Lebih Lanjut</Button>
          </Link>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-gradient-to-br from-sky-50 via-white to-blue-50 py-20">
        <div className="container mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-sm font-semibold text-sky-500 mb-3">KENAPA PRIVAT TILAWATI?</div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Belajar Al-Qur'an Jadi Lebih Mudah</h2>
            <p className="text-muted-foreground mt-3">Kami hadir dengan keunggulan-keunggulan yang dirancang khusus untuk percepatan kemampuan tahsin Anda.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, title: 'Metode Tilawati', desc: 'Metode resmi & teruji yang sistematis menggunakan lagu rost, klasikal & individual.' },
              { icon: GraduationCap, title: 'Guru Tersertifikasi', desc: '30+ ustadz/ustadzah tersertifikasi Metode Tilawati dan berpengalaman.' },
              { icon: Heart, title: 'Suasana Hangat', desc: 'Belajar dengan pendekatan kekeluargaan, sabar, dan menyenangkan.' },
              { icon: Calendar, title: 'Jadwal Fleksibel', desc: 'Pilih jadwal sesuai kebutuhan Anda, tersedia kelas online & privat di rumah.' },
              { icon: Users, title: 'Untuk Semua Usia', desc: 'Program tersedia untuk anak-anak (TK/SD), remaja, dewasa, hingga lansia.' },
              { icon: Award, title: 'Progress Terukur', desc: 'Setiap santri mendapatkan rapor & evaluasi berkala dari ustadz pengampu.' },
            ].map((f, i) => (
              <Card key={i} className="p-6 hover:shadow-xl transition border-2 hover:border-sky-500 bg-white">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white mb-4">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="container mx-auto px-6 lg:px-10 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-sm font-semibold text-sky-500 mb-3">PROGRAM PEMBELAJARAN</div>
          <h2 className="text-3xl md:text-4xl font-extrabold">Pilih Program Sesuai Kebutuhan</h2>
          <p className="text-muted-foreground mt-3">Tarif infaq jasa peran orangtua, transportasi & operasional lembaga.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Kelas Mandiri', kategori: 'Offline', tarif: 'Rp 85K', desc: '1 santri / 1 jam. Privat home-visit.', color: 'from-sky-500 to-blue-600', icon: BookOpen },
            { title: 'Kelas Mentoring', kategori: 'Offline', tarif: 'Rp 150K', desc: '2-4 santri / 1 jam. Kelompok kecil.', color: 'from-blue-500 to-sky-600', icon: Users },
            { title: "Kelas Ta'lim", kategori: 'Offline', tarif: 'Rp 200K', desc: '7-10 santri / 1 jam. Kelas Ta\'lim.', color: 'from-emerald-500 to-green-600', icon: GraduationCap },
            { title: 'Kelas Guru/Instansi', kategori: 'Offline', tarif: 'Rp 250K', desc: '7-10 orang / 2 jam. Untuk guru/instansi.', color: 'from-green-500 to-emerald-600', icon: Award },
            { title: 'Tilawati Goes To Office', kategori: 'Corporate', tarif: 'Rp 250K', desc: 'Ustadz datang ke kantor Anda.', color: 'from-yellow-500 to-orange-500', icon: Building2 },
            { title: 'Kelas Reguler', kategori: 'Di Tempat Kami', tarif: 'Rp 150K', desc: 'Belajar di lokasi Privat Tilawati.', color: 'from-sky-400 to-cyan-500', icon: HomeIcon },
            { title: 'Kelas Mandiri Online', kategori: 'Online', tarif: 'Rp 50K', desc: '45 menit / 1 santri via Zoom/Meet.', color: 'from-sky-500 to-blue-500', icon: Wifi },
            { title: 'Kelas Mentoring Online', kategori: 'Online', tarif: 'Rp 75K', desc: '2-3 santri / 1 jam via Zoom/Meet.', color: 'from-blue-500 to-indigo-600', icon: Wifi },
            { title: 'Munaqosyah & Sertifikasi', kategori: 'Test Jilid', tarif: 'Rp 35K-100K', desc: 'Test jilid + sertifikat digital setiap kenaikan.', color: 'from-emerald-500 to-teal-600', icon: Award },
          ].map((p, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-2xl transition group">
              <div className={`h-32 bg-gradient-to-br ${p.color} relative flex items-end p-5`}>
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs">{p.kategori}</div>
                <p.icon className="w-12 h-12 text-white/40 absolute top-4 left-4" />
                <div className="text-white font-bold text-xl">{p.title}</div>
              </div>
              <div className="p-6">
                <div className="text-2xl font-extrabold text-sky-600 mb-1">{p.tarif}<span className="text-xs font-normal text-muted-foreground"> / temu</span></div>
                <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                <Link href="/daftar">
                  <Button variant="outline" className="w-full border-sky-500 text-sky-600 hover:bg-sky-50">Daftar Program Ini</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-8 p-5 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-900 max-w-3xl mx-auto">
          <strong>Catatan:</strong> Administrasi mengaji bukan sebagai bayaran asatidz, tapi sebagai pengganti jasa Peran Orangtua, Transportasi, dan operasional Lembaga Privat Tilawati. Penyerahan infaq sebelum pembelajaran dimulai atau selambat-lambatnya tanggal 10.
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-sky-50 py-20">
        <div className="container mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-sm font-semibold text-sky-500 mb-3">TESTIMONI</div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Apa Kata Mereka?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Ibu Aisyah', role: 'Orang Tua Santri', text: 'Alhamdulillah, anak saya jadi semangat ngaji setiap hari. Ustadzahnya sabar dan telaten sekali.', stars: 5 },
              { name: 'Pak Rahman', role: 'Santri Dewasa', text: 'Saya yang sudah berusia 40an akhirnya bisa membaca Al-Qur\'an dengan tajwid yang benar. Terima kasih Privat Tilawati!', stars: 5 },
              { name: 'Fatimah', role: 'Mahasiswa', text: 'Metode Tilawati membuat saya cepat memahami makhraj dan tajwid. Suasananya sangat nyaman.', stars: 5 },
            ].map((t, i) => (
              <Card key={i} className="p-6 bg-white">
                <Quote className="w-8 h-8 text-sky-300 mb-3" />
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, k) => <Star key={k} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 lg:px-10 py-20">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-sky-500 via-blue-600 to-sky-700 p-10 md:p-16 text-white text-center">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 20%, white 0%, transparent 50%), radial-gradient(circle at 80% 80%, white 0%, transparent 50%)'}}></div>
          <div className="relative">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Siap Memulai Perjalanan Qur'ani Anda?</h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">Daftarkan diri atau putra-putri Anda sekarang juga. Konsultasi gratis melalui WhatsApp.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/daftar">
                <Button size="lg" className="bg-white text-sky-600 hover:bg-yellow-50 h-12 px-8 text-base font-semibold">
                  Daftar Sekarang
                </Button>
              </Link>
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-sky-600 h-12 px-8 text-base">
                  Chat WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloat />
    </main>
  );
}
