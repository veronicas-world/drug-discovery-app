import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: "Veronica's Drug Repurposing Discovery Engine",
  description: 'Computational hypotheses for drug repurposing — powered by SIDER, PubMed, and Claude.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={GeistMono.className}>{children}</body>
    </html>
  )
}
