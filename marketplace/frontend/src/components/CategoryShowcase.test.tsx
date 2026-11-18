import { describe, expect, it } from 'vitest'
import { catIcon } from './CategoryShowcase'

const childCategorySlugs = [
  'cpu',
  'gpu',
  'carte-mere',
  'ram',
  'stockage',
  'alimentation',
  'boitier',
  'ventilateurs',
  'watercooling',
  'refroidissement-cpu',
  'ecrans',
  'claviers',
  'souris',
  'casques',
  'manettes',
  'volants',
  'joysticks',
  'microphones',
  'webcams',
  'cables',
  'cables-rgb',
  'adaptateurs',
  'accessoires-pc',
  'tables-gaming',
  'chaises-gaming',
  'tapis-de-souris',
]

describe('catIcon', () => {
  it('uses a distinct icon for each catalogue child category', () => {
    const fallbackIcon = catIcon('unknown-category')
    const icons = childCategorySlugs.map(catIcon)

    expect(icons).not.toContain(fallbackIcon)
    expect(new Set(icons).size).toBe(childCategorySlugs.length)
  })
})
