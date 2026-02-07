import { levenshteinDistance } from './levenshtein'
import { TARGET_WHITELIST, SUSPICIOUS_KEYWORDS, HIGH_RISK_TLDS, KNOWN_BLOCK_PAGES, BLOCK_PAGE_KEYWORDS } from './data'
import type { CheckResult, RiskLevel, BrandTarget } from './types'
import { getRedirectChain } from './redirects'

export const analyzeUrl = async (
  inputUrl: string, 
  customWhitelist: string[] = [], 
  brandTargets: BrandTarget[] = []
): Promise<CheckResult> => {
  let url = inputUrl.trim().toLowerCase()
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }

  // 0. Detect Redirection Chain
  const redirectChain = await getRedirectChain(url)
  const finalUrl = redirectChain[redirectChain.length - 1]

  // Use the final URL for analysis
  let domain = ''
  try {
    const urlObj = new URL(finalUrl)
    domain = urlObj.hostname
  } catch (e) {
    return {
      url: inputUrl,
      domain: '',
      riskLevel: 'UNKNOWN',
      trustScore: 0,
      flags: ['invalid_url'],
      details: ['The provided text does not appear to be a valid URL.'],
      redirectChain: [],
    }
  }

  // Remove www. for analysis
  const cleanDomain = domain.replace(/^www\./, '')

  const flags: string[] = []
  const details: string[] = []
  let riskLevel: RiskLevel = 'SAFE' // Default assumption, degrade as we find issues
  let trustScore = 100

  // 0.5. Check Page Content for Block Indicators (Liveness / Block Check)
  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), 4000) // 4s timeout
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'SusBase-Bot/1.0' },
      signal: controller.signal
    })
    clearTimeout(id)
    
    // Check if the FINAL URL itself matches known block domains
    if (KNOWN_BLOCK_PAGES.some(block => response.url.toLowerCase().includes(block))) {
       riskLevel = 'SUSPICIOUS'
       trustScore -= 50
       flags.push('blocked_by_isp')
       details.push('The site redirects to a known ISP block page.')
    } else {
       // Check Content Body
       const text = await response.text()
       const lowerText = text.toLowerCase()
       if (BLOCK_PAGE_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
          riskLevel = 'SUSPICIOUS'
          trustScore -= 50
          flags.push('blocked_content_detected')
          details.push('The site content matches a known ISP block page.')
       }
    }
  } catch (e) {
    // Flag connection errors (Privacy errors, SSL issues, or down)
    trustScore -= 15
    flags.push('connection_unstable')
    details.push('Could not establish a secure connection to the site (SSL or Timeout).')
  }

  // Check for Block Pages in chain (Network Level)
  const isBlocked = redirectChain.some(link => {
    return KNOWN_BLOCK_PAGES.some(block => link.toLowerCase().includes(block))
  })

  if (isBlocked && !flags.includes('blocked_by_isp')) {
    riskLevel = 'SUSPICIOUS'
    trustScore -= 50
    flags.push('blocked_by_isp')
    details.push('This URL redirects to a known ISP block page (e.g. Internet Positif).')
  }

  // Add redirect flag if chain is long
  if (redirectChain.length > 1) {
    flags.push('redirects_detected')
    details.push(`Redirects to: ${domain}`)
  }

  // Combine static and custom whitelist
  const effectiveWhitelist = [...new Set([...TARGET_WHITELIST, ...customWhitelist])]

  // 1. Whitelist Check (Exact Match)
  if (effectiveWhitelist.includes(cleanDomain) || effectiveWhitelist.some(d => cleanDomain.endsWith('.' + d))) {
    return {
      url: finalUrl, // Return the resolved URL
      domain,
      riskLevel: 'SAFE',
      trustScore: 100,
      flags: ['whitelisted_domain', ...flags],
      details: ['This domain is in our verified safe list.', ...details],
      redirectChain,
    }
  }

  // 2. Typosquatting Check
  let isTyposquat = false
  for (const target of effectiveWhitelist) {
    const distance = levenshteinDistance(cleanDomain, target)
    if (distance > 0 && distance <= 2 && Math.abs(cleanDomain.length - target.length) <= 2) {
      isTyposquat = true
      riskLevel = 'MALICIOUS' 
      trustScore -= 60
      flags.push('typosquatting')
      details.push(`Highly suspicious similarity to verified domain: ${target}`)
      break 
    }
  }

  // 3. Brand Impersonation Check (DB Driven)
  if (!isTyposquat) {
    for (const brand of brandTargets) {
      // Check if domain contains brand name (e.g. "bca" in "klikbca-mobile.com")
      // Ensure we don't flag the official domain itself
      const brandSlug = brand.name.toLowerCase().replace(/\s+/g, '')
      const officialClean = brand.official_domain.replace(/^www\./, '')
      
      if (cleanDomain.includes(brandSlug) && cleanDomain !== officialClean && !cleanDomain.endsWith('.' + officialClean)) {
         // Check variations
         const isVariation = brand.variations.some(v => cleanDomain === v || cleanDomain.endsWith('.' + v))
         if (!isVariation) {
            riskLevel = 'SUSPICIOUS'
            trustScore -= 40
            flags.push('impersonation_risk')
            details.push(`Contains protected brand name "${brand.name}" but is not verified.`)
            break
         }
      }
    }
  }

  // 4. Keyword Heuristics
  let hasKeywords = false
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (finalUrl.toLowerCase().includes(keyword)) {
      hasKeywords = true
      trustScore -= 15
      flags.push('suspicious_keyword')
      details.push(`Contains social engineering keyword: "${keyword}"`)
    }
  }

  // 5. TLD Check
  let hasRiskyTLD = false
  for (const tld of HIGH_RISK_TLDS) {
    if (domain.endsWith(tld)) {
      hasRiskyTLD = true
      trustScore -= 20
      flags.push('high_risk_tld')
      details.push(`Uses a Top-Level Domain often associated with spam: ${tld}`)
    }
  }

  // Combined Heuristics
  if (isTyposquat) {
    riskLevel = 'MALICIOUS'
    trustScore = Math.min(trustScore, 10) // Cap at 10 for typosquats
  } else if (hasKeywords && hasRiskyTLD) {
    riskLevel = 'SUSPICIOUS' // Combination is bad
    trustScore = Math.min(trustScore, 40)
  } else if (hasKeywords || hasRiskyTLD) {
    if (riskLevel !== 'MALICIOUS') {
       riskLevel = 'SUSPICIOUS'
    }
  }

  // Cap Trust Score
  trustScore = Math.max(0, Math.min(100, trustScore))

  // Final normalization
  if (trustScore >= 90) riskLevel = 'SAFE'
  else if (trustScore >= 50) riskLevel = 'SUSPICIOUS'
  else riskLevel = 'MALICIOUS'

  return {
    url: finalUrl,
    domain,
    riskLevel,
    trustScore,
    flags,
    details,
    redirectChain,
  }
}

