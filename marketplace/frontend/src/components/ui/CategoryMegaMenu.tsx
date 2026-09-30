import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useT } from '@/i18n'
import { headerMenu } from '@/data/headerMenu'
import { cn } from '@/lib/utils'

interface CategoryMegaMenuProps {
  isMobile?: boolean
}

export default function CategoryMegaMenu({ isMobile = false }: CategoryMegaMenuProps) {
  const { t } = useT()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isMobile) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenIndex(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile])

  if (isMobile) {
    return (
      <div>
        {headerMenu.map((btn, idx) => (
          <div key={btn.slug} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <button
              onClick={() => setMobileExpanded(mobileExpanded === idx ? null : idx)}
              className="w-full flex items-center justify-between py-3 text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t(btn.labelKey)}
              {mobileExpanded === idx ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>
            {mobileExpanded === idx && (
              <div className="pb-3 grid grid-cols-2 gap-1">
                {btn.items.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/catalogue?cat=${item.slug}`}
                    onClick={() => setMobileExpanded(null)}
                    className="block py-2 px-3 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <nav className="hidden md:flex items-center gap-1">
        {headerMenu.map((btn, idx) => (
          <div
            key={btn.slug}
            className="relative"
            onMouseEnter={() => setOpenIndex(idx)}
            onMouseLeave={() => setOpenIndex(null)}
          >
            <button
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                openIndex === idx
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-950/50 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-primary-400'
              )}
            >
              {t(btn.labelKey)}
              <ChevronDown
                size={14}
                className={cn('transition-transform', openIndex === idx ? 'rotate-180' : '')}
              />
            </button>

            {openIndex === idx && (
              <div className="absolute left-0 top-full pt-2 z-50">
                <div className="bg-white dark:bg-[#1a1030] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 w-[640px] p-5">
                  <div className="grid grid-cols-3 gap-4">
                    {btn.items.map((item) => (
                      <Link
                        key={item.slug}
                        to={`/catalogue?cat=${item.slug}`}
                        onClick={() => setOpenIndex(null)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-200 dark:bg-primary-800 group-hover:bg-primary-500 transition-colors flex-shrink-0" />
                        {t(item.labelKey)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}