import type { Metadata } from 'next'
import { Fraunces } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const fraunces = Fraunces({ subsets: ['latin'], display: 'swap' })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pisairtel Church Management System (pi-CMS)',
  description: 'Comprehensive church management platform with AI-powered discipleship, community engagement, and spiritual growth tools',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,450;0,9..144,560;0,9..144,620;1,9..144,500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={fraunces.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

