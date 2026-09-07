const MONTHS_EN = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
]

/**
 * Внутренний формат дат — DD.MM.YYYY. Парсим в компоненты.
 * Возвращает null, если строка не разбирается.
 */
export function parseInternalDate(s: string): { d: number; m: number; y: number } | null {
  const m = s.trim().match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/)
  if (!m) return null
  const d = Number(m[1])
  const mo = Number(m[2])
  const y = Number(m[3])
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null
  return { d, m: mo, y }
}

/** DD.MM.YYYY → "18 MAR 2002" (DD MON YYYY, англ. месяц капсом) для XLSX. */
export function toExcelDate(s: string): string {
  const p = parseInternalDate(s)
  if (!p) return s.trim().toUpperCase()
  const dd = String(p.d).padStart(2, '0')
  return `${dd} ${MONTHS_EN[p.m - 1]} ${p.y}`
}

/** Верхний регистр с сохранением исходных пробелов/дефисов (для имён, мест). */
export function caps(s: string): string {
  return s.trim().toUpperCase()
}

/** Текущая дата в формате YYYY-MM-DD (локальная зона). */
export function todayISO(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "2026-09-07" → "7 September 2026" для заголовков истории. */
export function humanDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const full = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return `${d} ${full[m - 1]} ${y}`
}

export function humanTime(epochMs: number): string {
  const dt = new Date(epochMs)
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}
