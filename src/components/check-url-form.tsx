'use client'

import { useActionState } from 'react'
import { checkUrlAction } from '@/app/(frontend)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, CircleHelp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReportDialog } from './report-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Link from 'next/link'

const initialState = {
  result: null,
  error: null,
}

export function CheckUrlForm() {
  const [state, formAction, isPending] = useActionState(checkUrlAction, initialState)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-12">
      <form action={formAction} className="flex flex-col sm:flex-row gap-0 border-2 border-border focus-within:border-primary transition-colors">
        <Input
          type="text"
          name="url"
          placeholder="PASTE A SUSPICIOUS LINK..."
          required
          className="flex-1 h-14 text-lg font-mono bg-background border-0 focus-visible:ring-0 rounded-none uppercase tracking-tight"
        />
        <Button 
          type="submit" 
          size="lg" 
          disabled={isPending}
          className="h-14 px-10 text-lg rounded-none bg-primary text-primary-foreground hover:opacity-90 transition-opacity uppercase tracking-widest"
        >
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            'CHECK'
          )}
        </Button>
      </form>

      {state?.error && (
        <div className="p-4 text-destructive bg-destructive/10 border border-destructive/20 text-center uppercase text-xs tracking-widest">
          {state.error}
        </div>
      )}

      {state?.result && (
        <Card className="border-2 rounded-none animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-normal">Analysis Result</CardTitle>
              <RiskBadge level={state.result.riskLevel} />
            </div>
            <CardDescription className="font-mono break-all text-xl text-foreground pt-2">
              {state.result.domain}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Trust Score</div>
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                          <CircleHelp className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-none border-2 bg-background p-4 max-w-xs font-mono shadow-xl">
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest leading-relaxed">
                            Calculated using SusEngine heuristics (Typosquatting, Keywords, TLD) and verified community reports.
                          </p>
                          <Link 
                            href="/how-it-works" 
                            className="text-[10px] uppercase tracking-tighter text-primary hover:underline block pt-1"
                          >
                            Learn more about scoring ›
                          </Link>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-5xl font-mono text-foreground">
                  {state.result.trustScore}<span className="text-muted-foreground text-2xl">/100</span>
                </div>
                <div className="h-1 w-full bg-muted overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", 
                      state.result.trustScore > 80 ? "bg-green-500" :
                      state.result.trustScore > 50 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${state.result.trustScore}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Detection Flags</div>
                {state.result.flags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {state.result.flags.map((flag: string) => (
                      <Badge key={flag} variant="outline" className="rounded-none font-mono text-[10px] uppercase tracking-tighter py-0 px-2 border-muted-foreground/30">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground uppercase tracking-tighter italic">No specific flags detected.</div>
                )}
              </div>
            </div>

            {state.result.details.length > 0 && (
               <div className="space-y-4 pt-4 border-t border-dashed">
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Analysis Details</div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {state.result.details.map((detail: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary opacity-50">›</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between border-t p-6 gap-4 items-center">
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest max-w-[200px]">
               Automated estimation. Verify manually.
             </p>
             <ReportDialog url={state.result.url} />
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  switch (level) {
    case 'SAFE':
      return <div className="flex items-center gap-2 text-green-500 text-xs uppercase tracking-widest"><ShieldCheck className="w-4 h-4"/> SAFE</div>
    case 'SUSPICIOUS':
      return <div className="flex items-center gap-2 text-yellow-500 text-xs uppercase tracking-widest"><ShieldAlert className="w-4 h-4"/> SUSPICIOUS</div>
    case 'MALICIOUS':
      return <div className="flex items-center gap-2 text-red-500 text-xs uppercase tracking-widest"><ShieldX className="w-4 h-4"/> MALICIOUS</div>
    default:
      return <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest"><ShieldQuestion className="w-4 h-4"/> UNKNOWN</div>
  }
}