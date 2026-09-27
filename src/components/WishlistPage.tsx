import CollectionHeader from './CollectionHeader'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'
import {
  getWishlist,
  removeFromWishlist,
} from '../lib/wishlist'

type WishlistPageProps = {
  onNavigate: (page: string) => void
}

export default function WishlistPage({
  onNavigate,
}: WishlistPageProps) {
  const [wishlistIds, setWishlistIds] = useState<string[]>(getWishlist())
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
  }, [])

  const wishlistProducts = useMemo(
    () =>
      wishlistIds
        .map((id) => products.find((product) => product.id === id))
        .filter(
          (product): product is NonNullable<typeof product> =>
            product !== undefined,
        ),
    [wishlistIds, products],
  )

  const removeItem = (productId: string) => {
    removeFromWishlist(productId)
    setWishlistIds(getWishlist())
  }

  return (
    <main className="wishlist-page">
      <CollectionHeader
        currentPage="wishlist"
        onNavigate={onNavigate}
      />

      <section className="wishlist-content">
        <div className="wishlist-intro">
          <span>YOUR SAVED EDIT</span>
          <h1>WISHLIST</h1>
          <p>
            Pieces you've chosen to keep close.
          </p>
        </div>

        {loading ? (
          <div className="wishlist-empty">
            <Heart size={34} strokeWidth={1} />
            <h2>LOADING YOUR WISHLIST</h2>
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="wishlist-empty">
            <Heart size={34} strokeWidth={1} />
            <h2>YOUR WISHLIST IS EMPTY</h2>
            <p>
              Save pieces you love and return to them whenever
              you're ready.
            </p>
            <button onClick={() => onNavigate('new-in')}>
              EXPLORE NEW IN
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlistProducts.map((product) => (
              <article
                className="wishlist-card"
                key={product.id}
              >
                <button
                  className="wishlist-card-image"
                  onClick={() =>
                    onNavigate(`product/${product.id}`)
                  }
                  aria-label={`View ${product.name}`}
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span>THAANE</span>
                  )}
                </button>

                <div className="wishlist-card-info">
                  <div>
                    <small>{product.category}</small>
                    <h2>{product.name}</h2>
                    <p>
                      ₹{product.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="wishlist-card-actions">
                    <button
                      onClick={() =>
                        onNavigate(`product/${product.id}`)
                      }
                    >
                      <ShoppingBag
                        size={15}
                        strokeWidth={1.3}
                      />
                      VIEW PIECE
                    </button>

                    <button
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      <Trash2
                        size={15}
                        strokeWidth={1.3}
                      />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
