import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: { id: string; image: string }[]
  alt?: string
  className?: string
}

export function ImageGallery({ images, alt = '', className }: ImageGalleryProps) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % images.length)
      if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, images.length])

  if (images.length === 0) {
    return (
      <div className={cn('aspect-[4/3] rounded-card bg-gray-100 dark:bg-gray-800 flex items-center justify-center', className)}>
        <span className="text-gray-300 dark:text-gray-600 text-sm">Pas de photo</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main image */}
      <div className="relative aspect-[4/3] rounded-card overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={images[active].image}
          alt={alt}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => setLightbox(true)}
          loading="eager"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-black/80 transition-colors"
              aria-label="Image précédente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-black/60 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-black/80 transition-colors"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-3 right-3 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                i === active
                  ? 'border-primary-500'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
              aria-label={`Image ${i + 1}`}
            >
              <img src={img.image} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((a) => (a - 1 + images.length) % images.length)
                }}
                className="absolute left-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                aria-label="Précédent"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActive((a) => (a + 1) % images.length)
                }}
                className="absolute right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                aria-label="Suivant"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <img
            src={images[active].image}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
