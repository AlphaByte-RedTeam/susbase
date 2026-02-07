import { levenshteinDistance } from './levenshtein'
import { TARGET_WHITELIST, SUSPICIOUS_KEYWORDS, HIGH_RISK_TLDS } from './data'
import { CheckResult, RiskLevel } from './types'

export const analyzeUrl = async (inputUrl: string, customWhitelist: string[] = []): Promise<CheckResult> => {
  let url = inputUrl
  if (!url.startsWith('http')) {
    url = 'https://' + url
  }

  let domain = ''
  try {
    const urlObj = new URL(url)
    domain = urlObj.hostname.toLowerCase()
  } catch (e) {
    return {
      url: inputUrl,
      domain: '',
      riskLevel: 'UNKNOWN',
      trustScore: 0,
      flags: ['invalid_url'],
      details: ['The provided text does not appear to be a valid URL.'],
    }
  }

  // Remove www. for analysis
  const cleanDomain = domain.replace(/^www\./, '')

  const flags: string[] = []
  const details: string[] = []
  let riskLevel: RiskLevel = 'SAFE' // Default assumption, degrade as we find issues
  let trustScore = 100

  // Combine static and custom whitelist
  const effectiveWhitelist = [...new Set([...TARGET_WHITELIST, ...customWhitelist])]

  // 1. Whitelist Check (Exact Match)
  if (effectiveWhitelist.includes(cleanDomain) || effectiveWhitelist.some(d => cleanDomain.endsWith('.' + d))) {
    return {
      url,
      domain,
      riskLevel: 'SAFE',
      trustScore: 100,
      flags: ['whitelisted_domain'],
      details: ['This domain is in our verified safe list.'],
    }
  }

  // 2. Typosquatting Check
  let isTyposquat = false
  for (const target of effectiveWhitelist) {
    const distance = levenshteinDistance(cleanDomain, target)
    // If distance is small (1-2) but not 0, and length is similar
    if (distance > 0 && distance <= 2 && Math.abs(cleanDomain.length - target.length) <= 2) {
      isTyposquat = true
      riskLevel = 'MALICIOUS' // Strong indicator
      trustScore -= 60
      flags.push('typosquatting')
      details.push(`Highly suspicious similarity to verified domain: ${target}`)
      break // Found a match, stop looking
    }
  }

  // 3. Keyword Heuristics
  let hasKeywords = false
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (url.toLowerCase().includes(keyword)) {
      hasKeywords = true
      trustScore -= 15
      flags.push('suspicious_keyword')
      details.push(`Contains social engineering keyword: "${keyword}"`)
    }
  }

  // 4. TLD Check
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
    // Just one factor might be okay, but warrants caution
    if (riskLevel !== 'MALICIOUS') {
       riskLevel = 'SUSPICIOUS'
    }
  }

  // Cap Trust Score
  trustScore = Math.max(0, Math.min(100, trustScore))

  // Final normalization
  if (trustScore >= 90) riskLevel = 'SAFE'
  else if (trustScore >= 60) riskLevel = 'UNKNOWN' // Grey area
  else if (trustScore >= 30) riskLevel = 'SUSPICIOUS'
  else riskLevel = 'MALICIOUS'

  return {
    url,
    domain,
    riskLevel,
    trustScore,
    flags,
    details,
  }
}
