import { createContext, useContext, type ReactNode } from 'react'
import fr, { type TranslationKey } from './fr'

export type Lang = 'fr'

function lookup(dict: unknown, path: string): string | undefined {
  let node: unknown = dict
  for (const part of path.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

interface I18nContextValue {
  lang: Lang
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const contextValue: I18nContextValue = {
  lang: 'fr',
  t: (key: string) => lookup(fr, key) ?? key,
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useT doit être utilisé dans un <I18nProvider>')
  }
  return ctx
}

export function useLang() {
  return { lang: 'fr' as Lang }
}

export type { TranslationKey }
