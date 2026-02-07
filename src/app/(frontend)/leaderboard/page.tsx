import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      <main className="flex-1 flex flex-col items-center justify-center space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl tracking-tight leading-tight uppercase flex items-center justify-center gap-4">
            <Trophy className="w-10 h-10 text-primary" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Top Hunters protecting the internet
          </p>
        </div>

        <Card className="w-full max-w-2xl border-2 rounded-none bg-background">
          <CardHeader>
            <CardTitle className="uppercase tracking-widest text-sm text-center">Under Construction</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12 text-muted-foreground">
            <p className="mb-4">We are currently calculating the scores.</p>
            <p className="text-xs uppercase tracking-widest">Start reporting to secure your spot!</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
