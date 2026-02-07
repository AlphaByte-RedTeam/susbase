import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldCheck, Activity, Users, Database, Cpu } from 'lucide-react'

export default async function HowItWorksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      <main className="flex-1 space-y-12 max-w-4xl mx-auto w-full">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl tracking-tight leading-tight uppercase">
            How It Works
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Transparency is our core value. Here is how we calculate trust.
          </p>
        </div>

        <Tabs defaultValue="engine" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none bg-muted/50 p-1">
            <TabsTrigger value="engine" className="rounded-none uppercase tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">SusEngine</TabsTrigger>
            <TabsTrigger value="crowd" className="rounded-none uppercase tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Crowd-Source</TabsTrigger>
            <TabsTrigger value="score" className="rounded-none uppercase tracking-widest text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">Trust Score</TabsTrigger>
          </TabsList>
          
          <TabsContent value="engine" className="space-y-6 mt-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-none border-2">
                <CardHeader>
                  <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    Typosquatting Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  We use the <strong>Levenshtein Distance</strong> algorithm to calculate the similarity between the input URL and our whitelist of known legitimate domains (e.g., comparing <code>goog1e.com</code> to <code>google.com</code>). If a domain is deceptively similar, it is immediately flagged.
                </CardContent>
              </Card>

              <Card className="rounded-none border-2">
                <CardHeader>
                  <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    Keyword Heuristics
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  The engine scans for high-risk keywords often used in social engineering attacks, such as <code>login</code>, <code>secure</code>, <code>verify</code>, or <code>update-payment</code>. The presence of these words in a non-whitelisted domain lowers the trust score.
                </CardContent>
              </Card>

              <Card className="rounded-none border-2">
                <CardHeader>
                  <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    TLD Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  Certain Top-Level Domains (TLDs) like <code>.xyz</code>, <code>.top</code>, or <code>.gq</code> are statistically more likely to be used for spam. We apply a penalty score when these are combined with other risk factors.
                </CardContent>
              </Card>

              <Card className="rounded-none border-2">
                <CardHeader>
                  <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    Dynamic Whitelist
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  Our whitelist isn&apos;t static. It grows as the community reports and verifies new safe domains. The engine uses this constantly updated list to verify new links against community-trusted knowledge.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="crowd" className="space-y-6 mt-8">
            <Card className="rounded-none border-2">
              <CardHeader>
                <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  The Verification Process
                </CardTitle>
                <CardDescription className="uppercase tracking-widest text-xs">
                  How we process user reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  When you submit a report, it enters our system as <strong>PENDING</strong>. Our system performs an initial automated check:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>
                    If you report a site as <strong>SAFE</strong>, but our engine or database already knows it&apos;s malicious, your report is <strong>Auto-Rejected</strong>.
                  </li>
                  <li>
                    If you report a site as <strong>MALICIOUS</strong>, it contributes to the negative score of the URL.
                  </li>
                  <li>
                    Reports are reviewed by our Red Team admins and high-ranking hunters to verify the threat.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="score" className="space-y-6 mt-8">
             <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 border border-green-500/20 bg-green-500/5">
                  <div className="text-2xl font-mono text-green-500 font-bold">90 - 100</div>
                  <div>
                    <div className="uppercase tracking-widest text-xs font-bold text-green-500">Safe</div>
                    <p className="text-xs text-muted-foreground">Verified by whitelist or community consensus. Safe to visit.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border border-yellow-500/20 bg-yellow-500/5">
                  <div className="text-2xl font-mono text-yellow-500 font-bold">50 - 89</div>
                  <div>
                    <div className="uppercase tracking-widest text-xs font-bold text-yellow-500">Unknown / Suspicious</div>
                    <p className="text-xs text-muted-foreground">Insufficient data or mild heuristic triggers. Exercise caution.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border border-red-500/20 bg-red-500/5">
                  <div className="text-2xl font-mono text-red-500 font-bold">0 - 49</div>
                  <div>
                    <div className="uppercase tracking-widest text-xs font-bold text-red-500">Malicious</div>
                    <p className="text-xs text-muted-foreground">Confirmed threat, phishing, or strong heuristic match. Do not visit.</p>
                  </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
