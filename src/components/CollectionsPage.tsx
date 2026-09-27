import { useEffect, useState } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import ProductGrid from './ProductGrid'
import {
  ArrowRight,
  ChevronDown,
  Search,
  ShoppingBag,
  User,
} from 'lucide-react'
import { getBagCount } from '../lib/bag'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type CollectionsPageProps = {
  onNavigate: (page: string) => void
  user?: FirebaseUser | null
}

const categories = [
  {
    number: '01',
    title: 'NEW IN',
    subtitle: 'THE LATEST EDIT',
  },
  {
    number: '02',
    title: 'CLOTHING',
    subtitle: 'MODERN SILHOUETTES',
  },
  {
    number: '03',
    title: 'SAREES',
    subtitle: 'TIMELESS WEAVES',
  },
  {
    number: '04',
    title: 'ACCESSORIES',
    subtitle: 'THE FINISHING TOUCH',
  },
]

const clothing = [
  'DRESSES',
  'TOPS',
  'BLOUSES',
  'CO-ORDS',
  'KURTAS',
  'TROUSERS',
]

const accessories = [
  'BAGS',
  'JEWELLERY',
  'FOOTWEAR',
  'SCARVES',
]

export default function CollectionsPage({
  onNavigate,
  user,
}: CollectionsPageProps) {
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
  return (
    <div className="collections-page">

      {/* HEADER */}
      <header className="collections-header">

        <button
          className="collections-logo"
          onClick={() => onNavigate('home')}
          aria-label="THAANE Home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <nav className="collections-nav">
          <button onClick={() => onNavigate('home')}>HOME</button>
          <button className="active">NEW IN</button>
          <button onClick={() => onNavigate('clothing')}>CLOTHING</button>
          <button onClick={() => onNavigate('sarees')}>SAREES</button>
          <button onClick={() => onNavigate('accessories')}>
            ACCESSORIES
          </button>
          <button onClick={() => onNavigate('journal')}>JOURNAL</button>
        </nav>

        <div className="collections-actions">

          <button
            aria-label="Search"
            onClick={() => onNavigate('search')}
          >
            <Search size={20} strokeWidth={1.35} />
          </button>

          <button
            aria-label="Shopping bag"
            onClick={() => onNavigate('bag')}
          >
            <ShoppingBag size={20} strokeWidth={1.35} />
            {bagCount > 0 && (
              <span className="collections-bag-count">
                {bagCount}
              </span>
            )}
          </button>

          <button
            aria-label="Account"
            onClick={() => onNavigate('account')}
          >
            <User size={20} strokeWidth={1.35} />
          </button>

        </div>

      </header>

      {/* INTRO */}
      <section className="collections-intro">

        <p className="collections-kicker">
          THE THAANE EDIT
        </p>

        <h1>
          COLLECTIONS
        </h1>

        <div className="collections-rule" />

        <p>
          A considered wardrobe of women's fashion,
          <br />
          created for modern stories.
        </p>

      </section>

      {/* CATEGORY NAVIGATION */}
      <section className="category-navigation">

        {categories.map((category) => (
          <button
            key={category.number}
            onClick={() =>
              onNavigate(category.title.toLowerCase().replace(' ', '-'))
            }
          >
            <span>{category.number}</span>

            <strong>{category.title}</strong>

            <small>{category.subtitle}</small>

            <ArrowRight size={17} strokeWidth={1.2} />
          </button>
        ))}

      </section>

      {/* PRODUCT CATALOG */}
      <ProductGrid
        user={user}
        title="THE THAANE EDIT"
        subtitle="Women's fashion for modern stories."
        onProduct={(id) => {
          onNavigate(`product/${id}`)
        }}
      />

      {/* CLOTHING */}
      <section className="category-section">

        <div className="category-section-heading">

          <div>
            <span>02</span>
            <h2>CLOTHING</h2>
          </div>

          <p>
            Modern silhouettes designed
            <br />
            for everyday elegance.
          </p>

        </div>

        <div className="category-links">

          {clothing.map((item, index) => (
            <button
              key={item}
              onClick={() =>
                onNavigate(item.toLowerCase().replace(' ', '-'))
              }
            >
              <span>0{index + 1}</span>
              <strong>{item}</strong>
              <ArrowRight size={15} strokeWidth={1.2} />
            </button>
          ))}

        </div>

      </section>

      {/* SAREES */}
      <section className="saree-feature">

        <div className="saree-feature-image">
          <img
            src="/assets/thaane-coming-bg.png"
            alt=""
          />
        </div>

        <div className="saree-feature-copy">

          <span>03</span>

          <h2>
            SAREES
          </h2>

          <div />

          <p>
            Timeless Indian craftsmanship
            <br />
            interpreted for the modern woman.
          </p>

          <button onClick={() => onNavigate('sarees')}>
            DISCOVER SAREES
            <ArrowRight size={18} strokeWidth={1.2} />
          </button>

        </div>

      </section>

      {/* ACCESSORIES */}
      <section className="category-section accessories-section">

        <div className="category-section-heading">

          <div>
            <span>04</span>
            <h2>ACCESSORIES</h2>
          </div>

          <p>
            The finishing details
            <br />
            that complete the story.
          </p>

        </div>

        <div className="category-links accessory-links">

          {accessories.map((item, index) => (
            <button
              key={item}
              onClick={() =>
                onNavigate(item.toLowerCase())
              }
            >
              <span>0{index + 1}</span>
              <strong>{item}</strong>
              <ArrowRight size={15} strokeWidth={1.2} />
            </button>
          ))}

        </div>

      </section>

      {/* COMING SOON */}
      <section className="collections-coming">

        <p>THAANE WOMEN'S FASHION</p>

        <h2>
          SOMETHING BEAUTIFUL
          <br />
          IS COMING SOON
        </h2>

        <button onClick={() => onNavigate('home')}>
          RETURN HOME
          <ArrowRight size={17} strokeWidth={1.2} />
        </button>

      </section>

      {/* FOOTER */}
      <footer className="collections-footer">

        <span>THAANE</span>

        <span>
          TIMELESS BEAUTY · A BRIGHTER YOU
        </span>

        <span>© 2026</span>

      </footer>

    </div>
  )
}
