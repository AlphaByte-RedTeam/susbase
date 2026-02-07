import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal } from 'lucide-react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const payload = await getPayload({ config })

  // Fetch accepted reports to calculate scores
  // Note: For production with thousands of reports, this should be a cached aggregation or separate collection.
  const acceptedReports = await payload.find({
    collection: 'reports',
    where: {
      status: {
        equals: 'ACCEPTED',
      },
    },
    limit: 5000, // Reasonable limit for MVP
  })

  // Aggregate scores
  const scores: Record<string, number> = {}

  acceptedReports.docs.forEach((report: any) => {
    const id = report.reporter_id
    if (!id) return

    if (!scores[id]) {
      scores[id] = 0
    }
    scores[id]++
  })

  const leaderboard = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Top 10

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
            <CardTitle className="uppercase tracking-widest text-sm text-center flex items-center justify-center gap-2">
              <Medal className="w-4 h-4 text-yellow-500" />
              Hall of Fame
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="w-15 text-center font-bold text-xs uppercase tracking-widest">
                    Rank
                  </TableHead>
                  <TableHead className="uppercase tracking-widest text-xs font-normal">
                    Hunter
                  </TableHead>
                  <TableHead className="text-right uppercase tracking-widest text-xs font-normal">
                    Accepted Reports
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-12 text-muted-foreground uppercase tracking-widest text-xs"
                    >
                      No points awarded yet. Be the first!
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map(([id, count], index) => {
                    const isYou = user?.id === id
                    const displayName = isYou
                      ? 'YOU'
                      : `HUNTER-${id.substring(0, 10).toUpperCase()}`

                    return (
                      <TableRow
                        key={id}
                        className={cn(
                          'group border-b last:border-0 hover:bg-muted/20 transition-colors relative',
                          isYou && 'bg-primary/10 border-l-4 border-l-primary',
                        )}
                      >
                        <TableCell
                          className={cn(
                            'text-center font-mono font-bold text-lg',
                            isYou && 'text-primary',
                          )}
                        >
                          {index === 0
                            ? '🥇'
                            : index === 1
                              ? '🥈'
                              : index === 2
                                ? '🥉'
                                : `#${index + 1}`}
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'text-xs uppercase tracking-widest',
                                isYou ? 'font-bold text-primary' : 'text-muted-foreground',
                              )}
                            >
                              {displayName}
                            </span>
                            {isYou && (
                              <Badge
                                variant="default"
                                className="rounded-none text-[10px] px-1 h-4 bg-primary text-primary-foreground"
                              >
                                Me
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-mono text-lg font-bold',
                            isYou && 'text-primary',
                          )}
                        >
                          {count}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

import { cn } from '@/lib/utils'
