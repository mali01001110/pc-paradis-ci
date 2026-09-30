import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterPanel, type FilterValues } from './FilterPanel'
import type { FilterOption } from '@/types/product'
import { I18nProvider } from '@/i18n'

const OPTIONS: FilterOption[] = [
  {
    key: 'vram',
    label: 'VRAM',
    value_type: 'number',
    unit: 'GB',
    options: [],
    values: [8, 12, 16],
  },
  {
    key: 'vram_type',
    label: 'Type de VRAM',
    value_type: 'select',
    unit: '',
    options: ['GDDR6', 'GDDR6X'],
    values: ['GDDR6'],
  },
  {
    key: 'note',
    label: 'Note',
    value_type: 'text',
    unit: '',
    options: [],
    values: [],
  },
]

function Panel({ options, initial }: { options: FilterOption[]; initial?: FilterValues }) {
  const [values, setValues] = useState<FilterValues>(initial ?? { attrs: {} })
  return <FilterPanel options={options} values={values} onChange={setValues} />
}

function renderPanel(options: FilterOption[], initial?: FilterValues) {
  return render(
    <I18nProvider>
      <Panel options={options} initial={initial} />
    </I18nProvider>
  )
}

describe('FilterPanel', () => {
  it('renders static price and condition facets', () => {
    renderPanel([])
    expect(screen.getByLabelText('Prix minimum')).toBeInTheDocument()
    expect(screen.getByLabelText('Prix maximum')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Neuf' })).toBeInTheDocument()
  })

  it('renders number facet chips with unit and facet label', () => {
    renderPanel(OPTIONS)
    expect(screen.getByText('VRAM')).toBeInTheDocument()
    expect(screen.getByText('(GB)')).toBeInTheDocument()
    expect(screen.getByLabelText('8 GB')).toBeInTheDocument()
    expect(screen.getByLabelText('16 GB')).toBeInTheDocument()
  })

  it('toggles two number values into an OR selection', () => {
    renderPanel(OPTIONS)
    fireEvent.click(screen.getByLabelText('8 GB'))
    fireEvent.click(screen.getByLabelText('12 GB'))
    expect(screen.getByLabelText('8 GB')).toBeChecked()
    expect(screen.getByLabelText('12 GB')).toBeChecked()
    expect(screen.getByLabelText('16 GB')).not.toBeChecked()
  })

  it('untoggles a value while keeping the other', () => {
    renderPanel(OPTIONS, { attrs: { vram: '8,12' } })
    fireEvent.click(screen.getByLabelText('8 GB'))
    expect(screen.getByLabelText('8 GB')).not.toBeChecked()
    expect(screen.getByLabelText('12 GB')).toBeChecked()
  })

  it('text facet accepts typed input', () => {
    renderPanel(OPTIONS)
    const input = screen.getByPlaceholderText('Note')
    fireEvent.change(input, { target: { value: 'palit' } })
    expect(input).toHaveValue('palit')
  })

  it('select facet shows static options', () => {
    renderPanel(OPTIONS)
    expect(screen.getByLabelText('GDDR6X')).toBeInTheDocument()
    expect(screen.getByLabelText('GDDR6')).toBeInTheDocument()
  })

  it('condition chips toggle on and off', () => {
    renderPanel([])
    const chip = screen.getByRole('button', { name: 'Occasion' })
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })
})
