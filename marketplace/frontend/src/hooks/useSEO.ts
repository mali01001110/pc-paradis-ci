import { useEffect } from 'react'

export interface SeoInput {
  title: string
  description?: string
  url?: string
  image?: string | null
  jsonLd?: Record<string, unknown> | null
}

function ensureMeta(kind: 'name' | 'property', key: string): HTMLMetaElement {
  const selector =
    kind === 'name' ? `meta[name="${key}"]` : `meta[property="${key}"]`
  let meta = document.head.querySelector<HTMLMetaElement>(selector)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(kind, key)
    document.head.appendChild(meta)
  }
  return meta
}

export function useSEO({ title, description, url, image, jsonLd }: SeoInput) {
  useEffect(() => {
    document.title = title

    if (description) {
      ensureMeta('name', 'description').setAttribute('content', description)
      ensureMeta('property', 'og:description').setAttribute('content', description)
    }
    ensureMeta('property', 'og:title').setAttribute('content', title)
    ensureMeta('property', 'og:type').setAttribute('content', 'website')
    if (url) {
      ensureMeta('property', 'og:url').setAttribute('content', url)
      const canonical = document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]'
      )
      if (canonical) canonical.setAttribute('href', url)
    }

    let script: HTMLScriptElement | null = null
    if (jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = 'json-ld-page'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.getElementById('json-ld-page')?.remove()
    }
  }, [title, description, url, image, jsonLd])
}
