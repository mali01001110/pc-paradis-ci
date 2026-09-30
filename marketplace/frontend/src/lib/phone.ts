/**
 * Normalize a CI phone number to E.164-ish (+225XXXXXXXXXX).
 * Passes through numbers that already start with '+'.
 */
export function normalizePhone(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  return `+225${digits.replace(/^0+/, '')}`
}
