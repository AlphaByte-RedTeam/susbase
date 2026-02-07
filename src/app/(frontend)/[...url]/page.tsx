import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { CheckUrlForm } from '@/components/check-url-form'
import { checkUrlAction } from '@/app/(frontend)/actions'

import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    url: string[]
  }>
}

export default async function MagicEntryPage({ params }: PageProps) {
  const { url: urlParts } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Reconstruct the URL from catch-all parts
  // We decode the parts to handle percent-encoded characters like %3A
  let targetUrl = urlParts.map(part => decodeURIComponent(part)).join('/')
  
  // Fix double slash if it looks like a protocol was intended but collapsed
  if (targetUrl.startsWith('http:/') && !targetUrl.startsWith('http://')) {
    targetUrl = targetUrl.replace('http:/', 'http://')
  } else if (targetUrl.startsWith('https:/') && !targetUrl.startsWith('https://')) {
    targetUrl = targetUrl.replace('https:/', 'https://')
  }

  // XSS Prevention: Disallow HTML-related characters
  if (targetUrl.includes('<') || targetUrl.includes('>') || targetUrl.includes('"') || targetUrl.includes("'")) {
    notFound()
  }

  // Heuristic: If it doesn't look like a URL or domain, it's likely a 404

  // Basic normalization for the initial check
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl
  }

  // Perform an initial server-side check to pre-populate if possible
  // We simulate the form data to reuse checkUrlAction
  const formData = new FormData()
  formData.append('url', targetUrl)
  
  const initialResult = await checkUrlAction(null, formData)

  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      <main className="flex-1 flex flex-col items-center justify-center space-y-16">
        <div className="w-full text-center space-y-6">
          <h1 className="text-3xl md:text-5xl tracking-tight leading-tight uppercase">
            Magic <span className="text-primary">Check</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto uppercase tracking-widest">
            Analyzing: <span className="text-foreground font-mono">{targetUrl}</span>
          </p>
        </div>

        {/* We pass the initial result to the form or just let the form handle it */}
        {/* For now, we reuse the form which is already optimized */}
        <CheckUrlForm initialUrl={targetUrl} initialResult={initialResult} />
      </main>
    </div>
  )
}
