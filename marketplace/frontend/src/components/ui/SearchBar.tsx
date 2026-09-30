import { X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (e: React.FormEvent) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className={cn('relative', className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-12 pr-24 py-4 text-base shadow-lg border-gray-200 dark:border-gray-700 w-full"
        aria-label="Rechercher"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Effacer"
        >
          <X size={16} />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-5"
      >
        Rechercher
      </button>
    </form>
  )
}
