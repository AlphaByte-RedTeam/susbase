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

export function Header({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-20 gap-4">
      <div className="flex items-center gap-12 w-full md:w-auto justify-between md:justify-start">
        <Link href="/" className="flex items-center gap-2 tracking-tight">
          <Image 
            src="/susbase-logo.svg" 
            alt="SUSBASE" 
            width={160} 
            height={24} 
            className="dark:invert"
          />
        </Link>
        <nav className="hidden md:flex gap-6 text-sm items-center text-muted-foreground font-medium uppercase tracking-wider">
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
          <Link href="/submissions" className="hover:text-foreground transition-colors">Submissions</Link>
          <Link href="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
        </nav>
      </div>
      
      <nav className="flex gap-4 text-sm items-center text-muted-foreground w-full md:w-auto justify-end">
        <Link href="https://github.com/AlphaByte-RedTeam/susbase" target="_blank" className="hover:text-foreground transition-colors" aria-label="GitHub">
          <Github className="w-5 h-5" />
        </Link>
        <ModeToggle />
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none uppercase tracking-widest text-xs h-9 px-4 gap-2">
                <User className="h-3 w-3" />
                {(() => {
                  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
                  const parts = name.trim().split(/\s+/);
                  if (parts.length === 1) return parts[0];
                  const first = parts[0];
                  // Prefer the very last part for the initial if multiple names exist, typical for western names.
                  // Or just the next part. The prompt asked for "middle name if available or the last name first initials".
                  // Let's take the second part if available as the "middle/last" initial.
                  const lastInitial = parts[parts.length - 1][0].toUpperCase();
                  return `${first} ${lastInitial}.`;
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none">
              <DropdownMenuLabel className="uppercase tracking-widest text-xs">
                My Account
                <span className="block text-[10px] text-muted-foreground mt-1 font-normal normal-case">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
            className="rounded-none uppercase tracking-widest text-xs h-9 px-4"
            asChild
          >
            <Link href="/login">Login</Link>
          </Button>
        )}
        <ReportDialogButton />
      </nav>
    </header>
  )
}
