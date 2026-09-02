const RAW_RIDER_PHOTOS: readonly [name: string, slug: string][] = [
  ['Marc Marquez', 'L0F4WbbF'],
  ['Pedro Acosta', 'YaWdUVdE'],
  ['Marco Bezzecchi', 'qp7g53Ik'],
  ['Alex Marquez', 'WezEeZAR'],
  ['Jorge Martin', 'uL9DSaU6'],
  ['Fermin Aldeguer', '6NErto4j'],
  ['Fabio Di Giannantonio', 'VEmGm1Zi'],
  ['Enea Bastianini', '7pX3VTcG'],
  ['Diogo Moreira', 'i5riGt65'],
  ['Brad Binder', 'tRRDYvaD'],
  ['Jack Miller', 'M083EGxS'],
  ['Joan Mir', 'A9TKY6Q5'],
  ['Alex Rins', '6zfxJvst'],
  ['Luca Marini', 'S6m6LRHY'],
  ['Johann Zarco', 'y0R5f9H5'],
  ['Pol Espargaro', 'oZC0COL7'],
  ['Fabio Quartararo', 'L72keLEc'],
  ['Toprak Razgatlioglu', '5Zq5W4Wt'],
  ['Raul Fernandez', 'G8ukTN8w'],
  ['Franco Morbidelli', 'srwszjyQ'],
  ['Francesco Bagnaia', 'IfzOWPi2'],
  ['Lorenzo Savadori', 'DSC09678'],
]

/**
 * حروف اکسان‌دار (á, é, í, ó, ú, ñ...) را حذف می‌کند و به حروف کوچک
 * تبدیل می‌کند، چون API معمولاً نام را با اکسان برمی‌گرداند
 * (مثلاً "Álex Márquez") ولی این لیست دستی بدون اکسان نوشته شده.
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const RIDER_PHOTO_MAP = new Map<string, string>(
  RAW_RIDER_PHOTOS.map(([name, slug]) => [normalizeName(name), slug]),
)

/**
 * برای یک full_name واقعی که از API می‌آید، مسیر عکس محلی را برمی‌گرداند
 * یا اگر در لیست نبود، null (تا DriverAvatar به fallback حروف اول بیفتد).
 */
export function resolveRiderPhotoUrl(fullName: string): string | null {
  const slug = RIDER_PHOTO_MAP.get(normalizeName(fullName))
  return slug ? `/images/riders/${slug}.png` : null
}