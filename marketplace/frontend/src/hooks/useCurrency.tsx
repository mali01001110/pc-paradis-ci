import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { formatCurrency } from '@/lib/currency'

interface CurrencyContextValue {
  currency: 'FCFA'
  setCurrency: () => void
  format: (amountFcfa: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      currency: 'FCFA' as const,
      setCurrency: () => {},
      format: (amountFcfa: number) => formatCurrency(amountFcfa, 'FCFA'),
    }),
    []
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
