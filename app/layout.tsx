import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Claude Viewer',
  description: 'View your Claude conversation history',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-text bg-premium-bg-primary text-premium-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}