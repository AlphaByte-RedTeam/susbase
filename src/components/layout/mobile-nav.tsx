'use client'

import React from 'react'
import Link from 'next/link'
import { Menu, User, LogOut, Shield } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ReportDialog } from '@/components/report-dialog-button'

interface MobileNavProps {
  user: any
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[85vw] sm:max-w-xs rounded-none border-l-2 font-mono flex flex-col h-full p-0"
      >
        <SheetHeader className="text-left border-b p-6">
          <SheetTitle className="uppercase tracking-widest flex items-center gap-2">
            <Image
              src="/susbase-logo.svg"
              alt="SUSBASE"
              width={120}
              height={20}
              className="dark:invert"
            />
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col flex-1 justify-between p-6 overflow-y-auto">
          {/* MENU SECTION */}
          <nav className="flex flex-col gap-6 text-sm font-medium uppercase tracking-wider">
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 hover:text-primary transition-colors pb-2 border-b border-border/40"
              onClick={() => setOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              href="/submissions"
              className="flex items-center gap-3 hover:text-primary transition-colors pb-2 border-b border-border/40"
              onClick={() => setOpen(false)}
            >
              Submissions
            </Link>
            <Link
              href="/safe-urls"
              className="flex items-center gap-3 hover:text-primary transition-colors pb-2 border-b border-border/40"
              onClick={() => setOpen(false)}
            >
              Safe URLs
            </Link>
            <Link
              href="/how-it-works"
              className="flex items-center gap-3 hover:text-primary transition-colors pb-2 border-b border-border/40"
              onClick={() => setOpen(false)}
            >
              How It Works
            </Link>
          </nav>

          {/* ACTION SECTION */}
          <div className="space-y-6 pt-6 border-t border-border/40 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Theme</span>
              <ModeToggle />
            </div>

            <div className="space-y-4">
              {user && (
                <div className="flex items-center gap-3 p-3 border bg-muted/20">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold uppercase tracking-wide truncate">
                      {(() => {
                        const name =
                          user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email?.split('@')[0] ||
                          'User'
                        const parts = name.trim().split(/\s+/)
                        if (parts.length === 1) return parts[0]
                        return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
                      })()}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase">
                      Since{' '}
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        year: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              )}

              <ReportDialog
                trigger={
                  <Button
                    variant="outline"
                    className="w-full rounded-none uppercase tracking-widest text-xs gap-2 justify-center h-12"
                  >
                    <Shield className="w-4 h-4" />
                    Submit URL
                  </Button>
                }
              />

              {user ? (
                <Button
                  variant="destructive"
                  className="w-full rounded-none uppercase tracking-widest text-xs gap-2 h-12"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="w-full rounded-none uppercase tracking-widest text-xs h-12"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
