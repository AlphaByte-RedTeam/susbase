'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github, User, LogOut } from 'lucide-react'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ReportDialogButton } from '@/components/report-dialog-button'
import { MobileNav } from '@/components/layout/mobile-nav'

export function Header({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="flex flex-row justify-between items-center mb-20 gap-4 w-full px-4 md:px-0">
      <div className="flex items-center gap-12">
        <Link href="/" className="flex items-center gap-2 tracking-tight shrink-0">
          <Image
            src="/susbase-logo.svg"
            alt="SUSBASE"
            width={160}
            height={24}
            className="dark:invert w-28 md:w-36"
          />
        </Link>
        <nav className="hidden lg:flex gap-8 text-sm items-center text-muted-foreground font-medium uppercase tracking-wider">
          <Link
            href="/leaderboard"
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            Leaderboard
          </Link>
          <Link
            href="/submissions"
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            Submissions
          </Link>
          <Link
            href="/how-it-works"
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            How It Works
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Desktop Nav Actions */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-6 text-sm text-muted-foreground">
          <Link
            href="https://github.com/AlphaByte-RedTeam/susbase"
            target="_blank"
            className="hover:text-foreground transition-colors p-2"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </Link>
          <div className="h-4 w-[1px] bg-border/60 mx-1" />
          <ModeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none uppercase tracking-widest text-[10px] h-9 px-4 gap-2 border-border/60 hover:border-foreground/50"
                >
                  <User className="h-3 w-3" />
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
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-none border-2">
                <DropdownMenuLabel className="uppercase tracking-widest text-xs">
                  My Account
                  <span className="block text-[10px] text-muted-foreground mt-1 font-normal normal-case">
                    Member since{' '}
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="uppercase tracking-wider text-xs cursor-pointer bg-destructive text-destructive-foreground focus:bg-destructive/90 focus:text-destructive-foreground rounded-none m-1"
                >
                  <LogOut className="mr-2 h-3 w-3" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="rounded-none uppercase tracking-widest text-[10px] h-9 px-4 border-border/60 hover:border-foreground/50"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
          <ReportDialogButton />
        </nav>

        {/* Mobile Nav Trigger */}
        <MobileNav user={user} />
      </div>
    </header>
  )
}
