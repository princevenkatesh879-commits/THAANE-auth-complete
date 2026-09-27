import { useState } from 'react'
import {
  BookOpen,
  Grid3X3,
  Home,
  LogOut,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

type ComingSoonProps = {
  user?: {
    displayName?: string | null
    email?: string | null
    phoneNumber?: string | null
  } | null
}

export default function ComingSoon({ user }: ComingSoonProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const goHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMenuOpen(false)
  }

  const comingSoon = () => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <div className="coming-page">

      {/* Clean background artwork — contains NO text or logo */}
      <div className="coming-background" aria-hidden="true" />

      {/* Desktop header */}
      <header className="coming-header">
        <button
          className="coming-brand"
          onClick={goHome}
          aria-label="THAANE home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <nav className="coming-desktop-nav" aria-label="Main navigation">
          <button onClick={goHome}>HOME</button>
          <button onClick={comingSoon}>OUR STORY</button>
          <button onClick={comingSoon}>COLLECTIONS</button>
          <button onClick={comingSoon}>JOURNAL</button>
          <button onClick={comingSoon}>CONTACT</button>
        </nav>

        <div className="coming-actions">
          <button onClick={comingSoon} aria-label="Search">
            <Search size={20} strokeWidth={1.5} />
          </button>

          <button onClick={comingSoon} aria-label="Shopping bag">
            <ShoppingBag size={21} strokeWidth={1.5} />
          </button>

          <button className="desktop-logout" onClick={logout}>
            <LogOut size={17} strokeWidth={1.5} />
            <span>LOG OUT</span>
          </button>

          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open account"
          >
            <User size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main editorial content */}
      <main className="coming-hero">

        <section className="coming-editorial">

          <p className="coming-kicker">
            SOMETHING BEAUTIFUL
            <br />
            IS ON ITS WAY
          </p>

          <div className="coming-logo-lockup">
            <img src="/thaane-logo-black.png" alt="THAANE" />
          </div>

          <div className="coming-divider" />

          <p className="coming-subtitle">
            A CURATED SAREE EXPERIENCE
            <br />
            FOR MODERN STORIES
          </p>

          <h1>LAUNCHING SOON</h1>

          <p className="coming-description">
            Timeless weaves. Modern elegance.
            <br />
            A new way to experience sarees — coming in a few days.
          </p>

          <button className="notify-button" onClick={comingSoon}>
            <span>BE THE FIRST TO KNOW</span>
            <span className="notify-arrow">→</span>
          </button>

          <p className="coming-microcopy">
            Sign up for launch updates, exclusive previews and special offers.
          </p>

          <div className="coming-values">
            <div>
              <span className="value-icon">♧</span>
              <strong>FINEST</strong>
              <small>FABRICS</small>
            </div>

            <div>
              <span className="value-icon">✥</span>
              <strong>HERITAGE</strong>
              <small>CRAFTSMANSHIP</small>
            </div>

            <div>
              <span className="value-icon">◇</span>
              <strong>TIMELESS</strong>
              <small>ELEGANCE</small>
            </div>

            <div>
              <span className="value-icon">♧</span>
              <strong>FOR</strong>
              <small>MODERN YOU</small>
            </div>
          </div>
        </section>

        <div className="coming-side-caption">
          <span>More<br />Than a Saree</span>
          <i />
        </div>

        <div className="coming-bottom-caption">
          <i />
          <span>
            A MORE BEAUTIFUL YOU
            <br />
            IS COMING SOON
          </span>
        </div>

      </main>

      {/* Mobile account menu */}
      {menuOpen && (
        <div className="mobile-menu">

          <div className="mobile-menu-top">
            <span>THAANE</span>

            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="mobile-menu-user">
            <div className="mobile-avatar">
              {(user?.displayName?.[0] || user?.email?.[0] || 'T').toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.displayName || 'THAANE MEMBER'}
              </strong>

              <small>
                {user?.email || user?.phoneNumber || 'Welcome to THAANE'}
              </small>
            </div>
          </div>

          <button onClick={goHome}>HOME</button>
          <button onClick={comingSoon}>OUR STORY</button>
          <button onClick={comingSoon}>COLLECTIONS</button>
          <button onClick={comingSoon}>JOURNAL</button>
          <button onClick={comingSoon}>CONTACT</button>

          <button className="mobile-logout" onClick={logout}>
            <LogOut size={18} strokeWidth={1.5} />
            LOG OUT
          </button>

        </div>
      )}

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">

        <button className="active" onClick={goHome}>
          <Home size={20} strokeWidth={1.5} />
          <span>Home</span>
        </button>

        <button onClick={comingSoon}>
          <Grid3X3 size={20} strokeWidth={1.5} />
          <span>Shop</span>
        </button>

        <button onClick={comingSoon}>
          <BookOpen size={20} strokeWidth={1.5} />
          <span>Journal</span>
        </button>

        <button onClick={comingSoon}>
          <ShoppingBag size={20} strokeWidth={1.5} />
          <span>Bag</span>
        </button>

        <button onClick={() => setMenuOpen(true)}>
          <User size={20} strokeWidth={1.5} />
          <span>Account</span>
        </button>

      </nav>

    </div>
  )
}
