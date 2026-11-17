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
      { id: 'ci-1-8', name: 'Ventilateurs', slug: 'ventilateurs', parent: 'ci-1', description: '', icon: 'fan', sort_order: 7 },
      { id: 'ci-1-9', name: 'Watercooling', slug: 'watercooling', parent: 'ci-1', description: '', icon: 'fan', sort_order: 8 },
      { id: 'ci-1-10', name: 'Refroidissement CPU', slug: 'refroidissement-cpu', parent: 'ci-1', description: '', icon: 'fan', sort_order: 9 },
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
      { id: 'ce-1-5', name: 'Manettes', slug: 'manettes', parent: 'ce-1', description: '', icon: 'gamepad', sort_order: 4 },
      { id: 'ce-1-6', name: 'Volants', slug: 'volants', parent: 'ce-1', description: '', icon: 'gamepad', sort_order: 5 },
      { id: 'ce-1-7', name: 'Joysticks', slug: 'joysticks', parent: 'ce-1', description: '', icon: 'gamepad', sort_order: 6 },
      { id: 'ce-1-8', name: 'Tapis de souris', slug: 'tapis-de-souris', parent: 'ce-1', description: '', icon: 'peripherals', sort_order: 7 },
      { id: 'ce-1-9', name: 'Chaises Gaming', slug: 'chaises-gaming', parent: 'ce-1', description: '', icon: 'peripherals', sort_order: 8 },
      { id: 'ce-1-10', name: 'Microphones', slug: 'microphones', parent: 'ce-1', description: '', icon: 'audio', sort_order: 9 },
      { id: 'ce-1-11', name: 'Webcams', slug: 'webcams', parent: 'ce-1', description: '', icon: 'camera', sort_order: 10 },
    ],
  },
  {
    id: 'ac-1', name: 'Accessoires', slug: 'accessoires',
    parent: null, description: '', icon: 'package', sort_order: 2,
    children: [
      { id: 'ac-1-1', name: 'Câbles', slug: 'cables', parent: 'ac-1', description: '', icon: 'package', sort_order: 0 },
      { id: 'ac-1-2', name: 'Câbles RGB', slug: 'cables-rgb', parent: 'ac-1', description: '', icon: 'package', sort_order: 1 },
      { id: 'ac-1-3', name: 'Adaptateurs', slug: 'adaptateurs', parent: 'ac-1', description: '', icon: 'package', sort_order: 2 },
      { id: 'ac-1-4', name: 'Accessoires PC', slug: 'accessoires-pc', parent: 'ac-1', description: '', icon: 'package', sort_order: 3 },
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
  'carte-mere': [
    make('p21', 'asus-rog-strix-b650e', 'ASUS ROG Strix B650E-E Gaming WiFi', 'ASUS', 'carte-mere', 'Carte mère', 320000, 'NEUF', 'Abidjan', 'Cocody', 'mb1'),
    make('p22', 'msi-mag-b760m', 'MSI MAG B760M Mortar WiFi DDR4', 'MSI', 'carte-mere', 'Carte mère', 145000, 'NEUF', 'Abidjan', 'Yopougon', 'mb2'),
  ],
  alimentation: [
    make('p23', 'corsair-rm850x', 'Corsair RM850x 850W 80 PLUS Gold', 'Corsair', 'alimentation', 'Alimentation', 110000, 'NEUF', 'Abidjan', 'Marcory', 'psu1'),
    make('p24', 'be-quiet-pure-power-11', 'be quiet! Pure Power 11 600W 80 PLUS Gold', 'be quiet!', 'alimentation', 'Alimentation', 85000, 'NEUF', 'Abidjan', 'Plateau', 'psu2'),
  ],
  boitier: [
    make('p25', 'fractal-design-meshify-2', 'Fractal Design Meshify 2 Compact', 'Fractal Design', 'boitier', 'Boîtier', 95000, 'NEUF', 'Abidjan', 'Cocody', 'case1'),
    make('p26', 'corsair-4000d-airflow', 'Corsair 4000D Airflow Mid-Tower', 'Corsair', 'boitier', 'Boîtier', 105000, 'OCCASION', 'Abidjan', 'Yopougon', 'case2', 'Occasion'),
  ],
  ventilateurs: [
    make('p27', 'noctua-nf-p12-reduc', 'Noctua NF-P12 redux-1200 PWM 120mm', 'Noctua', 'ventilateurs', 'Ventilateurs', 18000, 'NEUF', 'Abidjan', 'Cocody', 'fan1'),
    make('p28', 'corsair-qf120-3pk', 'Corsair QF120 RGB 120mm (3-pack)', 'Corsair', 'ventilateurs', 'Ventilateurs', 85000, 'NEUF', 'Abidjan', 'Marcory', 'fan2'),
  ],
  watercooling: [
    make('p29', 'nzxt-kraken-elite-360', 'NZXT Kraken Elite 360 RGB AIO', 'NZXT', 'watercooling', 'Watercooling', 250000, 'NEUF', 'Abidjan', 'Cocody', 'wc1'),
    make('p30', 'arctic-liquid-freezer-3-360', 'Arctic Liquid Freezer III 360', 'Arctic', 'watercooling', 'Watercooling', 115000, 'NEUF', 'Abidjan', 'Plateau', 'wc2'),
  ],
  'refroidissement-cpu': [
    make('p31', 'noctua-nh-d15', 'Noctua NH-D15 CPU Air Cooler', 'Noctua', 'refroidissement-cpu', 'Refroidissement CPU', 85000, 'NEUF', 'Abidjan', 'Cocody', 'cc1'),
    make('p32', 'deepcool-gammaxx-400', 'DeepCool GAMMAXX 400 CPU Cooler', 'DeepCool', 'refroidissement-cpu', 'Refroidissement CPU', 25000, 'NEUF', 'Abidjan', 'Yopougon', 'cc2'),
  ],
  claviers: [
    make('p33', 'logitech-g915-tkl', 'Logitech G915 TKL Lightspeed Wireless', 'Logitech', 'claviers', 'Claviers Gaming', 185000, 'NEUF', 'Abidjan', 'Cocody', 'kb1'),
    make('p34', 'razer-blackwidow-v3', 'Razer BlackWidow V3 Mechanical', 'Razer', 'claviers', 'Claviers Gaming', 110000, 'NEUF', 'Abidjan', 'Marcory', 'kb2'),
  ],
  souris: [
    make('p35', 'logitech-g-pro-x-superlight', 'Logitech G Pro X Superlight 2', 'Logitech', 'souris', 'Souris Gaming', 145000, 'NEUF', 'Abidjan', 'Cocody', 'mouse1'),
    make('p36', 'razer-deathadder-v3', 'Razer DeathAdder V3 Pro', 'Razer', 'souris', 'Souris Gaming', 135000, 'NEUF', 'Abidjan', 'Plateau', 'mouse2'),
  ],
  casques: [
    make('p37', 'steelseries-arctis-7', 'SteelSeries Arctis 7 Wireless', 'SteelSeries', 'casques', 'Casques Gaming', 125000, 'NEUF', 'Abidjan', 'Cocody', 'headset1'),
    make('p38', 'hyperx-cloud-ii', 'HyperX Cloud II Gaming Headset', 'HyperX', 'casques', 'Casques Gaming', 85000, 'OCCASION', 'Abidjan', 'Marcory', 'headset2', 'Occasion'),
  ],
  manettes: [
    make('p39', 'xbox-controller-wireless', 'Xbox Wireless Controller (Carbon Black)', 'Microsoft', 'manettes', 'Manettes', 65000, 'NEUF', 'Abidjan', 'Cocody', 'ctrl1'),
    make('p40', 'dualsense-edge', 'Sony DualSense Edge Wireless Controller', 'Sony', 'manettes', 'Manettes', 195000, 'NEUF', 'Abidjan', 'Yopougon', 'ctrl2'),
  ],
  volants: [
    make('p41', 'logitech-g29', 'Logitech G29 Racing Wheel', 'Logitech', 'volants', 'Volants', 320000, 'NEUF', 'Abidjan', 'Cocody', 'wheel1'),
  ],
  joysticks: [
    make('p42', 'thrustmaster-t16000m', 'Thrustmaster T16000M FCS Flight Stick', 'Thrustmaster', 'joysticks', 'Joysticks', 95000, 'NEUF', 'Abidjan', 'Plateau', 'joy1'),
  ],
  'tapis-de-souris': [
    make('p43', 'steelseries-qck-medium', 'SteelSeries Qck Medium Mousepad', 'SteelSeries', 'tapis-de-souris', 'Tapis de souris', 18000, 'NEUF', 'Abidjan', 'Cocody', 'pad1'),
    make('p44', 'corsair-mm300-extended', 'Corsair MM300 Extended Mousepad', 'Corsair', 'tapis-de-souris', 'Tapis de souris', 35000, 'NEUF', 'Abidjan', 'Marcory', 'pad2'),
  ],
  'chaises-gaming': [
    make('p45', 'secretlab-titan-evo', 'Secretlab Titan Evo 2022 Series', 'Secretlab', 'chaises-gaming', 'Chaises Gaming', 450000, 'NEUF', 'Abidjan', 'Cocody', 'chair1'),
    make('p46', 'dxracer-formula-series', 'DXRacer Formula Series Gaming Chair', 'DXRacer', 'chaises-gaming', 'Chaises Gaming', 280000, 'OCCASION', 'Abidjan', 'Yopougon', 'chair2', 'Occasion'),
  ],
  microphones: [
    make('p47', 'blue-yeti-usb', 'Blue Yeti USB Microphone', 'Blue', 'microphones', 'Microphones', 115000, 'NEUF', 'Abidjan', 'Cocody', 'mic1'),
    make('p48', 'audio-technica-at2020', 'Audio-Technica AT2020 Cardioid Condenser', 'Audio-Technica', 'microphones', 'Microphones', 95000, 'NEUF', 'Abidjan', 'Plateau', 'mic2'),
  ],
  webcams: [
    make('p49', 'logitech-c920', 'Logitech C920 HD Pro Webcam', 'Logitech', 'webcams', 'Webcams', 75000, 'NEUF', 'Abidjan', 'Cocody', 'cam1'),
    make('p50', 'razer-kiyo-pro', 'Razer Kiyo Pro Ultra', 'Razer', 'webcams', 'Webcams', 220000, 'NEUF', 'Abidjan', 'Marcory', 'cam2'),
  ],
  cables: [
    make('p51', 'ugreen-hdmi-2m', 'UGREEN HDMI 2.0 Cable 2m', 'UGREEN', 'cables', 'Câbles', 12000, 'NEUF', 'Abidjan', 'Cocody', 'cable1'),
    make('p52', 'anker-usb-c-1m', 'Anker USB-C to USB-C Cable 1m', 'Anker', 'cables', 'Câbles', 15000, 'NEUF', 'Abidjan', 'Marcory', 'cable2'),
  ],
  'cables-rgb': [
    make('p53', 'corsair-rgb-led-strip', 'Corsair iCUE RGB LED Lighting Strip', 'Corsair', 'cables-rgb', 'Câbles RGB', 55000, 'NEUF', 'Abidjan', 'Cocody', 'rgb1'),
  ],
  adaptateurs: [
    make('p54', 'apple-usb-c-digital-av', 'Apple USB-C Digital AV Multiport Adapter', 'Apple', 'adaptateurs', 'Adaptateurs', 65000, 'NEUF', 'Abidjan', 'Cocody', 'adapt1'),
    make('p55', 'ugreen-hdmi-to-vga', 'UGREEN HDMI to VGA Adapter', 'UGREEN', 'adaptateurs', 'Adaptateurs', 18000, 'NEUF', 'Abidjan', 'Plateau', 'adapt2'),
  ],
  'accessoires-pc': [
    make('p56', 'anker-usb-hub-4port', 'Anker 4-Port USB 3.0 Hub', 'Anker', 'accessoires-pc', 'Accessoires PC', 25000, 'NEUF', 'Abidjan', 'Cocody', 'acc1'),
    make('p57', 'laptop-stand-aluminum', 'Aluminum Laptop Stand Riser', 'Generic', 'accessoires-pc', 'Accessoires PC', 35000, 'NEUF', 'Abidjan', 'Marcory', 'acc2'),
  ],
}
