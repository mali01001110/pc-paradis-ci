import type { Category, Product } from '@/types/product'

export const MOCK_CATEGORY_TREE: Category[] = [
  {
    id: 'ci-1', name: 'Composants Internes', slug: 'composants-internes',
    parent: null, description: '', icon: 'cpu', sort_order: 0,
    children: [
      { id: 'ci-1-1', name: 'Processeurs', slug: 'cpu', parent: 'ci-1', description: '', icon: 'cpu', sort_order: 0 },
      { id: 'ci-1-2', name: 'Cartes Graphiques', slug: 'gpu', parent: 'ci-1', description: '', icon: 'gpu', sort_order: 1 },
      { id: 'ci-1-3', name: 'Carte mère', slug: 'carte-mere', parent: 'ci-1', description: '', icon: 'cpu', sort_order: 2 },
      { id: 'ci-1-4', name: 'RAM', slug: 'ram', parent: 'ci-1', description: '', icon: 'ram', sort_order: 3 },
      { id: 'ci-1-5', name: 'Stockage', slug: 'stockage', parent: 'ci-1', description: '', icon: 'storage', sort_order: 4 },
      { id: 'ci-1-6', name: 'Alimentation', slug: 'alimentation', parent: 'ci-1', description: '', icon: 'psu', sort_order: 5 },
      { id: 'ci-1-7', name: 'Boîtier', slug: 'boitier', parent: 'ci-1', description: '', icon: 'case', sort_order: 6 },
    ],
  },
  {
    id: 'ce-1', name: 'Composants Externes', slug: 'composants-externes',
    parent: null, description: '', icon: 'monitor', sort_order: 1,
    children: [
      { id: 'ce-1-1', name: 'Écrans Gaming', slug: 'ecrans', parent: 'ce-1', description: '', icon: 'monitor', sort_order: 0 },
      { id: 'ce-1-2', name: 'Claviers Gaming', slug: 'claviers', parent: 'ce-1', description: '', icon: 'peripherals', sort_order: 1 },
      { id: 'ce-1-3', name: 'Souris Gaming', slug: 'souris', parent: 'ce-1', description: '', icon: 'peripherals', sort_order: 2 },
      { id: 'ce-1-4', name: 'Casques Gaming', slug: 'casques', parent: 'ce-1', description: '', icon: 'audio', sort_order: 3 },
      { id: 'ce-1-5', name: 'Chaises Gaming', slug: 'chaises-gaming', parent: 'ce-1', description: '', icon: 'peripherals', sort_order: 4 },
    ],
  },
  {
    id: 'ac-1', name: 'Accessoires', slug: 'accessoires',
    parent: null, description: '', icon: 'package', sort_order: 2,
    children: [
      { id: 'ac-1-1', name: 'Câbles', slug: 'cables', parent: 'ac-1', description: '', icon: 'package', sort_order: 0 },
      { id: 'ac-1-2', name: 'Adaptateurs', slug: 'adaptateurs', parent: 'ac-1', description: '', icon: 'package', sort_order: 1 },
      { id: 'ac-1-3', name: 'Accessoires PC', slug: 'accessoires-pc', parent: 'ac-1', description: '', icon: 'package', sort_order: 2 },
    ],
  },
]

const img = (seed: string) => ({ id: seed, image: `https://picsum.photos/seed/${seed}/800/600`, is_primary: true, sort_order: 0 })

const make = (
  id: string, slug: string, title: string, brand: string, catSlug: string, catName: string,
  price: number, condition: Product['condition'], city: string, commune: string, seed: string,
  conditionDisplay?: string
): Product => ({
  id, slug, title, model: title, description: '', price, price_fcfa: price,
  currency: 'FCFA' as const, condition, condition_display: conditionDisplay ?? condition,
  status: 'AVAILABLE' as const, status_display: 'Disponible',
  city, commune, phone: '', whatsapp: '', views_count: Math.floor(Math.random() * 500),
  brand_name: brand, category_name: catName, category_slug: catSlug,
  seller_name: 'PC Express CI',
  images: [img(seed)], attributes: [],
  created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
})

export const MOCK_PRODUCTS: Record<string, Product[]> = {
  gpu: [
    make('p1', 'rtx-4070-ti-super', 'NVIDIA GeForce RTX 4070 Ti SUPER 16GB', 'ASUS', 'gpu', 'Cartes Graphiques', 850000, 'NEUF', 'Abidjan', 'Cocody', 'gpu1'),
    make('p2', 'rx-7900-xtx', 'AMD Radeon RX 7900 XTX 24GB', 'Sapphire', 'gpu', 'Cartes Graphiques', 1200000, 'NEUF', 'Abidjan', 'Yopougon', 'gpu2'),
    make('p3', 'rtx-4080-super', 'NVIDIA GeForce RTX 4080 SUPER 16GB', 'MSI', 'gpu', 'Cartes Graphiques', 1050000, 'RECONDITIONNE', 'Abidjan', 'Marcory', 'gpu3', 'Reconditionné'),
    make('p4', 'rx-7800-xt', 'AMD Radeon RX 7800 XT 16GB', 'Gigabyte', 'gpu', 'Cartes Graphiques', 650000, 'NEUF', 'Bouaké', 'Centre', 'gpu4'),
  ],
  cpu: [
    make('p5', 'ryzen-9-7950x', 'AMD Ryzen 9 7950X 16-Core', 'AMD', 'cpu', 'Processeurs', 550000, 'NEUF', 'Abidjan', 'Cocody', 'cpu1'),
    make('p6', 'core-i9-14900k', 'Intel Core i9-14900K 24-Core', 'Intel', 'cpu', 'Processeurs', 480000, 'NEUF', 'Abidjan', 'Plateau', 'cpu2'),
    make('p7', 'ryzen-7-7800x3d', 'AMD Ryzen 7 7800X3D 8-Core (3D V-Cache)', 'AMD', 'cpu', 'Processeurs', 320000, 'OCCASION', 'Abidjan', 'Yopougon', 'cpu3', 'Occasion'),
    make('p8', 'core-i7-14700k', 'Intel Core i7-14700K 20-Core', 'Intel', 'cpu', 'Processeurs', 340000, 'NEUF', 'Daloa', 'Centre', 'cpu4'),
  ],
  ram: [
    make('p9', 'corsair-ddr5-32gb', 'Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz', 'Corsair', 'ram', 'Mémoire RAM', 95000, 'NEUF', 'Abidjan', 'Cocody', 'ram1'),
    make('p10', 'gskill-ddr5-64gb', 'G.Skill Trident Z5 DDR5 64GB (2x32GB) 6400MHz', 'G.Skill', 'ram', 'Mémoire RAM', 170000, 'NEUF', 'Abidjan', 'Marcory', 'ram2'),
    make('p11', 'kingston-ddr5-32gb', 'Kingston Fury Beast DDR5 32GB (2x16GB) 5600MHz', 'Kingston', 'ram', 'Mémoire RAM', 85000, 'OCCASION', 'Abidjan', 'Plateau', 'ram3', 'Occasion'),
    make('p12', 'corsair-ddr4-32gb', 'Corsair Vengeance LPX DDR4 32GB (2x16GB) 3200MHz', 'Corsair', 'ram', 'Mémoire RAM', 45000, 'NEUF', 'Abidjan', 'Treichville', 'ram4'),
  ],
  stockage: [
    make('p13', 'samsung-990-pro-2tb', 'Samsung 990 PRO 2TB NVMe PCIe 4.0', 'Samsung', 'stockage', 'Stockage', 145000, 'NEUF', 'Abidjan', 'Cocody', 'ssd1'),
    make('p14', 'wd-black-sn850x-1tb', 'WD Black SN850X 1TB NVMe PCIe 4.0', 'Western Digital', 'stockage', 'Stockage', 95000, 'NEUF', 'Abidjan', 'Marcory', 'ssd2'),
    make('p15', 'seagate-barracuda-4tb', 'Seagate Barracuda 4TB HDD 5400RPM', 'Seagate', 'stockage', 'Stockage', 55000, 'NEUF', 'Abidjan', 'Yopougon', 'hdd1'),
    make('p16', 'crucial-p3-plus-2tb', 'Crucial P3 Plus 2TB NVMe PCIe 3.0', 'Crucial', 'stockage', 'Stockage', 85000, 'OCCASION', 'Abidjan', 'Plateau', 'ssd3', 'Occasion'),
  ],
  ecrans: [
    make('p17', 'lg-27gp950-b', 'LG 27GP950-B 27" 4K 144Hz Nano IPS', 'LG', 'ecrans', 'Écrans Gaming', 380000, 'NEUF', 'Abidjan', 'Cocody', 'mon1'),
    make('p18', 'aoc-24g2sw', 'AOC 24G2SW 24" Full HD 144Hz', 'AOC', 'ecrans', 'Écrans Gaming', 95000, 'NEUF', 'Abidjan', 'Marcory', 'mon2'),
    make('p19', 'samsung-odyssey-g7', 'Samsung Odyssey G7 32" 240Hz Curved', 'Samsung', 'ecrans', 'Écrans Gaming', 520000, 'RECONDITIONNE', 'Abidjan', 'Treichville', 'mon3', 'Reconditionné'),
    make('p20', 'benq-zowie-xl2546', 'BenQ Zowie XL2546 24" 240Hz eSports', 'BenQ', 'ecrans', 'Écrans Gaming', 280000, 'NEUF', 'Abidjan', 'Plateau', 'mon4'),
  ],
}
