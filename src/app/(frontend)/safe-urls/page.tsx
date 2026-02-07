import React from 'react'
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
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
import { ShieldCheck, Star, ExternalLink, Globe } from 'lucide-react'

export default async function SafeUrlsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload = await getPayload({ config })
  
  // 1. Fetch High Value Targets (Official Brands)
  const highValueTargets = await payload.find({
    collection: 'high-value-targets',
    limit: 100,
    sort: 'name',
  })

  // 2. Fetch User-Verified Safe URLs
  const safeUrls = await payload.find({
    collection: 'urls',
    where: {
      status: {
        equals: 'SAFE',
      },
    },
    limit: 100,
    sort: '-updatedAt',
  })

  // Combine them for display logic
  // We'll display Brands first, then individual URLs
  
  return (
    <div className="home-container selection:bg-primary selection:text-primary-foreground">
      <Header user={user} />

      <main className="flex-1 space-y-12 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl tracking-tight leading-tight uppercase flex items-center justify-center gap-4">
            <ShieldCheck className="w-10 h-10 text-green-500" />
            Verified Safe List
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Official brands and community-verified legitimate domains
          </p>
        </div>

        {/* High Value Targets Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h2 className="text-sm uppercase tracking-[0.2em] font-medium">Protected Brands</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highValueTargets.docs.map((brand: any) => (
              <div 
                key={brand.id} 
                className="border-2 border-primary/20 bg-primary/[0.02] p-6 flex flex-col justify-between group hover:border-primary/50 transition-colors relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="w-12 h-12" />
                </div>
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tracking-tight uppercase text-foreground">{brand.name}</span>
                    <Badge variant="default" className="bg-primary text-primary-foreground rounded-none text-[10px] uppercase h-4 px-1">Official</Badge>
                  </div>
                  <div className="font-mono text-sm text-primary flex items-center gap-1">
                    {brand.official_domain}
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
                {brand.variations && brand.variations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/40 flex flex-wrap gap-2 relative z-10">
                    {brand.variations.map((v: string) => (
                      <span key={v} className="text-[10px] uppercase text-muted-foreground font-mono bg-muted px-1.5 py-0.5 border">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verified URLs Section */}
        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <h2 className="text-sm uppercase tracking-[0.2em] font-medium">Community Verified</h2>
          </div>

          <div className="border-2 border-border bg-background overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="uppercase tracking-widest text-xs font-normal py-4">Domain</TableHead>
                  <TableHead className="uppercase tracking-widest text-xs font-normal py-4">Status</TableHead>
                  <TableHead className="uppercase tracking-widest text-xs font-normal py-4 text-right">Trust Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeUrls.docs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground uppercase tracking-widest text-xs">
                      No verified URLs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  safeUrls.docs.map((urlDoc: any) => (
                    <TableRow key={urlDoc.id} className="hover:bg-muted/20 transition-colors border-b last:border-0">
                      <TableCell className="py-4 font-mono">
                        <span className="text-sm">{urlDoc.domain}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase tracking-widest">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Safe
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right font-mono font-bold text-green-500">
                        {urlDoc.trust_score}/100
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}
