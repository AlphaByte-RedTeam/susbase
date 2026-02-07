'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Github, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleLogin = async (provider: 'github' | 'google') => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-mono selection:bg-primary selection:text-primary-foreground">
      <div className="absolute top-8 left-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="rounded-none uppercase tracking-widest text-xs gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-12">
          <div className="flex flex-col items-center space-y-8 text-center">
            <Link href="/">
              <Image
                src="/susbase-logo.svg"
                alt="SUSBASE"
                width={200}
                height={32}
                className="dark:invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl uppercase tracking-widest font-normal">Welcome Back</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider leading-relaxed">
                Sign in to report malicious links and climb the hunter leaderboard
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-border/40">
            <Button
              variant="outline"
              className="w-full h-14 rounded-none uppercase tracking-widest text-xs hover:bg-muted/50 transition-colors border-border/60 hover:border-foreground/50"
              onClick={() => handleLogin('github')}
              disabled={loading}
            >
              <Github className="mr-3 h-5 w-5" />
              Continue with GitHub
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 rounded-none uppercase tracking-widest text-xs hover:bg-muted/50 transition-colors border-border/60 hover:border-foreground/50"
              onClick={() => handleLogin('google')}
              disabled={loading}
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="pt-8 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
