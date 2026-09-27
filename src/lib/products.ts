export type ProductCategory =
  | 'new-in'
  | 'dresses'
  | 'tops'
  | 'blouses'
  | 'co-ords'
  | 'kurtas'
  | 'trousers'
  | 'sarees'
  | 'bags'
  | 'jewellery'
  | 'footwear'
  | 'scarves'

export type Product = {
  id: string
  name: string
  category: ProductCategory
  price: number
  image: string
  description?: string
  sizes?: string[]
  colors?: string[]
  stock?: number
  featured?: boolean
  available?: boolean
}

export const products: Product[] = [
  {
    id: 'dress-001',
    name: 'The Silk Column Dress',
    category: 'dresses',
    price: 8900,
    image: '/assets/products/dresses/dress-001.jpg',
    description: 'A refined silhouette designed for modern occasions.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['BLACK', 'IVORY'],
    stock: 10,
    featured: true,
    available: true,
  },
  {
    id: 'top-001',
    name: 'The Signature Top',
    category: 'tops',
    price: 4500,
    image: '/assets/products/tops/top-001.jpg',
    description: 'An elevated essential with a timeless finish.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['BLACK', 'IVORY'],
    stock: 10,
    featured: true,
    available: true,
  },
  {
    id: 'blouse-001',
    name: 'The Heritage Blouse',
    category: 'blouses',
    price: 5200,
    image: '/assets/products/blouses/blouse-001.jpg',
    description: 'Classic detailing interpreted for contemporary wardrobes.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['IVORY', 'WINE'],
    stock: 10,
    featured: true,
    available: true,
  },
  {
    id: 'coord-001',
    name: 'The Modern Co-Ord',
    category: 'co-ords',
    price: 7800,
    image: '/assets/products/co-ords/coord-001.jpg',
    description: 'Effortless separates designed to be worn together or apart.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['BLACK', 'BROWN'],
    stock: 10,
    featured: true,
    available: true,
  },
  {
    id: 'kurta-001',
    name: 'The Everyday Kurta',
    category: 'kurtas',
    price: 6200,
    image: '/assets/products/kurtas/kurta-001.jpg',
    description: 'An understated expression of Indian elegance.',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['IVORY', 'BLACK'],
    stock: 10,
    available: true,
  },
  {
    id: 'trouser-001',
    name: 'The Tailored Trouser',
    category: 'trousers',
    price: 5800,
    image: '/assets/products/trousers/trouser-001.jpg',
    description: 'Clean tailoring for a considered wardrobe.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['BLACK', 'BROWN'],
    stock: 10,
    available: true,
  },
  {
    id: 'saree-001',
    name: 'The Signature Saree',
    category: 'sarees',
    price: 12500,
    image: '/assets/products/sarees/saree-001.jpg',
    description: 'Timeless drape with a contemporary point of view.',
    sizes: ['FREE SIZE'],
    colors: ['IVORY', 'WINE'],
    stock: 10,
    featured: true,
    available: true,
  },
  {
    id: 'bag-001',
    name: 'The THAANE Edit Bag',
    category: 'bags',
    price: 6900,
    image: '/assets/products/bags/bag-001.jpg',
    description: 'A refined finishing piece for everyday styling.',
    sizes: ['ONE SIZE'],
    colors: ['BLACK', 'BROWN'],
    stock: 10,
    available: true,
  },
  {
    id: 'jewellery-001',
    name: 'The Signature Jewellery Edit',
    category: 'jewellery',
    price: 3900,
    image: '/assets/products/jewellery/jewellery-001.jpg',
    description: 'Subtle statement pieces designed to complete the look.',
    sizes: ['ONE SIZE'],
    colors: ['GOLD', 'SILVER'],
    stock: 10,
    available: true,
  },
  {
    id: 'footwear-001',
    name: 'The THAANE Mule',
    category: 'footwear',
    price: 7200,
    image: '/assets/products/footwear/footwear-001.jpg',
    description: 'Elegant footwear designed for effortless movement.',
    sizes: ['36', '37', '38', '39', '40', '41'],
    colors: ['BLACK', 'IVORY'],
    stock: 10,
    available: true,
  },
  {
    id: 'scarf-001',
    name: 'The Silk Scarf',
    category: 'scarves',
    price: 3200,
    image: '/assets/products/scarves/scarf-001.jpg',
    description: 'A versatile silk accent for the modern wardrobe.',
    sizes: ['ONE SIZE'],
    colors: ['IVORY', 'WINE', 'BLACK'],
    stock: 10,
    available: true,
  },
]

export const categoryLabels: Record<ProductCategory, string> = {
  'new-in': 'NEW IN',
  dresses: 'DRESSES',
  tops: 'TOPS',
  blouses: 'BLOUSES',
  'co-ords': 'CO-ORDS',
  kurtas: 'KURTAS',
  trousers: 'TROUSERS',
  sarees: 'SAREES',
  bags: 'BAGS',
  jewellery: 'JEWELLERY',
  footwear: 'FOOTWEAR',
  scarves: 'SCARVES',
}

export const getProductsByCategory = (category: ProductCategory) => {
  if (category === 'new-in') {
    return products.filter((product) => product.featured)
  }

  return products.filter((product) => product.category === category)
}
