'use server'

import { analyzeUrl } from '@/lib/engine'
import { CheckResult } from '@/lib/engine/types'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { createClient } from '@/lib/supabase/server'
import { TARGET_WHITELIST } from '@/lib/engine/data'

export async function checkUrlAction(prevState: any, formData: FormData) {
  const url = formData.get('url') as string
  if (!url) {
    return { error: 'Please enter a URL' }
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

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      return { 
        result: {
          url: doc.url,
          domain: doc.domain,
          riskLevel: doc.status,
          trustScore: doc.trust_score,
          flags: Array.isArray(doc.flags) ? doc.flags : [],
          details: ['Retrieved from our database.'],
        } as CheckResult
      }
    }

    // 2. Fetch Dynamic Whitelist (SAFE URLs from DB)
    const safeUrls = await payload.find({
      collection: 'urls',
      where: {
        status: {
          equals: 'SAFE',
        },
      },
      limit: 1000, // Fetch a reasonable amount for the engine
    })
    
    // Combine static and dynamic whitelist
    const dynamicWhitelist = [
      ...TARGET_WHITELIST,
      ...safeUrls.docs.map(doc => doc.domain)
    ]

    // 3. Run Engine (passing dynamic whitelist via some mechanism, or modifying engine to accept it)
    // Since analyzeUrl imports TARGET_WHITELIST directly, we need to modify analyzeUrl to accept an optional whitelist override.
    // For now, let's assume analyzeUrl can take a second argument or we just modify the logic here if we were in the same file.
    // We need to update analyzeUrl signature.

    const result = await analyzeUrl(url, dynamicWhitelist)

    // 4. Do not save to DB (On-the-fly check only)
    
    return { result }
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

    // 2. Create Report
    await payload.create({
      collection: 'reports',
      data: {
        url_id: urlDoc.id,
        reporter_id: user.id,
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