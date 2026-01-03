import type { Metadata } from 'next'
import '@fontsource-variable/inter/index.css'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ecclesia Church App',
  description: 'Comprehensive church management and community app with AI-powered discipleship',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

