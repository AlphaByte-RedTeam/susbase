'use server'

import { analyzeUrl } from '@/lib/engine'
import { CheckResult, BrandTarget } from '@/lib/engine/types'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createClient } from '@/lib/supabase/server'
import { TARGET_WHITELIST } from '@/lib/engine/data'
import { z } from 'zod'

export async function checkUrlAction(prevState: any, formData: FormData) {
  const url = formData.get('url') as string
  
  // Zod Validation: Ensure valid URL with http/https
  const urlSchema = z.string().url().refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
    message: "URL must start with http:// or https://"
  })

  const validation = urlSchema.safeParse(url)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    const payload = await getPayload({ config })
    
    // 1. Check DB first
    const existing = await payload.find({
      collection: 'urls',
      where: {
        url: {
          equals: url,
        },
      },
    })

    // 2. Fetch Dynamic Whitelist (SAFE URLs)
    const safeUrls = await payload.find({
      collection: 'urls',
      where: {
        status: {
          equals: 'SAFE',
        },
      },
      limit: 1000, 
    })
    
    const dynamicWhitelist = [
      ...TARGET_WHITELIST,
      ...safeUrls.docs.map(doc => doc.domain)
    ]

    // 3. Fetch High Value Targets for Impersonation Check
    const brandTargetsReq = await payload.find({
      collection: 'high-value-targets',
      limit: 100,
    })
    const brandTargets: BrandTarget[] = brandTargetsReq.docs.map((doc: any) => ({
      name: doc.name,
      official_domain: doc.official_domain,
      variations: Array.isArray(doc.variations) ? doc.variations : []
    }))

    // 4. Always Run Engine (On-the-fly analysis)
    const analysis = await analyzeUrl(url, dynamicWhitelist, brandTargets)

    // 5. Calculate Dynamic Trust Score
    let finalTrust = analysis.trustScore
    let finalStatus = analysis.riskLevel
    const dbFlags = existing.docs.length > 0 ? (existing.docs[0].flags as string[] || []) : []
    const combinedFlags = [...new Set([...analysis.flags, ...dbFlags])]

    if (existing.docs.length > 0) {
      const dbDoc = existing.docs[0]
      const dbScoreAnchor = dbDoc.status === 'SAFE' ? 95 : 
                            dbDoc.status === 'MALICIOUS' ? 10 : 
                            dbDoc.status === 'SUSPICIOUS' ? 40 : 50
      
      // Blend: 40% Engine, 60% DB Consensus
      if (analysis.trustScore < 50) {
         finalTrust = Math.min(analysis.trustScore, dbScoreAnchor)
      } else {
         finalTrust = Math.round((analysis.trustScore * 0.4) + (dbScoreAnchor * 0.6))
      }

      // Adjust based on report count
      if (dbDoc.status !== 'SAFE' && (dbDoc.reports_count || 0) > 0) {
         finalTrust -= Math.min(20, (dbDoc.reports_count || 0) * 2)
      }
    }

    // 6. Final Range Normalization
    finalTrust = Math.max(0, Math.min(100, finalTrust))
    
    if (finalTrust >= 90) finalStatus = 'SAFE'
    else if (finalTrust >= 50) finalStatus = 'SUSPICIOUS'
    else finalStatus = 'MALICIOUS'

    return { 
      result: {
        url: analysis.url,
        domain: analysis.domain,
        riskLevel: finalStatus,
        trustScore: finalTrust,
        flags: combinedFlags,
        details: existing.docs.length > 0 
          ? [...analysis.details, `Historical record found: ${existing.docs[0].status} (${existing.docs[0].reports_count} reports)`]
          : analysis.details,
        redirectChain: analysis.redirectChain
      } as CheckResult
    }
  } catch (error) {
    console.error('Error checking URL:', error)
    return { error: 'Failed to analyze URL. Please try again.' }
  }
}

export async function submitReportAction(prevState: any, formData: FormData) {
  const url = formData.get('url') as string
  const comment = formData.get('comment') as string
  const status = formData.get('status') as string // 'SAFE', 'MALICIOUS', etc.

  if (!url) {
    return { error: 'URL is required.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to submit a report.' }
  }

  try {
    const payload = await getPayload({ config })

    // 1. Find or Create URL
    let urlDoc
    const existing = await payload.find({
      collection: 'urls',
      where: {
        url: {
          equals: url,
        },
      },
    })

    if (existing.docs.length > 0) {
      urlDoc = existing.docs[0]
    } else {
      // Analyze and create if not exists
      const analysis = await analyzeUrl(url)
      
      // If user reports as SAFE, we trust them initially with a high score
      let initialTrust = analysis.trustScore
      let initialStatus = analysis.riskLevel

      // Override if user explicitly reports as SAFE and engine didn't find hard evidence (like whitelist or typosquat)
      // We accept the user's SAFE judgment only if the engine didn't flag it as MALICIOUS
      if (status === 'SAFE' && analysis.riskLevel !== 'MALICIOUS') {
        initialTrust = 100
        initialStatus = 'SAFE'
      } else if (status === 'MALICIOUS') {
        initialTrust = 0
        initialStatus = 'MALICIOUS'
      }

      urlDoc = await payload.create({
        collection: 'urls',
        data: {
          url: analysis.url,
          domain: analysis.domain,
          status: initialStatus as any,
          trust_score: initialTrust,
          flags: analysis.flags,
          reports_count: 0,
          redirect_chain: analysis.redirectChain,
        },
      })
    }

    // Determine Report Status (Auto-Reject Logic)
    let reportStatus = 'PENDING'
    
    // Auto-reject "SAFE" reports for known malicious sites
    if (status === 'SAFE') {
      const isKnownBad = urlDoc.status === 'MALICIOUS' || urlDoc.status === 'SUSPICIOUS'
      const hasBadFlags = Array.isArray(urlDoc.flags) && (urlDoc.flags.includes('typosquatting') || urlDoc.flags.includes('phishing'))
      
      if (isKnownBad || hasBadFlags) {
        reportStatus = 'REJECTED'
      }
    }

    // Determine Formatted Name
    const rawName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';
    const nameParts = rawName.trim().split(/\s+/);
    let reporterName = rawName;
    if (nameParts.length > 1) {
      reporterName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0].toUpperCase()}.`;
    }

    // 2. Create Report
    await payload.create({
      collection: 'reports',
      data: {
        url_id: urlDoc.id,
        reporter_id: user.id,
        reporter_name: reporterName,
        comment: reportStatus === 'REJECTED' ? `[Auto-Rejected] ${comment}` : comment,
        status: reportStatus as any, 
      },
    })

    // 3. Update Reports Count & Dynamic Trust Scoring
    // If multiple people report SAFE, it stays SAFE.
    // If people report MALICIOUS, score drops.
    await payload.update({
      collection: 'urls',
      id: urlDoc.id,
      data: {
        reports_count: (urlDoc.reports_count || 0) + 1,
      },
    })

    return { success: true, message: 'Report submitted successfully! Thank you for your contribution.' }
  } catch (error) {
    console.error('Error submitting report:', error)
    return { error: 'Failed to submit report. Please try again later.' }
  }
}