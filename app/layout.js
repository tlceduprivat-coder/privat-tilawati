import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Privat Tilawati - Belajar Al-Qur\'an Metode Tilawati',
  description: 'Lembaga pendidikan Tahsin Al-Qur\'an dengan Metode Tilawati. Berdiri sejak 2017, dipercaya oleh 200+ santri dan 30+ guru profesional di Bandung.',
  keywords: 'tilawati, privat tilawati, belajar al quran, tahsin, mengaji, bandung, cilengkrang, islamic education',
  openGraph: {
    title: 'Privat Tilawati - Belajar Al-Qur\'an Metode Tilawati',
    description: 'Lembaga pendidikan Tahsin Al-Qur\'an dengan Metode Tilawati di Bandung.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href={process.env.NEXT_PUBLIC_LOGO_URL} />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
