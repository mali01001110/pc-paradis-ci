export type CurrencyCode = 'FCFA' | 'EUR' | 'USD'

export const CURRENCY_RATES_TO_FCFA: Record<CurrencyCode, number> = {
  FCFA: 1,
  EUR: 655.957,
  USD: 590,
}

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  FCFA: 'FCFA',
  EUR: 'EUR (€)',
  USD: 'USD ($)',
}

export const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  FCFA: 'fr-FR',
  EUR: 'fr-FR',
  USD: 'en-US',
}

export function convertFromFcfa(amountFcfa: number, target: CurrencyCode): number {
  const rate = CURRENCY_RATES_TO_FCFA[target] ?? 1
  return amountFcfa / rate
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'FCFA'): string {
  const converted = currency === 'FCFA' ? amount : convertFromFcfa(amount, currency)
  const decimals = currency === 'FCFA' ? 0 : 2
  return `${converted.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${currency}`
}
