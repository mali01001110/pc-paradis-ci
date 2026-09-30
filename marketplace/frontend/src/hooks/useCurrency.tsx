import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'

interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  format: (amountFcfa: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

function readStoredCurrency(): CurrencyCode {
  try {
    const stored = localStorage.getItem('currency')
    if (stored === 'EUR' || stored === 'USD') return stored
  } catch {
    // localStorage unavailable (privacy mode) — fall back to FCFA.
  }
  return 'FCFA'
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(readStoredCurrency)

  const setCurrency = (next: CurrencyCode) => {
    setCurrencyState(next)
    try {
      localStorage.setItem('currency', next)
    } catch {
      // ignore persistence failures
    }
  }

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      format: (amountFcfa: number) => formatCurrency(amountFcfa, currency),
    }),
    [currency]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) {
    throw new Error('useCurrency doit être utilisé dans un <CurrencyProvider>')
  }
  return ctx
}
