'use server'

import { analyzeUrl } from '@/lib/engine'
import type { CheckResult, BrandTarget } from '@/lib/engine/types'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createClient } from '@/lib/supabase/server'
import { TARGET_WHITELIST } from '@/lib/engine/data'
import { z } from 'zod'

export async function checkUrlAction(prevState: any, formData: FormData) {
  const url = formData.get('url') as string
  
  // Zod Validation
  const urlSchema = z.string().url().refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
    message: "URL must start with http:// or https://"
  })

  const validation = urlSchema.safeParse(url)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  try {
    const payload = await getPayload({ config })
    
    // Normalize: Extract domain strictly
    let domain = ''
    try {
      const urlObj = new URL(url)
      domain = urlObj.hostname.toLowerCase()
    } catch (e) {
      return { error: 'Invalid URL format' }
    }

    // 1. Check DB by DOMAIN (Protocol agnostic)
    const existing = await payload.find({
      collection: 'urls',
      where: {
        domain: {
          equals: domain,
        },
      },
    })

    // 2. Fetch High Value Target info for flags
    const hvtCheck = await payload.find({
      collection: 'high-value-targets',
      where: {
        official_domain: {
          equals: domain,
        },
      },
    })
    
    // Also check variations for HVT
    let isHvt = hvtCheck.docs.length > 0
    if (!isHvt) {
      const hvtVariations = await payload.find({
        collection: 'high-value-targets',
        where: {
          variations: {
            contains: domain,
          },
        },
      })
      isHvt = hvtVariations.docs.length > 0
    }

    // 3. If it exists in DB, Return DB Data Immediately (Definitive source)
    if (existing.docs.length > 0) {
      const dbDoc = existing.docs[0]
      return { 
        result: {
          url: dbDoc.url, // Original submission URL
          domain: dbDoc.domain,
          riskLevel: dbDoc.status,
          trustScore: dbDoc.trust_score || 0,
          flags: dbDoc.flags as string[] || [],
          details: [`Record found in database. Consensus: ${dbDoc.status}`],
          redirectChain: dbDoc.redirect_chain as string[] || [],
          isHighTarget: isHvt,
          isVerified: dbDoc.status === 'SAFE' || isHvt
        } as CheckResult
      }
    }

    // 4. For new URLs, perform Dynamic Whitelist & High Value Targets check
    const safeUrls = await payload.find({
      collection: 'urls',
      where: { status: { equals: 'SAFE' } },
      limit: 1000, 
    })
    
    const dynamicWhitelist = [
      ...TARGET_WHITELIST,
      ...safeUrls.docs.map(doc => doc.domain)
    ]

    const brandTargetsReq = await payload.find({
      collection: 'high-value-targets',
      limit: 100,
    })
    const brandTargets: BrandTarget[] = brandTargetsReq.docs.map((doc: any) => ({
      name: doc.name,
      official_domain: doc.official_domain,
      variations: Array.isArray(doc.variations) ? doc.variations : []
    }))

    // 5. Run Engine Analysis
    const analysis = await analyzeUrl(url, dynamicWhitelist, brandTargets)

    // 6. Final Range Normalization for Engine Result
    let finalTrust = analysis.trustScore
    let finalStatus = analysis.riskLevel
    
    finalTrust = Math.max(0, Math.min(100, finalTrust))
    if (finalTrust >= 90) finalStatus = 'SAFE'
    else if (finalTrust >= 50) finalStatus = 'SUSPICIOUS'
    else finalStatus = 'MALICIOUS'

    return { 
      result: {
        ...analysis,
        riskLevel: finalStatus,
        trustScore: finalTrust,
        isHighTarget: isHvt,
        isVerified: finalStatus === 'SAFE' || isHvt
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
  const intent = formData.get('status') as string
  const isHighTarget = formData.get('is_high_target') === 'true'

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
    // We store the intent in the comment for the admin/hook to see
    const finalComment = `[Intent: ${intent}] ${comment}`

    await payload.create({
      collection: 'reports',
      data: {
        submitted_url: url,
        submitted_domain: domain,
        reporter_id: user.id,
        reporter_name: reporterName,
        is_high_target: isHighTarget,
        comment: finalComment,
        status: reportStatus as any,
      },
    })

    return { success: true, message: 'Report submitted for review. Thank you!' }
  } catch (error) {
    console.error('Error submitting report:', error)
    return { error: 'Failed to submit report. Please try again later.' }
  }
}
