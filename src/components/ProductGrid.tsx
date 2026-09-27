import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { AuthCard } from './AuthCard'
import { Heart, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import {
  categoryLabels,
  type ProductCategory,
} from '../lib/products'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'
import { addToBag, getBag } from '../lib/bag'
import {
  getWishlist,
  toggleWishlist,
} from '../lib/wishlist'

type ProductGridProps = {
  title?: string
  subtitle?: string
  initialCategory?: ProductCategory | 'all' | 'clothing' | 'accessories'
  onProduct?: (id: string) => void
  showHeading?: boolean
  user?: User | null
}

const filters: Array<{
  value: 'all' | ProductCategory
  label: string
}> = [
  { value: 'all', label: 'ALL' },
  { value: 'new-in', label: 'NEW IN' },
  { value: 'dresses', label: 'DRESSES' },
  { value: 'tops', label: 'TOPS' },
  { value: 'blouses', label: 'BLOUSES' },
  { value: 'co-ords', label: 'CO-ORDS' },
  { value: 'kurtas', label: 'KURTAS' },
  { value: 'trousers', label: 'TROUSERS' },
  { value: 'sarees', label: 'SAREES' },
  { value: 'bags', label: 'BAGS' },
  { value: 'jewellery', label: 'JEWELLERY' },
  { value: 'footwear', label: 'FOOTWEAR' },
  { value: 'scarves', label: 'SCARVES' },
]

export default function ProductGrid({
  title = 'THE THAANE EDIT',
  subtitle = "Women's fashion for modern stories.",
  initialCategory = 'new-in',
  onProduct,
  showHeading = true,
  user = null,
}: ProductGridProps) {
  const [category, setCategory] = useState<
    'all' | ProductCategory | 'clothing' | 'accessories'
  >(initialCategory)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlist())
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const { products, loading } = useFirestoreProducts()

  useEffect(() => {
    setWishlistIds(getWishlist())

    const updateWishlist = () => {
      setWishlistIds(getWishlist())
    }

    window.addEventListener(
      'thaane-wishlist-updated',
      updateWishlist,
    )

    return () => {
      window.removeEventListener(
        'thaane-wishlist-updated',
        updateWishlist,
      )
    }
  }, [user])

  const visibleProducts = useMemo(() => {
    if (category === 'all') return products

    if (category === 'new-in') {
      return products.filter((product) => product.featured)
    }

    if (category === 'clothing') {
      return products.filter((product) =>
        [
          'dresses',
          'tops',
          'blouses',
          'co-ords',
          'kurtas',
          'trousers',
        ].includes(product.category),
      )
    }

    if (category === 'accessories') {
      return products.filter((product) =>
        [
          'bags',
          'jewellery',
          'footwear',
          'scarves',
        ].includes(product.category),
      )
    }

    return products.filter((product) => product.category === category)
  }, [category, products])

  return (
    <section className="product-catalog">

      {showHeading && (
        <div className="product-catalog-heading">

          <div>
            <span>THE COLLECTION</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <button className="catalog-filter-button">
            <SlidersHorizontal size={16} strokeWidth={1.25} />
            FILTER & SORT
          </button>

        </div>
      )}

      <div className="product-filters">

        {filters.map((filter) => (
          <button
            key={filter.value}
            className={category === filter.value ? 'active' : ''}
            onClick={() => setCategory(filter.value)}
          >
            {filter.label}
          </button>
        ))}

      </div>

      <div className="product-result-count">
        {loading
          ? 'LOADING COLLECTION'
          : `${visibleProducts.length} ${
              visibleProducts.length === 1 ? 'PIECE' : 'PIECES'
            }`}
      </div>

      {!loading && visibleProducts.length > 0 ? (
        <div className="product-grid">

          {visibleProducts.map((product) => {
            const stock = product.stock ?? 0
            const isOutOfStock = stock <= 0
            const isLowStock = stock > 0 && stock < 5

            const bagQuantity = getBag()
              .filter((item) => item.productId === product.id)
              .reduce((total, item) => total + item.quantity, 0)

            const reachedStockLimit =
              stock > 0 && bagQuantity >= stock

            return (
            <article
              className="product-card"
              key={product.id}
              onClick={() => {
                if (onProduct) {
                  onProduct(product.id)
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  if (onProduct) {
                    onProduct(product.id)
                  }
                }
              }}
            >

              <div className="product-image">

                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="product-image-placeholder">
                    <span>THAANE</span>
                    <small>
                      {categoryLabels[product.category]}
                    </small>
                  </div>
                )}

                <button
                  className={`product-wishlist ${
                    wishlistIds.includes(product.id) ? 'active' : ''
                  }`}
                  aria-label={
                    wishlistIds.includes(product.id)
                      ? `Remove ${product.name} from wishlist`
                      : `Add ${product.name} to wishlist`
                  }
                  onClick={(event) => {
                    event.stopPropagation()

                    if (!user) {
                      setShowAuthPopup(true)
                      return
                    }

                    toggleWishlist(product.id)
                    setWishlistIds(getWishlist())
                  }}
                >
                  <Heart
                    size={18}
                    strokeWidth={1.2}
                    fill={
                      wishlistIds.includes(product.id)
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                </button>

                <button
                  className="product-quick-add"
                  disabled={
                    isOutOfStock ||
                    !product.available ||
                    reachedStockLimit
                  }
                  onClick={(event) => {
                    event.stopPropagation()

                    if (!user) {
                      setShowAuthPopup(true)
                      return
                    }

                    if (
                      !product.available ||
                      isOutOfStock ||
                      reachedStockLimit
                    ) {
                      return
                    }

                    addToBag(
                      product.id,
                      1,
                      undefined,
                      undefined,
                      stock,
                    )
                    setAddedProductId(product.id)
                    window.setTimeout(() => {
                      setAddedProductId((current) =>
                        current === product.id ? null : current,
                      )
                    }, 1800)
                  }}
                >
                  <ShoppingBag size={15} strokeWidth={1.25} />
                  <span>
                    {isOutOfStock
                      ? 'OUT OF STOCK'
                      : reachedStockLimit
                        ? 'MAXIMUM AVAILABLE IN BAG'
                        : product.available
                          ? addedProductId === product.id
                            ? '✓ ADDED TO BAG'
                            : 'ADD TO BAG'
                          : 'COMING SOON'}
                  </span>
                </button>

              </div>

              <div className="product-info">

                <div>
                  <span>
                    {categoryLabels[product.category]}
                  </span>

                  <h2>{product.name}</h2>
                </div>

                <strong>
                  ₹{product.price.toLocaleString('en-IN')}
                </strong>

                {isLowStock && (
                  <small className="product-stock-warning">
                    ONLY {stock} LEFT
                  </small>
                )}

                {isOutOfStock && (
                  <small className="product-stock-warning is-out">
                    OUT OF STOCK
                  </small>
                )}

              </div>

            </article>
            )
          })}

        </div>
      ) : (
        <div className="product-empty">

          <span>✦</span>

          <h2>
            NEW PIECES
            <br />
            ARE COMING SOON
          </h2>

          <p>
            This THAANE edit is being carefully prepared.
          </p>

        </div>
      )}

      {showAuthPopup && !user && (
        <div
          className="product-auth-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to continue"
          onClick={() => setShowAuthPopup(false)}
        >
          <div
            className="product-auth-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="product-auth-close"
              aria-label="Close sign-in"
              onClick={() => setShowAuthPopup(false)}
            >
              ×
            </button>

            <AuthCard />
          </div>
        </div>
      )}

    </section>
  )
}
