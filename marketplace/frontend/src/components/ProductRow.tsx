import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ProductRowProps {
  title: string
  viewAllTo?: string
  children: ReactNode
  className?: string
}

export function ProductRow({ title, viewAllTo, children, className }: ProductRowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 2,
    dragFree: true,
    containScroll: 'trimSnaps',
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllTo && (
            <Link
              to={viewAllTo}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 mr-2"
            >
              Voir tout
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label={`Défiler ${title} vers la gauche`}
            className="rounded-full border border-gray-200 dark:border-gray-700"
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label={`Défiler ${title} vers la droite`}
            className="rounded-full border border-gray-200 dark:border-gray-700"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      <div ref={emblaRef} className="overflow-hidden -mx-2">
        <div className="flex gap-4 px-2">{children}</div>
      </div>
    </section>
  )
}

export function ProductRowSlide({ children }: { children: ReactNode }) {
  return <div className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] xl:flex-[0_0_23%] min-w-0">{children}</div>
}
