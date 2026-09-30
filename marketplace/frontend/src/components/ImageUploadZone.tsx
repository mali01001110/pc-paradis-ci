import { useState } from 'react'
import { Upload, X, ChevronUp, ChevronDown, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ProductImage } from '@/types/product'

interface ImageUploadZoneProps {
  existing?: ProductImage[]
  files: File[]
  maxImages: number
  onFilesChange: (files: File[]) => void
  onDeleteExisting: (imageId: string) => void
  onReorderExisting: (order: string[]) => void
  deletingIds?: string[]
  reordering?: boolean
}

export default function ImageUploadZone({
  existing = [],
  files,
  maxImages,
  onFilesChange,
  onDeleteExisting,
  onReorderExisting,
  deletingIds = [],
  reordering = false,
}: ImageUploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const total = existing.length + files.length
  const remaining = maxImages - total

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const incoming = Array.from(list).slice(0, remaining)
    onFilesChange([...files, ...incoming])
  }

  const moveExisting = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= existing.length) return
    const order = existing.map((img) => img.id)
    ;[order[index], order[target]] = [order[target], order[index]]
    onReorderExisting(order)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Glissez-déposez vos images ici ou{' '}
          <label className="text-primary-600 font-medium cursor-pointer">
            parcourez
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          JPG, PNG, WebP — jusqu&apos;à {maxImages} images ({remaining} restantes)
        </p>
      </div>

      {(existing.length > 0 || files.length > 0) && (
        <div className="mt-4 space-y-2">
          {/* Existing (server) images */}
          {existing.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img src={img.image} alt="" className="w-full h-full object-cover" />
                {img.is_primary && (
                  <span className="absolute top-1 left-1 text-amber-500">
                    <Star size={14} fill="currentColor" />
                  </span>
                )}
              </div>
              <div className="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                Image {idx + 1}
                {img.is_primary && <span className="ml-2 text-xs text-amber-500">Principale</span>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveExisting(idx, -1)}
                  disabled={idx === 0 || reordering}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5"
                  title="Monter"
                >
                  <ChevronUp size={15} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveExisting(idx, 1)}
                  disabled={idx === existing.length - 1 || reordering}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5"
                  title="Descendre"
                >
                  <ChevronDown size={15} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteExisting(img.id)}
                  disabled={deletingIds.includes(img.id)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1.5"
                  title="Supprimer"
                >
                  <X size={15} />
                </Button>
              </div>
            </div>
          ))}

          {/* New files */}
          {files.map((f, i) => (
            <div key={f.name + f.size + i} className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              <span className="truncate">{f.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 ml-3 p-1.5"
                aria-label={`Retirer ${f.name}`}
              >
                <X size={15} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
