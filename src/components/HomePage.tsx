import { useEffect, useState } from 'react'
import {
  Grid3X3,
  Heart,
  Home,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
  LogOut,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { AuthCard } from './AuthCard'
import { auth } from '../lib/firebase'
import { getBagCount } from '../lib/bag'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type HomePageProps = {
  user?: {
    displayName?: string | null
    email?: string | null
    phoneNumber?: string | null
  } | null
  openAccount?: boolean
  customerCareAuthorized?: boolean
}

const categories = [
  'NEW IN',
  'CLOTHING',
  'SAREES',
  'ACCESSORIES',
]

export default function HomePage({
  user,
  openAccount = false,
  customerCareAuthorized = false,
}: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(openAccount)
  const [showAuthPopup, setShowAuthPopup] = useState(false)

  useEffect(() => {
    setMenuOpen(openAccount)
  }, [openAccount])
  const [bagCount, setBagCount] = useState(0)
  const { products } = useFirestoreProducts()

  useEffect(() => {
    const updateBagCount = () => {
      setBagCount(getBagCount(products))
    }

    updateBagCount()
    window.addEventListener('hashchange', updateBagCount)
    window.addEventListener('thaane-bag-updated', updateBagCount)

    return () => {
      window.removeEventListener('hashchange', updateBagCount)
      window.removeEventListener('thaane-bag-updated', updateBagCount)
    }
  }, [products])

  const navigate = (section: string) => {
    setMenuOpen(false)

    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.location.hash = section
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setMenuOpen(false)
      window.location.hash = 'home'
    } catch (error) {
      console.error('THAANE logout failed:', error)
    }
  }

  return (
    <div className="thaane-home">

      {/* Luxury background */}
      <div className="home-background" aria-hidden="true" />

      {/* HEADER */}
      <header className="home-header">

        <button
          className="home-logo"
          onClick={() => navigate('home')}
          aria-label="THAANE Home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <nav className="home-navigation">
          <button onClick={() => navigate('home')}>HOME</button>
          <button onClick={() => navigate('new-in')}>NEW IN</button>
          <button onClick={() => navigate('clothing')}>CLOTHING</button>
          <button onClick={() => navigate('sarees')}>SAREES</button>
          <button onClick={() => navigate('accessories')}>ACCESSORIES</button>
          <button onClick={() => navigate('journal')}>JOURNAL</button>
          <button onClick={() => navigate('our-story')}>OUR STORY</button>
          <button onClick={() => navigate('contact')}>CONTACT</button>
        </nav>

        <div className="home-actions">

          <button
            onClick={() => navigate('search')}
            aria-label="Search"
          >
            <Search size={20} strokeWidth={1.4} />
          </button>

          <button
            onClick={() => navigate('bag')}
            aria-label="Shopping bag"
          >
            <ShoppingBag size={21} strokeWidth={1.4} />
            {bagCount > 0 && (
              <span className="home-bag-count">{bagCount}</span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Account"
            className="account-desktop"
          >
            <User size={20} strokeWidth={1.4} />
          </button>

          <button
            className="home-logout"
            onClick={logout}
          >
            <LogOut size={16} strokeWidth={1.4} />
            <span>LOG OUT</span>
          </button>

          <button
            className="home-mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.4} />
          </button>

        </div>

      </header>

      {/* HERO */}
      <main className="home-hero">

        <section className="home-copy">

          <p className="home-kicker">
            SOMETHING BEAUTIFUL
            <br />
            IS ON ITS WAY
          </p>

          <div className="home-brand-lockup">
            <img src="/thaane-logo-black.png" alt="THAANE" />
          </div>

          <p className="home-tagline">
            WOMEN'S FASHION
            <br />
            FOR MODERN STORIES
          </p>

          <div className="home-rule" />

          <h1>
            LAUNCHING
            <br />
            SOON
          </h1>

          <p className="home-description">
            Timeless silhouettes. Modern elegance.
            <br />
            A new way to experience women's fashion.
          </p>

          <button
            className="home-cta"
            onClick={() => navigate('new-in')}
          >
            <span>EXPLORE THAANE</span>
            <strong>→</strong>
          </button>

        </section>

      </main>

      {/* CATEGORY STRIP */}
      <section className="home-category-strip">

        {categories.map((category, index) => (
          <button
            key={category}
            onClick={() => navigate(category.toLowerCase().replace(' ', '-'))}
          >
            <span className="category-number">
              0{index + 1}
            </span>

            <span className="category-name">
              {category}
            </span>
          </button>
        ))}

      </section>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="home-mobile-bottom"
        aria-label="Mobile navigation"
      >

        <button
          className="active"
          onClick={() => navigate('home')}
        >
          <Home size={20} strokeWidth={1.4} />
          <span>HOME</span>
        </button>

        <button onClick={() => navigate('new-in')}>
          <Grid3X3 size={20} strokeWidth={1.4} />
          <span>SHOP</span>
        </button>

        <button onClick={() => navigate('wishlist')}>
          <Heart size={20} strokeWidth={1.4} />
          <span>WISHLIST</span>
        </button>

        <button onClick={() => navigate('bag')}>
          <ShoppingBag size={20} strokeWidth={1.4} />
          <span>BAG</span>
        </button>

        <button onClick={() => setMenuOpen(true)}>
          <User size={20} strokeWidth={1.4} />
          <span>ACCOUNT</span>
        </button>

      </nav>

      {/* ACCOUNT MENU */}
      {menuOpen && (
        <div className="home-account-overlay">

          <div className="home-account-panel">

            <div className="account-top">
              <span>THAANE</span>

              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={23} strokeWidth={1.4} />
              </button>
            </div>

            <div className="account-user">

              <div className="account-avatar">
                {(
                  user?.displayName?.[0] ||
                  user?.email?.[0] ||
                  'T'
                ).toUpperCase()}
              </div>

              <div>
                <strong>
                  {user?.displayName || 'THAANE GUEST'}
                </strong>

                <small>
                  {user?.email ||
                    user?.phoneNumber ||
                    'Sign in to your THAANE account'}
                </small>
              </div>

            </div>

            {!user && (
              <button
                className="account-sign-in"
                onClick={() => {
                  setMenuOpen(false)
                  setShowAuthPopup(true)
                }}
              >
                SIGN IN
              </button>
            )}

            <button onClick={() => navigate('home')}>
              HOME
            </button>

            <button onClick={() => navigate('new-in')}>
              NEW IN
            </button>

            <button onClick={() => navigate('clothing')}>
              CLOTHING
            </button>

            <button onClick={() => navigate('sarees')}>
              SAREES
            </button>

            <button onClick={() => navigate('accessories')}>
              ACCESSORIES
            </button>

            <button onClick={() => navigate('journal')}>
              JOURNAL
            </button>

            <button onClick={() => navigate('bag')}>
              BAG
            </button>

            {user && (
              <>
                {user.email?.toLowerCase() === 'princevenkatesh879@gmail.com' && (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('admin')
                    }}
                  >
                    ADMIN DASHBOARD
                  </button>
                )}

                {customerCareAuthorized && (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      navigate('customer-care')
                    }}
                  >
                    CUSTOMER SUPPORT
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('orders')
                  }}
                >
                  MY ORDERS
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate('addresses')
                  }}
                >
                  SAVED ADDRESSES
                </button>

                <button
                  className="account-logout"
                  onClick={logout}
                >
                  <LogOut size={17} strokeWidth={1.4} />
                  LOG OUT
                </button>
              </>
            )}

          </div>

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

    </div>
  )
}
