import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Category } from '@/types/product'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, string> = {
  cpu: '🖥️',
  gpu: '🎮',
  ram: '⚡',
  storage: '💾',
  monitor: '🖥️',
  peripherals: '⌨️',
  case: '📦',
  psu: '🔌',
  cooling: '❄️',
  networking: '🌐',
  audio: '🔊',
  webcam: '📷',
  default: '📦',
}

export function catIcon(slug: string): string {
  return ICON_MAP[slug] ?? ICON_MAP.default
}

export interface FlatCategory {
  id: string
  name: string
  slug: string
  parentName: string
}

interface CategoryShowcaseProps {
  categories: FlatCategory[]
  loading?: boolean
  activeSlug?: string
  onSelect?: (slug: string) => void
  className?: string
}

export function flattenCategories(tree: Category[]): FlatCategory[] {
  return tree.flatMap((parent) =>
    (parent.children ?? []).length > 0
      ? parent.children!.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          parentName: parent.name,
        }))
      : [
          {
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            parentName: '',
          },
        ]
  )
}

export function CategoryShowcaseSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex flex-col items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

export function CategoryShowcase({ categories, loading, activeSlug, onSelect, className }: CategoryShowcaseProps) {
  if (loading) {
    return <CategoryShowcaseSkeleton />
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          to={`/?cat=${cat.slug}`}
          onClick={onSelect ? () => onSelect(cat.slug) : undefined}
          className={cn(
            'card p-4 flex flex-col items-center text-center hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-glow transition-all duration-200',
            activeSlug === cat.slug && 'border-primary-500 dark:border-primary-500'
          )}
        >
          <div className="text-2xl mb-2">{catIcon(cat.slug)}</div>
          <div className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">{cat.name}</div>
          <div className="text-xs text-gray-400">{cat.parentName}</div>
        </Link>
      ))}
    </div>
  )
}

export function CategoryShowcaseFooter({ visibleCount }: { visibleCount: number }) {
  return (
    <div className="mt-6 text-center">
      <Link
        to="/categories"
        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 inline-flex items-center gap-1"
      >
        Toutes les catégories ({visibleCount})
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
