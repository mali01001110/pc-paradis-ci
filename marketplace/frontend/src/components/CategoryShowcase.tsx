import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Armchair,
  ArrowRight,
  BatteryCharging,
  Cable,
  CarFront,
  CircuitBoard,
  Computer,
  Cpu,
  Droplets,
  Fan,
  Gamepad2,
  HardDrive,
  Headphones,
  Joystick,
  Keyboard,
  Laptop,
  Lightbulb,
  MemoryStick,
  Microchip,
  MicVocal,
  Monitor,
  MonitorCog,
  Mouse,
  MousePointer2,
  Package,
  PackageOpen,
  PcCase,
  Snowflake,
  Table2,
  Usb,
  Webcam,
  type LucideIcon,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Category } from '@/types/product'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  cpu: Cpu,
  gpu: MonitorCog,
  'carte-mere': CircuitBoard,
  ram: MemoryStick,
  stockage: HardDrive,
  alimentation: BatteryCharging,
  boitier: PcCase,
  ventilateurs: Fan,
  watercooling: Droplets,
  'refroidissement-cpu': Snowflake,
  ecrans: Monitor,
  claviers: Keyboard,
  souris: Mouse,
  casques: Headphones,
  manettes: Gamepad2,
  volants: CarFront,
  joysticks: Joystick,
  microphones: MicVocal,
  webcams: Webcam,
  cables: Cable,
  'cables-rgb': Lightbulb,
  adaptateurs: Usb,
  'accessoires-pc': Laptop,
  'tables-gaming': Table2,
  'chaises-gaming': Armchair,
  'tapis-de-souris': MousePointer2,
  'composants-internes': Microchip,
  'composants-externes': Computer,
  accessoires: PackageOpen,
  storage: HardDrive,
  monitor: Monitor,
  peripherals: Keyboard,
  case: PcCase,
  psu: BatteryCharging,
  cooling: Snowflake,
  networking: Usb,
  audio: Headphones,
  webcam: Webcam,
}

export function catIcon(slug: string): LucideIcon {
  return ICON_MAP[slug] ?? Package
}

export interface FlatCategory {
  id: string
  name: string
  slug: string
  parentName: string
}

type CategoryShowcaseVariant = 'card' | 'icon'

interface CategoryShowcaseProps {
  categories: FlatCategory[]
  loading?: boolean
  activeSlug?: string
  onSelect?: (slug: string) => void
  className?: string
  variant?: CategoryShowcaseVariant
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

export function CategoryShowcaseSkeleton({
  count = 12,
  variant = 'card',
}: {
  count?: number
  variant?: CategoryShowcaseVariant
}) {
  if (variant === 'icon') {
    return (
      <div className="flex flex-wrap justify-center gap-3" aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="size-14 rounded-xl" />
        ))}
      </div>
    )
  }

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

export function CategoryShowcase({
  categories,
  loading,
  activeSlug,
  onSelect,
  className,
  variant = 'card',
}: CategoryShowcaseProps) {
  if (loading) {
    return <CategoryShowcaseSkeleton variant={variant} />
  }

  if (variant === 'icon') {
    return (
      <nav aria-label="Sous-catégories de composants internes" className={cn('flex flex-wrap justify-center gap-x-4 gap-y-6', className)}>
        {categories.map((cat) => (
          <CategoryIcon key={cat.slug} cat={cat} activeSlug={activeSlug} onSelect={onSelect} />
        ))}
      </nav>
    )
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {categories.map((cat) => (
        <CategoryCard key={cat.slug} cat={cat} activeSlug={activeSlug} onSelect={onSelect} />
      ))}
    </div>
  )
}

function CategoryCard({ cat, activeSlug, onSelect }: { cat: FlatCategory; activeSlug?: string; onSelect?: (slug: string) => void }) {
  const Icon = useMemo(() => catIcon(cat.slug), [cat.slug])
  return (
    <Link
      to={`/products?cat=${cat.slug}`}
      onClick={onSelect ? () => onSelect(cat.slug) : undefined}
      className={cn(
        'card p-4 flex flex-col items-center text-center hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-glow transition-all duration-200',
        activeSlug === cat.slug && 'border-primary-500 dark:border-primary-500'
      )}
    >
      <div className="mb-2 text-primary-500">
        <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">{cat.name}</div>
      <div className="text-xs text-gray-400">{cat.parentName}</div>
    </Link>
  )
}

function CategoryIcon({ cat, activeSlug, onSelect }: { cat: FlatCategory; activeSlug?: string; onSelect?: (slug: string) => void }) {
  const Icon = useMemo(() => catIcon(cat.slug), [cat.slug])
  const isActive = activeSlug === cat.slug
  return (
    <Link
      to={`/products?cat=${cat.slug}`}
      onClick={onSelect ? () => onSelect(cat.slug) : undefined}
      aria-label={cat.name}
      aria-current={isActive ? 'page' : undefined}
      title={cat.name}
      className={cn(
        'card min-w-20 h-auto flex flex-col items-center justify-center gap-2 text-primary-500 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-glow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        isActive && 'border-primary-500 dark:border-primary-500'
      )}
    >
      <Icon size={32} strokeWidth={1.75} aria-hidden="true" />
      <span className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">{cat.name}</span>
    </Link>
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
