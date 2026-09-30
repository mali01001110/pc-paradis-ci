import { useCurrency } from '@/hooks/useCurrency'
import { CURRENCY_RATES_TO_FCFA, type CurrencyCode } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface PriceProps {
  value: number | string
  /** Currency of the given value (defaults to FCFA). */
  currency?: string
  /** Precomputed FCFA amount from the API (preferred when available). */
  fcfa?: number
  bold?: boolean
  className?: string
}

export function Price({ value, currency = 'FCFA', fcfa, bold = true, className }: PriceProps) {
  const { format } = useCurrency()

  const amountFcfa =
    fcfa ??
    (() => {
      const num = typeof value === 'string' ? Number(value) : value
      if (!Number.isFinite(num)) return NaN
      const rate = CURRENCY_RATES_TO_FCFA[(currency as CurrencyCode) ?? 'FCFA'] ?? 1
      return num * rate
    })()

  if (!Number.isFinite(amountFcfa)) {
    return <span className={cn(bold ? 'font-bold' : 'font-normal', className)}>{String(value)}</span>
  }

  return (
    <span className={cn(bold ? 'font-bold' : 'font-normal', className)}>
      {format(amountFcfa)}
    </span>
  )
}
