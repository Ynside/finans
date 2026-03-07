import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Finansal Takip Sistemi',
  description: 'Modern finansal takip ve borç yönetim uygulaması',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        <Navigation />
        <div className="pb-16 md:pb-0">
          {children}
        </div>
      </body>
    </html>
  )
}

