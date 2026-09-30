import { useId } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/i18n'
import type { FilterOption } from '@/types/product'

export interface FilterValues {
  /** attr_<key> -> raw URL value string (e.g. "8,12", "true", "palit") */
  attrs: Record<string, string>
  minPrice?: string
  maxPrice?: string
  condition?: string
  brand?: string
  city?: string
  commune?: string
}

interface ConditionOption {
  value: string
  label: string
}

const CONDITION_OPTIONS: ConditionOption[] = [
  { value: 'NEUF', label: 'Neuf' },
  { value: 'OCCASION', label: 'Occasion' },
  { value: 'RECONDITIONNE', label: 'Reconditionné' },
  { value: 'UTILISE', label: 'Utilisé' },
]

/** Checkbox row shared by select/multiselect/number facets. */
function CheckOption({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer py-0.5"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
      />
      <span className="truncate">{label}</span>
    </label>
  )
}

interface FacetProps {
  option: FilterOption
  selected: string | undefined
  onToggleValue: (raw: string) => void
  onSetValue: (v: string) => void
  onClear: () => void
}

function Facet({ option, selected, onToggleValue, onSetValue, onClear }: FacetProps) {
  const current = selected ? selected.split(',').filter(Boolean) : []

  const chipValues = (() => {
    if (option.value_type === 'boolean') return option.values.filter((v) => v === true)
    if (option.value_type === 'select' || option.value_type === 'multiselect')
      return option.options.length ? option.options : option.values
    return option.values
  })()

  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {option.label}
          {option.unit && <span className="text-gray-400 font-normal"> ({option.unit})</span>}
        </span>
        {selected && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Effacer
          </button>
        )}
      </div>

      {option.value_type === 'text' ? (
        <input
          type="search"
          value={selected ?? ''}
          onChange={(e) => onSetValue(e.target.value)}
          placeholder={option.label}
          aria-label={option.label}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
        />
      ) : (
        <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
          {chipValues.map((v) => {
            const raw = String(v)
            return (
              <CheckOption
                key={raw}
                label={option.value_type === 'number' && option.unit ? `${v} ${option.unit}` : raw}
                checked={current.includes(raw)}
                onToggle={() => onToggleValue(raw)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Faceted filter panel for the catalog. Renders the static price + condition
 * facets plus dynamic attribute facets (from the filter-options endpoint).
 * Controlled: the parent owns `values` (URL-synced in CatalogPage).
 */
export function FilterPanel({
  options,
  values,
  onChange,
  className,
}: {
  options: FilterOption[]
  values: FilterValues
  onChange: (values: FilterValues) => void
  className?: string
}) {
  const { t } = useT()

  const setAttr = (key: string, value: string | null) => {
    const attrs = { ...values.attrs }
    if (value === null || value === '') delete attrs[key]
    else attrs[key] = value
    onChange({ ...values, attrs })
  }

  return (
    <div className={className} data-testid="filter-panel">
      {/* Static: price */}
      <div className="py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 block">
          Prix (FCFA)
        </span>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={values.minPrice ?? ''}
            onChange={(e) => onChange({ ...values, minPrice: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            aria-label="Prix minimum"
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={values.maxPrice ?? ''}
            onChange={(e) => onChange({ ...values, maxPrice: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            aria-label="Prix maximum"
          />
        </div>
      </div>

      {/* Static: condition */}
      <div className="py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 block">
          {t('catalog.condition')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CONDITION_OPTIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={values.condition === c.value}
              onClick={() =>
                onChange({ ...values, condition: values.condition === c.value ? undefined : c.value })
              }
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                values.condition === c.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Static: location (spec §30) */}
      <div className="py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5 block">
          {t('catalog.location')}
        </span>
        <div className="space-y-2">
          <input
            type="search"
            placeholder="Abidjan"
            value={values.city ?? ''}
            onChange={(e) => onChange({ ...values, city: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            aria-label="Ville"
          />
          <input
            type="search"
            placeholder="Cocody, Yopougon…"
            value={values.commune ?? ''}
            onChange={(e) => onChange({ ...values, commune: e.target.value || undefined })}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
            aria-label="Commune"
          />
        </div>
      </div>

      {/* Dynamic facets */}
      {options.map((option) => (
        <Facet
          key={option.key}
          option={option}
          selected={values.attrs[option.key]}
          onToggleValue={(raw) => {
            const current = (values.attrs[option.key] ?? '').split(',').filter(Boolean)
            const next = current.includes(raw)
              ? current.filter((v) => v !== raw)
              : [...current, raw]
            setAttr(option.key, next.length ? next.join(',') : null)
          }}
          onSetValue={(v) => setAttr(option.key, v || null)}
          onClear={() => setAttr(option.key, null)}
        />
      ))}
    </div>
  )
}
