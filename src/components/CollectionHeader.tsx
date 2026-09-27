import { useEffect, useState } from 'react'
import {
  Grid3X3,
  Heart,
  Home,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'
import { getWishlist, WISHLIST_UPDATED_EVENT } from '../lib/wishlist'
import { getBagCount } from '../lib/bag'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type CollectionHeaderProps = {
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { label: 'HOME', page: 'home' },
  { label: 'NEW IN', page: 'new-in' },
  { label: 'CLOTHING', page: 'clothing' },
  { label: 'SAREES', page: 'sarees' },
  { label: 'ACCESSORIES', page: 'accessories' },
  { label: 'JOURNAL', page: 'journal' },
  { label: 'OUR STORY', page: 'our-story' },
  { label: 'CONTACT', page: 'contact' },
]

export default function CollectionHeader({
  currentPage,
  onNavigate,
}: CollectionHeaderProps) {
  const [wishlistCount, setWishlistCount] = useState(() => getWishlist().length)
  const [bagCount, setBagCount] = useState(0)
  const { products } = useFirestoreProducts()

  useEffect(() => {
    const updateWishlistCount = () => {
      setWishlistCount(getWishlist().length)
    }

    updateWishlistCount()
    window.addEventListener(WISHLIST_UPDATED_EVENT, updateWishlistCount)

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, updateWishlistCount)
    }
  }, [])

  useEffect(() => {
    const updateBagCount = () => {
      setBagCount(getBagCount(products))
    }

    updateBagCount()
    window.addEventListener('thaane-bag-updated', updateBagCount)
    window.addEventListener('hashchange', updateBagCount)

    return () => {
      window.removeEventListener('thaane-bag-updated', updateBagCount)
      window.removeEventListener('hashchange', updateBagCount)
    }
  }, [products])

  return (
    <>
      <header className="collection-site-header">

      <button
        className="collection-site-logo"
        onClick={() => onNavigate('home')}
        aria-label="THAANE Home"
      >
        <img src="/thaane-logo-black.png" alt="THAANE" />
      </button>

      <nav
        className="collection-site-navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          <button
            key={item.page}
            className={
              currentPage === item.page ? 'active' : ''
            }
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="collection-site-actions">

        <button
          onClick={() => onNavigate('search')}
          aria-label="Search"
        >
          <Search size={20} strokeWidth={1.4} />
        </button>

        <button
          onClick={() => onNavigate('wishlist')}
          aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount})` : ''}`}
        >
          <Heart size={20} strokeWidth={1.4} />
          {wishlistCount > 0 && (
            <span className="collection-header-count">
              {wishlistCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('bag')}
          aria-label={`Shopping bag${bagCount > 0 ? ` (${bagCount})` : ''}`}
        >
          <ShoppingBag size={21} strokeWidth={1.4} />
          {bagCount > 0 && (
            <span className="collection-header-count">
              {bagCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('account')}
          aria-label="Account"
        >
          <User size={20} strokeWidth={1.4} />
        </button>

      </div>

    </header>

    <nav
      className="collection-mobile-bottom"
      aria-label="Mobile navigation"
    >
      <button
        className={currentPage === 'home' ? 'active' : ''}
        onClick={() => onNavigate('home')}
      >
        <Home size={20} strokeWidth={1.4} />
        <span>HOME</span>
      </button>

      <button
        className={
          ['new-in', 'clothing', 'sarees', 'accessories'].includes(
            currentPage,
          )
            ? 'active'
            : ''
        }
        onClick={() => onNavigate('new-in')}
      >
        <Grid3X3 size={20} strokeWidth={1.4} />
        <span>SHOP</span>
      </button>

      <button
        className={currentPage === 'wishlist' ? 'active' : ''}
        onClick={() => onNavigate('wishlist')}
      >
        <Heart size={20} strokeWidth={1.4} />
        <span>
          WISHLIST
          {wishlistCount > 0 && (
            <b className="collection-mobile-count">{wishlistCount}</b>
          )}
        </span>
      </button>

      <button onClick={() => onNavigate('bag')}>
        <ShoppingBag size={20} strokeWidth={1.4} />
        <span>
          BAG
          {bagCount > 0 && (
            <b className="collection-mobile-count">{bagCount}</b>
          )}
        </span>
      </button>

      <button onClick={() => onNavigate('account')}>
        <User size={20} strokeWidth={1.4} />
        <span>ACCOUNT</span>
      </button>
    </nav>
    </>
  )
}
