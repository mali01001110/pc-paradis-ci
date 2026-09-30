export interface MenuItem {
  slug: string
  labelKey: string
  brand?: string
}

export interface MenuButton {
  labelKey: string
  slug: string
  items: MenuItem[]
}

export const headerMenu: MenuButton[] = [
  {
    labelKey: 'menu.internalComponents',
    slug: 'composants-internes',
    items: [
      { slug: 'cpu', labelKey: 'menu.cpu' },
      { slug: 'gpu', labelKey: 'menu.gpu' },
      { slug: 'carte-mere', labelKey: 'menu.carte_mere' },
      { slug: 'ram', labelKey: 'menu.ram' },
      { slug: 'stockage', labelKey: 'menu.stockage' },
      { slug: 'alimentation', labelKey: 'menu.alimentation' },
      { slug: 'boitier', labelKey: 'menu.boitier' },
      { slug: 'ventilateurs', labelKey: 'menu.ventilateurs' },
      { slug: 'watercooling', labelKey: 'menu.watercooling' },
      { slug: 'refroidissement-cpu', labelKey: 'menu.refroidissement_cpu' },
    ],
  },
  {
    labelKey: 'menu.externalComponents',
    slug: 'composants-externes',
    items: [
      { slug: 'ecrans', labelKey: 'menu.ecrans' },
      { slug: 'claviers', labelKey: 'menu.claviers' },
      { slug: 'souris', labelKey: 'menu.souris' },
      { slug: 'casques', labelKey: 'menu.casques' },
      { slug: 'manettes', labelKey: 'menu.manettes' },
      { slug: 'volants', labelKey: 'menu.volants' },
      { slug: 'joysticks', labelKey: 'menu.joysticks' },
      { slug: 'tapis-de-souris', labelKey: 'menu.tapis_de_souris' },
      { slug: 'chaises-gaming', labelKey: 'menu.chaises_gaming' },
      { slug: 'microphones', labelKey: 'menu.microphones' },
      { slug: 'webcams', labelKey: 'menu.webcams' },
    ],
  },
  {
    labelKey: 'menu.accessories',
    slug: 'accessoires',
    items: [
      { slug: 'cables', labelKey: 'menu.cables' },
      { slug: 'cables-rgb', labelKey: 'menu.cables_rgb' },
      { slug: 'adaptateurs', labelKey: 'menu.adaptateurs' },
      { slug: 'accessoires-pc', labelKey: 'menu.accessoires_pc' },
    ],
  },
]
