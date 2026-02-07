import React from 'react'
import './styles.css'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from 'next-themes'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
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
