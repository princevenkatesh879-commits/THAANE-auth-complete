import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag } from 'lucide-react'
import { categoryLabels } from '../lib/products'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'
import { addToBag, getBagCount } from '../lib/bag'

type ProductDetailPageProps = {
  productId: string
  onNavigate: (page: string) => void
}

export default function ProductDetailPage({
  productId,
  onNavigate,
}: ProductDetailPageProps) {
  const { products, loading } = useFirestoreProducts()

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [products, productId],
  )

  const [quantity, setQuantity] = useState(1)
  const [bagCount, setBagCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const [added, setAdded] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')

  const sizes = product?.sizes || []
  const colors = product?.colors || []

  useEffect(() => {
    setSelectedSize(sizes[0] || '')
    setSelectedColor(colors[0] || '')
    setQuantity(1)
    setAdded(false)
  }, [productId, product])

  useEffect(() => {
    const updateBagCount = () => {
      setBagCount(getBagCount())
    }

    updateBagCount()
    window.addEventListener('hashchange', updateBagCount)
    window.addEventListener('thaane-bag-updated', updateBagCount)

    return () => {
      window.removeEventListener('hashchange', updateBagCount)
      window.removeEventListener('thaane-bag-updated', updateBagCount)
    }
  }, [])

  if (loading && !product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-not-found">
          <p className="eyebrow">THAANE</p>
          <h1>LOADING PRODUCT</h1>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="product-detail-page">
        <div className="product-detail-not-found">
          <p className="eyebrow">THAANE</p>
          <h1>PRODUCT NOT FOUND</h1>
          <button
            className="product-detail-back-button"
            onClick={() => onNavigate('collections')}
          >
            <ArrowLeft size={16} />
            BACK TO COLLECTIONS
          </button>
        </div>
      </main>
    )
  }

  const needsSize = sizes.length > 0
  const needsColor = colors.length > 0
  const selectionReady =
    (!needsSize || Boolean(selectedSize)) &&
    (!needsColor || Boolean(selectedColor))

  const stock = product.stock ?? 0
  const isOutOfStock = stock <= 0
  const isLowStock = stock > 0 && stock < 5

  return (
    <main className="product-detail-page">
      <header className="product-detail-header">
        <button
          className="product-detail-logo"
          onClick={() => onNavigate('home')}
          aria-label="THAANE home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <nav className="product-detail-navigation">
          <button onClick={() => onNavigate('home')}>HOME</button>
          <button onClick={() => onNavigate('new-in')}>NEW IN</button>
          <button onClick={() => onNavigate('clothing')}>CLOTHING</button>
          <button onClick={() => onNavigate('sarees')}>SAREES</button>
          <button onClick={() => onNavigate('accessories')}>ACCESSORIES</button>
          <button onClick={() => onNavigate('journal')}>JOURNAL</button>
        </nav>

        <div className="product-detail-actions">
          <button aria-label="Search">
            <span className="product-detail-action-symbol">⌕</span>
          </button>

          <button
            className="product-detail-bag-button"
            aria-label="Shopping bag"
            onClick={() => onNavigate('bag')}
          >
            <ShoppingBag size={19} strokeWidth={1.4} />

            {bagCount > 0 && (
              <span className="product-detail-bag-count">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="product-detail-content">
        <div className="product-detail-gallery">
          <div className="product-detail-image">
            <img
              src={product.image}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />

            <div className="product-detail-image-placeholder">
              <span>THAANE</span>
              <small>PRODUCT IMAGE</small>
            </div>
          </div>
        </div>

        <section className="product-detail-info">
          <button
            className="product-detail-collection"
            onClick={() => onNavigate(product.category)}
          >
            {categoryLabels[product.category]}
          </button>

          <h1>{product.name}</h1>

          <p className="product-detail-price">
            ₹{product.price.toLocaleString('en-IN')}
          </p>

          {isLowStock && (
            <p className="product-detail-stock-warning">
              ONLY {stock} LEFT
            </p>
          )}

          {isOutOfStock && (
            <p className="product-detail-stock-warning is-out">
              OUT OF STOCK
            </p>
          )}

          <div className="product-detail-rule" />

          <p className="product-detail-description">
            {product.description ||
              'A considered THAANE piece designed for modern stories.'}
          </p>

          {needsColor && (
            <div className="product-detail-option-group">
              <div className="product-detail-option-heading">
                <span>COLOUR</span>
                <strong>{selectedColor}</strong>
              </div>

              <div className="product-detail-color-options">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={
                      selectedColor === color
                        ? 'product-detail-color is-selected'
                        : 'product-detail-color'
                    }
                    onClick={() => {
                      setSelectedColor(color)
                      setAdded(false)
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsSize && (
            <div className="product-detail-option-group">
              <div className="product-detail-option-heading">
                <span>SIZE</span>
                <strong>{selectedSize}</strong>
              </div>

              <div className="product-detail-size-options">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={
                      selectedSize === size
                        ? 'product-detail-size is-selected'
                        : 'product-detail-size'
                    }
                    onClick={() => {
                      setSelectedSize(size)
                      setAdded(false)
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="product-detail-quantity">
            <span>QUANTITY</span>

            <div className="quantity-control">
              <button
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>

              <span>{quantity}</span>

              <button
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(stock, current + 1),
                  )
                }
                aria-label="Increase quantity"
                disabled={quantity >= stock || isOutOfStock}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="product-detail-buttons">
            <button
              className="product-detail-add"
              onClick={() => {
                if (
                  !product.available ||
                  isOutOfStock ||
                  !selectionReady ||
                  quantity > stock
                ) {
                  return
                }

                addToBag(
                  product.id,
                  quantity,
                  selectedSize || undefined,
                  selectedColor || undefined,
                )

                setAdded(true)
              }}
              disabled={
                !product.available ||
                isOutOfStock ||
                !selectionReady ||
                quantity > stock
              }
            >
              <ShoppingBag size={17} strokeWidth={1.5} />

              {isOutOfStock
                ? 'OUT OF STOCK'
                : !product.available
                  ? 'COMING SOON'
                  : !selectionReady
                    ? 'SELECT OPTIONS'
                    : added
                      ? 'ADDED TO BAG'
                      : 'ADD TO BAG'}
            </button>

            <button
              className={`product-detail-wishlist ${
                saved ? 'is-saved' : ''
              }`}
              onClick={() => setSaved((current) => !current)}
              aria-label={
                saved ? 'Remove from wishlist' : 'Add to wishlist'
              }
            >
              <Heart
                size={19}
                strokeWidth={1.4}
                fill={saved ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          <div className="product-detail-notes">
            <div>
              <span>THE THAANE EDIT</span>
              <p>Designed with intention. Made for modern stories.</p>
            </div>

            <div>
              <span>AVAILABILITY</span>
              <p>
                {isOutOfStock
                  ? 'No stock left.'
                  : product.available
                    ? 'Available to purchase.'
                    : 'Launching soon.'}
              </p>
            </div>
          </div>

          <button
            className="product-detail-back"
            onClick={() => onNavigate('collections')}
          >
            <ArrowLeft size={15} />
            BACK TO COLLECTIONS
          </button>
        </section>
      </div>
    </main>
  )
}
