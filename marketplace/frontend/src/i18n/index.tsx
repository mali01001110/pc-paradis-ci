import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import fr, { type TranslationKey } from './fr'
import en from './en'

export type Lang = 'fr' | 'en'

const DICTIONARIES = { fr, en } as const
export type LangCode = keyof typeof DICTIONARIES

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
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('lang')
      if (stored === 'fr' || stored === 'en') return stored
    } catch {
      // ignore
    }
    return 'fr'
  })

  const setLang = (next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem('lang', next)
    } catch {
      // ignore persistence failures
    }
  }

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key: string) => lookup(DICTIONARIES[lang], key) ?? lookup(DICTIONARIES.fr, key) ?? key,
    }),
    [lang]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useT doit être utilisé dans un <I18nProvider>')
  }
  return ctx
}

export function useLang() {
  const { lang, setLang } = useT()
  return { lang, setLang }
}

export type { TranslationKey }
