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
  description: 'Make Internet Safer. Create a massive, open database of malicious links and social engineering traps, powered by crowd intelligence and smart algorithms.',
  title: 'SusBase: The Crowd-Sourced Link Verification Layer',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning className={`${jetbrainsMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <main>
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
