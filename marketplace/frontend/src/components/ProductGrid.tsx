import ProductCard from '@/components/ProductCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  skeletonCount?: number
  columns?: 2 | 3 | 4
  className?: string
}

const COLUMN_CLASSES: Record<2 | 3 | 4, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden h-full">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) {
  return (
    <div className={cn('grid gap-4 md:gap-6', COLUMN_CLASSES[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductGrid({ products, loading, skeletonCount = 6, columns = 3, className }: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton count={skeletonCount} columns={columns} />
  }

  return (
    <div className={cn('grid gap-4 md:gap-6', COLUMN_CLASSES[columns], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
