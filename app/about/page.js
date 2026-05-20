'use client';
import SiteNavbar from '@/components/SiteNavbar';
import SiteFooter from '@/components/SiteFooter';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Card } from '@/components/ui/card';
import { BookOpen, Target, Eye, Calendar, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <SiteNavbar />
      <section className="bg-gradient-to-br from-sky-500 via-blue-600 to-sky-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Tentang Privat Tilawati</h1>
          <p className="text-white/90 max-w-2xl mx-auto">Mendidik generasi Qur'ani dengan metode Tilawati sejak 2017</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose max-w-none">
          <h2 className="text-3xl font-extrabold mb-5">Sekilas Privat Tilawati</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Privat Tilawati adalah lembaga pendidikan Al-Qur'an yang berbasis di Kp Sekemandung, Girimekar, Cilengkrang, Kabupaten Bandung. Berdiri sejak tahun <strong>2017</strong>, kami berkomitmen untuk menjadikan proses belajar membaca Al-Qur'an mudah dijangkau oleh semua kalangan—mulai dari anak-anak, remaja, dewasa, hingga lansia.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Dengan pengalaman lebih dari 7 tahun, kami telah membersamai lebih dari <strong>200 santri</strong> aktif dan didukung oleh <strong>30+ ustadz/ustadzah</strong> tersertifikasi Metode Tilawati. Layanan kami menjangkau wilayah <strong>Bandung Timur dan Bandung Barat</strong>, dengan opsi privat di rumah maupun pembelajaran online untuk fleksibilitas maksimal.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 border-2 border-sky-200 bg-sky-50">
            <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center mb-4">
              <Eye className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold mb-3">Visi</h3>
            <p className="text-muted-foreground leading-relaxed">
              Menjadi lembaga pendidikan Al-Qur'an terdepan yang melahirkan generasi Qur'ani yang fasih membaca, memahami, dan mengamalkan isi Al-Qur'an.
            </p>
          </Card>
          <Card className="p-8 border-2 border-green-200 bg-green-50">
            <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center mb-4">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold mb-3">Misi</h3>
            <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
              <li>Menyelenggarakan pembelajaran Al-Qur'an dengan metode Tilawati yang sistematis</li>
              <li>Membentuk santri yang fasih, tartil, dan mencintai Al-Qur'an</li>
              <li>Menyediakan ustadz/ustadzah profesional dan tersertifikasi</li>
              <li>Memberikan layanan privat di rumah dan online yang fleksibel</li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="bg-gradient-to-br from-sky-50 to-blue-50 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium mb-3">
              <BookOpen className="w-3.5 h-3.5" /> METODE PEMBELAJARAN
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold">Apa itu Metode Tilawati?</h2>
          </div>
          <Card className="p-8">
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Metode Tilawati</strong> adalah metode pembelajaran Al-Qur'an yang dirancang oleh para ustadz pesantren Al-Qur'an Nurul Falah Surabaya. Metode ini menggunakan pendekatan <em>klasikal dan individual</em> dengan lagu rost yang khas, sehingga santri lebih mudah mengenal huruf, makhraj, dan tajwid sekaligus.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {[
                { title: 'Pendekatan Klasikal', desc: 'Belajar bersama dalam kelompok kecil untuk membangun kebersamaan.' },
                { title: 'Pendekatan Individual', desc: 'Setiap santri mendapatkan perhatian khusus sesuai kemampuannya.' },
                { title: 'Lagu Rost', desc: 'Menggunakan lagu khas yang memudahkan menghafal panjang-pendek bacaan.' },
                { title: 'Buku Berjilid', desc: 'Materi tersusun bertahap dari Jilid 1 hingga Jilid 6 + Al-Qur\'an.' },
              ].map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-sm text-muted-foreground">{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">Perjalanan Kami</h2>
          <p className="text-muted-foreground mt-3">Dari satu kelompok kecil menjadi keluarga besar Qur'ani</p>
        </div>
        <div className="space-y-6">
          {[
            { year: '2017', title: 'Awal Berdiri', desc: 'Privat Tilawati didirikan dengan beberapa santri pertama di lingkungan Cilengkrang, Bandung.' },
            { year: '2019', title: 'Ekspansi Kelas Privat', desc: 'Mulai melayani privat home-visit untuk berbagai usia di area Bandung Timur dan Bandung Barat.' },
            { year: '2020', title: 'Hadir Online', desc: 'Membuka kelas online untuk menjangkau santri di luar kota saat masa pandemi.' },
            { year: '2024', title: '200+ Santri Aktif', desc: 'Alhamdulillah, dipercaya oleh lebih dari 200 santri dan 30+ ustadz/ustadzah tersertifikasi.' },
          ].map((t, i) => (
            <Card key={i} className="p-6 flex gap-5 items-start hover:shadow-lg transition">
              <div className="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white">
                <div className="text-center">
                  <Calendar className="w-5 h-5 mx-auto mb-1" />
                  <div className="font-extrabold">{t.year}</div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloat />
    </main>
  );
}
