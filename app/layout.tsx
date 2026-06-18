import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Agenda Voz',
  description: 'Agenda pessoal por voz',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Agenda' },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geist.className} bg-zinc-950 text-white min-h-screen overflow-x-hidden`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
