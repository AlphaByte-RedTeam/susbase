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
  const urlSchema = z
    .url()
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must start with http:// or https://',
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

    const dynamicWhitelist = [...TARGET_WHITELIST, ...safeUrls.docs.map((doc) => doc.domain)]

    // 3. Fetch High Value Targets for Impersonation Check
    const brandTargetsReq = await payload.find({
      collection: 'high-value-targets',
      limit: 100,
    })
    const brandTargets: BrandTarget[] = brandTargetsReq.docs.map((doc: any) => ({
      name: doc.name,
      official_domain: doc.official_domain,
      variations: Array.isArray(doc.variations) ? doc.variations : [],
    }))

    // 4. Always Run Engine (On-the-fly analysis)
    const analysis = await analyzeUrl(url, dynamicWhitelist, brandTargets)

    // 5. Calculate Dynamic Trust Score
    let finalTrust = analysis.trustScore
    let finalStatus = analysis.riskLevel
    const dbFlags = existing.docs.length > 0 ? (existing.docs[0].flags as string[]) || [] : []
    const combinedFlags = [...new Set([...analysis.flags, ...dbFlags])]

    if (existing.docs.length > 0) {
      const dbDoc = existing.docs[0]
      // Base Score per Status
      let baseScore = 60 // UNKNOWN/SUSPICIOUS default
      if (dbDoc.status === 'SAFE') baseScore = 100
      else if (dbDoc.status === 'MALICIOUS') baseScore = 20

      // Crowd Decay: -1 point per report
      const crowdPenalty = (dbDoc.reports_count || 0) * 1

      const dbCalculatedScore = baseScore - crowdPenalty + (dbDoc.vote_score || 0)

      if (analysis.trustScore < 50) {
        finalTrust = Math.min(analysis.trustScore, dbCalculatedScore)
      } else {
        finalTrust = Math.min(analysis.trustScore, dbCalculatedScore)
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
        details:
          existing.docs.length > 0
            ? [
                ...analysis.details,
                `Historical record found: ${existing.docs[0].status} (${existing.docs[0].reports_count} reports)`,
              ]
            : analysis.details,
        redirectChain: analysis.redirectChain,
      } as CheckResult,
    }
  } catch (error) {
    console.error('Error checking URL:', error)
    return { error: 'Failed to analyze URL. Please try again.' }
  }
}

export async function submitReportAction(prevState: any, formData: FormData) {
  const url = formData.get('url') as string
  const comment = formData.get('comment') as string

  if (!url) {
    return { error: 'URL is required.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'You must be logged in to submit a report.' }
  }

  try {
    const payload = await getPayload({ config })
    const domain = new URL(url).hostname.toLowerCase()

    // Determine Formatted Name
    const rawName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Anonymous'
    const nameParts = rawName.trim().split(/\s+/)
    let reporterName = rawName
    if (nameParts.length > 1) {
      reporterName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0].toUpperCase()}.`
    }

    const reportStatus = 'PENDING'

    // 2. Create Report
    // We no longer link url_id here or update counts.
    // The Admin will "Accept" the report, triggering the hook to update/create the URL record.
    await payload.create({
      collection: 'reports',
      data: {
        submitted_url: url,
        submitted_domain: domain,
        reporter_id: user.id,
        reporter_name: reporterName,
        comment: comment,
        status: reportStatus as any,
      },
    })

    return { success: true, message: 'Report submitted for review. Thank you!' }
  } catch (error) {
    console.error('Error submitting report:', error)
    return { error: 'Failed to submit report. Please try again later.' }
  }
}
