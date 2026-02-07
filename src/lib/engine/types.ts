export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN'

export interface CheckResult {
  url: string
  domain: string
  riskLevel: RiskLevel
  trustScore: number // 0 to 100, where 100 is perfectly safe
  flags: string[]
  details: string[]
}
