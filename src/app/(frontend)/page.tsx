import React from 'react'
import { CheckUrlForm } from '@/components/check-url-form'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'

import Link from 'next/link'
import { IconBrandGithub } from '@tabler/icons-react'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center space-y-16">
        <div className="w-full text-center space-y-6">
          <h1 className="text-4xl md:text-6xl tracking-tight leading-tight uppercase">
            Is that link <span className="text-primary">safe?</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The crowd-sourced safety layer for the internet. Check links against our database and
            smart analysis engine.
          </p>
        </div>

        <CheckUrlForm />

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 text-sm text-muted-foreground">
          <div className="space-y-3 p-6 border-2 border-border">
            <div className="text-foreground uppercase tracking-widest text-xs font-medium">
              Real-time
            </div>
            <p className="leading-relaxed">
              Instant analysis of domain variations and patterns using the SusEngine.
            </p>
          </div>
          <div className="space-y-3 p-6 border-2 border-border">
            <div className="text-foreground uppercase tracking-widest text-xs font-medium">
              Crowd-Sourced
            </div>
            <p className="leading-relaxed">
              Powered by verified reports from the security community to stay ahead of traps.
            </p>
          </div>
          <div className="space-y-3 p-6 border-2 border-border">
            <div className="text-foreground uppercase tracking-widest text-xs font-medium">
              Open Data
            </div>
            <p className="leading-relaxed">
              A transparent, public database of known malicious links and phishing targets.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 text-xs text-muted-foreground border-t border-border/40 flex justify-between items-center">
        <p>© 2026 SUSBASE. MAKE THE INTERNET SAFER.</p>
        <Link
          href="https://github.com/AlphaByte-RedTeam/susbase"
          target="_blank"
          className="hover:text-foreground transition-colors p-2"
          aria-label="GitHub"
        >
          <IconBrandGithub className="w-5 h-5" />
        </Link>
      </footer>
    </div>
  )
}
