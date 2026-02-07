import React from 'react'
import './styles.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'
import { JetBrains_Mono } from 'next/font/google'
import { Metadata } from 'next'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  adjustFontFallback: true,
  style: 'normal',
  variable: '--font-jetbrains-mono',
  preload: true,
  fallback: ['monospace'],
})

export const metadata: Metadata = {
  description: 'A crowd-sourced url safety layer to make internet safer',
  title: 'Susbase | The Crowd-Sourced Link Safety Layer',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning className={`${jetbrainsMono.variable}`}>
      <body>
        <main>
          <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </main>
        <Toaster />
      </body>
    </html>
  )
}
