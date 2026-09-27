import { ArrowRight } from 'lucide-react'

type SiteFooterProps = {
  onNavigate: (page: string) => void
}

export default function SiteFooter({ onNavigate }: SiteFooterProps) {
  const navigate = (page: string) => {
    onNavigate(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-main">

        <div className="site-footer-brand">
          <button
            type="button"
            className="site-footer-logo"
            onClick={() => navigate('home')}
          >
            THAANE
          </button>

          <p className="site-footer-tagline">
            TIMELESS BEAUTY · A BRIGHTER YOU
          </p>

          <p className="site-footer-description">
            Contemporary women's fashion created for modern stories,
            thoughtful wardrobes and timeless expression.
          </p>
        </div>

        <div className="site-footer-column">
          <p className="site-footer-heading">SHOP</p>

          <button onClick={() => navigate('new-in')}>NEW IN</button>
          <button onClick={() => navigate('clothing')}>CLOTHING</button>
          <button onClick={() => navigate('sarees')}>SAREES</button>
          <button onClick={() => navigate('accessories')}>ACCESSORIES</button>
          <button onClick={() => navigate('collections')}>COLLECTIONS</button>
        </div>

        <div className="site-footer-column">
          <p className="site-footer-heading">THAANE</p>

          <button onClick={() => navigate('our-story')}>OUR STORY</button>
          <button onClick={() => navigate('journal')}>JOURNAL</button>
          <button onClick={() => navigate('contact')}>CONTACT US</button>
          <button onClick={() => navigate('faq')}>FAQ</button>
        </div>

        <div className="site-footer-column">
          <p className="site-footer-heading">CUSTOMER CARE</p>

          <button onClick={() => navigate('shipping')}>SHIPPING & DELIVERY</button>
          <button onClick={() => navigate('returns')}>RETURNS & EXCHANGES</button>
          <button onClick={() => navigate('cancellation')}>CANCELLATION</button>
          <button onClick={() => navigate('privacy')}>PRIVACY POLICY</button>
          <button onClick={() => navigate('terms')}>TERMS & CONDITIONS</button>
        </div>

        <div className="site-footer-column site-footer-account">
          <p className="site-footer-heading">ACCOUNT</p>

          <button onClick={() => navigate('account')}>MY ACCOUNT</button>
          <button onClick={() => navigate('wishlist')}>WISHLIST</button>
          <button onClick={() => navigate('bag')}>MY BAG</button>

          <button
            className="site-footer-support"
            onClick={() => navigate('contact')}
          >
            CUSTOMER SUPPORT
            <ArrowRight size={14} strokeWidth={1.2} />
          </button>
        </div>

      </div>

      <div className="site-footer-bottom">
        <span>© 2026 THAANE</span>
        <span>TIMELESS BEAUTY · A BRIGHTER YOU</span>
        <span>MADE FOR MODERN STORIES</span>
      </div>
    </footer>
  )
}
