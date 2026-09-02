
interface TeamColorRule {
  keywords: string[]
  color: string
  confidence: 'confirmed' | 'estimated'
}

// ترتیب مهم است: قوانین خاص‌تر باید قبل از قوانین عمومی‌تر بیایند.
const TEAM_COLOR_RULES: TeamColorRule[] = [
  { keywords: ['vr46'], color: 'FFD700', confidence: 'confirmed' },
  { keywords: ['gresini'], color: '00AEEF', confidence: 'confirmed' },
  { keywords: ['ducati lenovo', 'ducati factory'], color: 'CC0000', confidence: 'confirmed' },
  { keywords: ['tech3'], color: 'FF8C1A', confidence: 'estimated' },
  { keywords: ['ktm'], color: 'FF6600', confidence: 'confirmed' },
  { keywords: ['trackhouse'], color: '1B1B1B', confidence: 'estimated' },
  { keywords: ['aprilia'], color: '1B1B1B', confidence: 'confirmed' },
  { keywords: ['pramac'], color: '512DA8', confidence: 'estimated' },
  { keywords: ['lcr'], color: '00A651', confidence: 'estimated' },
  { keywords: ['honda'], color: 'CC0000', confidence: 'confirmed' },
  { keywords: ['monster energy yamaha', 'yamaha motogp', 'yamaha factory', 'yamaha'], color: '0033A0', confidence: 'confirmed' },
]

function normalize(name: string): string {
  return name.toLowerCase().trim()
}

export function resolveTeamColor(teamName: string): string {
  const normalized = normalize(teamName)
  const match = TEAM_COLOR_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  )
  return match?.color ?? '666666'
}