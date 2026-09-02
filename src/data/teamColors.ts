
// نگاشت نام تیم -> رنگ لیوری فصل ۲۰۲۶.
// منبع کیفی رنگ‌ها: https://www.the-race.com/motogp/every-motogp-2026-livery-revealed-so-far/
// هرجا سطح اطمینان پایین بود (چون آن منبع فقط توصیف کیفی داد، نه کد رنگ دقیق)
// با کامنت "تخمینی" مشخص شده — اگر عکس واقعی موتور را داری، دقیق‌ترش کن.

interface TeamColorRule {
  keywords: string[] // اگر هرکدام از این کلیدواژه‌ها در نام تیم (case-insensitive) باشد، این رنگ اعمال می‌شود
  color: string
  confidence: 'confirmed' | 'estimated'
}

// ترتیب مهم است: قوانین خاص‌تر (مثل Tech3) باید قبل از قوانین عمومی‌تر (KTM) بیایند.
const TEAM_COLOR_RULES: TeamColorRule[] = [
  { keywords: ['vr46'], color: 'FFD700', confidence: 'confirmed' }, // "VR46 was always yellow and black"
  { keywords: ['gresini'], color: '00AEEF', confidence: 'confirmed' }, // آبی آسمانی سنتی برند Gresini
  { keywords: ['ducati lenovo', 'ducati factory'], color: 'CC0000', confidence: 'confirmed' }, // قرمز فابریک Ducati
  { keywords: ['tech3'], color: 'FF8C1A', confidence: 'estimated' }, // نارنجی KTM با شید متفاوت برای تفکیک از فکتوری
  { keywords: ['ktm'], color: 'FF6600', confidence: 'confirmed' }, // نارنجی سیگنیچر KTM
  { keywords: ['trackhouse'], color: '1B1B1B', confidence: 'estimated' }, // "more black on the bike" طبق گزارش
  { keywords: ['aprilia'], color: '1B1B1B', confidence: 'confirmed' }, // بدنه‌ی مشکی سنتی Aprilia RS-GP
  { keywords: ['pramac'], color: '512DA8', confidence: 'estimated' }, // بنفش/آبی سنتی Pramac — بدون سمپل تصویری تأیید نشده
  { keywords: ['monster energy yamaha', 'yamaha motogp'], color: '0033A0', confidence: 'confirmed' }, // آبی سیگنیچر Yamaha
  { keywords: ['lcr'], color: '00A651', confidence: 'estimated' }, // سبز برند Castrol (لیوری زارکو) — موریرا لیوری متفاوت "Pro Honda" دارد
  { keywords: ['honda'], color: 'CC0000', confidence: 'confirmed' }, // قرمز خانگی Honda HRC
]

function normalize(name: string): string {
  return name.toLowerCase().trim()
}

/**
 * برای یک نام تیم واقعی که از API می‌آید (مثلاً "Ducati Lenovo Team" یا
 * "BK8 Gresini Racing MotoGP")، نزدیک‌ترین رنگ لیوری را پیدا می‌کند.
 * اگر هیچ کلیدواژه‌ای مچ نشد، fallback خاکستری قبلی برمی‌گردد.
 */
export function resolveTeamColor(teamName: string): string {
  const normalized = normalize(teamName)
  const match = TEAM_COLOR_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  )
  return match?.color ?? '666666'
}