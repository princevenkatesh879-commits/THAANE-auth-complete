import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Grid3X3,
  Heart,
  Home,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  User,
} from 'lucide-react'
import {
  getBag,
  removeFromBag,
  updateBagQuantity,
  type BagItem,
  syncBagWithProducts,
} from '../lib/bag'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type BagPageProps = {
  onNavigate: (page: string) => void
  user?: {
    uid: string
  } | null
}

export default function BagPage({ onNavigate, user }: BagPageProps) {
  const [bag, setBag] = useState<BagItem[]>([])
  const { products, loading: productsLoading } =
    useFirestoreProducts()

  const refreshBag = () => {
    if (products.length > 0) {
      setBag(syncBagWithProducts(products))
      return
    }

    setBag(getBag())
  }

  useEffect(() => {
    refreshBag()

    const handleBagUpdate = () => {
      refreshBag()
    }

    window.addEventListener('thaane-bag-updated', handleBagUpdate)

    return () => {
      window.removeEventListener(
        'thaane-bag-updated',
        handleBagUpdate,
      )
    }
  }, [user])

  useEffect(() => {
    if (productsLoading) return

    setBag(syncBagWithProducts(products))
  }, [products, productsLoading])

  const items = useMemo(
    () =>
      bag
        .map((item) => {
          const product = products.find(
            (product) => product.id === item.productId,
          )

          if (!product) {
            return null
          }

          return {
            product,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [bag, products],
  )

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const itemCount = bag.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const changeQuantity = (
    productId: string,
    quantity: number,
    size?: string,
    color?: string,
  ) => {
    const product = products.find((item) => item.id === productId)

    if (!product) return

    const stock = product.stock ?? 0
    const safeQuantity = Math.min(
      Math.max(1, quantity),
      stock,
    )

    if (stock <= 0) {
      removeFromBag(productId, size, color)
      refreshBag()
      return
    }

    updateBagQuantity(
      productId,
      safeQuantity,
      size,
      color,
    )
    refreshBag()
  }

  const removeItem = (
    productId: string,
    size?: string,
    color?: string,
  ) => {
    removeFromBag(productId, size, color)
    refreshBag()
  }

  return (
    <main className="bag-page">
      <header className="bag-header">
        <button
          className="bag-logo"
          onClick={() => onNavigate('home')}
          aria-label="THAANE home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <nav className="bag-navigation">
          <button onClick={() => onNavigate('home')}>HOME</button>
          <button onClick={() => onNavigate('new-in')}>NEW IN</button>
          <button onClick={() => onNavigate('clothing')}>CLOTHING</button>
          <button onClick={() => onNavigate('sarees')}>SAREES</button>
          <button onClick={() => onNavigate('accessories')}>ACCESSORIES</button>
          <button onClick={() => onNavigate('journal')}>JOURNAL</button>
        </nav>

        <div className="bag-header-icon">
          <ShoppingBag size={19} strokeWidth={1.4} />
          <span>{itemCount}</span>
        </div>
      </header>

      <nav
        className="bag-mobile-bottom"
        aria-label="Mobile navigation"
      >
        <button onClick={() => onNavigate('home')}>
          <Home size={20} strokeWidth={1.4} />
          <span>HOME</span>
        </button>

        <button onClick={() => onNavigate('new-in')}>
          <Grid3X3 size={20} strokeWidth={1.4} />
          <span>SHOP</span>
        </button>

        <button onClick={() => onNavigate('wishlist')}>
          <Heart size={20} strokeWidth={1.4} />
          <span>WISHLIST</span>
        </button>

        <button className="active" onClick={() => onNavigate('bag')}>
          <ShoppingBag size={20} strokeWidth={1.4} />
          <span>BAG</span>
        </button>

        <button onClick={() => onNavigate('account')}>
          <User size={20} strokeWidth={1.4} />
          <span>ACCOUNT</span>
        </button>
      </nav>

      <section className="bag-content">
        <div className="bag-title-area">
          <p>THAANE</p>
          <h1>YOUR BAG</h1>
          <span>
            {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
          </span>
        </div>

        {productsLoading && bag.length > 0 ? (
          <div className="bag-empty">
            <ShoppingBag size={34} strokeWidth={1} />
            <h2>LOADING YOUR BAG</h2>
            <p>Updating your THAANE collection details.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bag-empty">
            <ShoppingBag size={34} strokeWidth={1} />
            <h2>YOUR BAG IS EMPTY</h2>
            <p>
              Discover the THAANE edit and find something
              beautiful for your wardrobe.
            </p>
            <button onClick={() => onNavigate('collections')}>
              EXPLORE COLLECTIONS
            </button>
          </div>
        ) : (
          <div className="bag-layout">
            <section className="bag-items">
              {items.map(({ product, quantity, size, color }) => (
                <article
                  className="bag-item"
                  key={`${product.id}-${size || ''}-${color || ''}`}
                >
                  <button
                    className="bag-item-image"
                    onClick={() =>
                      onNavigate(`product/${product.id}`)
                    }
                    aria-label={`View ${product.name}`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                    <span>
                      THAANE
                      <small>PRODUCT IMAGE</small>
                    </span>
                  </button>

                  <div className="bag-item-details">
                    <span className="bag-item-category">
                      {product.category.replace('-', ' ').toUpperCase()}
                    </span>

                    <h2>{product.name}</h2>

                    <p className="bag-item-price">
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>

                    {(color || size) && (
                      <div className="bag-item-variant">
                        {color && (
                          <span>
                            <strong>COLOUR</strong>
                            {color}
                          </span>
                        )}

                        {size && (
                          <span>
                            <strong>SIZE</strong>
                            {size}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="bag-item-controls">
                      <div className="bag-quantity">
                        <button
                          onClick={() =>
                            changeQuantity(
                              product.id,
                              Math.max(1, quantity - 1),
                              size,
                              color,
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>

                        <span>{quantity}</span>

                        <button
                          onClick={() =>
                            changeQuantity(
                              product.id,
                              quantity + 1,
                              size,
                              color,
                            )
                          }
                          aria-label="Increase quantity"
                          disabled={
                            quantity >= (product.stock ?? 0)
                          }
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        className="bag-remove"
                        onClick={() =>
                          removeItem(product.id, size, color)
                        }
                      >
                        <Trash2 size={14} />
                        REMOVE
                      </button>
                    </div>
                  </div>

                  <div className="bag-item-total">
                    ₹
                    {(product.price * quantity).toLocaleString(
                      'en-IN',
                    )}
                  </div>
                </article>
              ))}
            </section>

            <aside className="bag-summary">
              <p>ORDER SUMMARY</p>

              <div>
                <span>SUBTOTAL</span>
                <strong>
                  ₹{total.toLocaleString('en-IN')}
                </strong>
              </div>

              <small>
                Shipping and taxes calculated at checkout.
              </small>

              <button
                onClick={() => onNavigate('checkout')}
              >
                CHECKOUT
              </button>

              <button
                className="bag-continue"
                onClick={() => onNavigate('collections')}
              >
                <ArrowLeft size={14} />
                CONTINUE SHOPPING
              </button>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}
