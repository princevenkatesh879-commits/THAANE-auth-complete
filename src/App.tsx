import { useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { AuthCard } from './components/AuthCard'
import { BrandPanel } from './components/BrandPanel'
import BrandIntro from './components/BrandIntro'
import HomePage from './components/HomePage'
import CollectionsPage from './components/CollectionsPage'
import NewInPage from './components/NewInPage'
import ClothingPage from './components/ClothingPage'
import SareesPage from './components/SareesPage'
import AccessoriesPage from './components/AccessoriesPage'
import JournalPage from './components/JournalPage'
import OurStoryPage from './components/OurStoryPage'
import ContactPage from './components/ContactPage'
import WishlistPage from './components/WishlistPage'
import ProductDetailPage from './components/ProductDetailPage'
import BagPage from './components/BagPage'
import CheckoutPage from './components/CheckoutPage'
import PaymentPage from './components/PaymentPage'
import AdminPage from './components/AdminPage'
import AdminProductsPage from './components/AdminProductsPage'
import AdminInventoryPage from './components/AdminInventoryPage'
import AdminCatalogSync from './components/AdminCatalogSync'
import SiteFooter from './components/SiteFooter'
import ThaaneConcierge from './components/ThaaneConcierge'
import AdminOrdersPage from './components/AdminOrdersPage'
import AdminCustomersPage from './components/AdminCustomersPage'
import AdminCustomerCarePage from './components/AdminCustomerCarePage'
import AdminCustomerCareStaffPage from './components/AdminCustomerCareStaffPage'
import MyOrdersPage from './components/MyOrdersPage'
import InfoPage from './components/InfoPage'
import SavedAddressesPage from './components/SavedAddressesPage'
import { auth } from './lib/firebase'
import { isAdmin } from './lib/admin'
import { setWishlistUser } from './lib/wishlist'
import { setBagUser } from './lib/bag'

export default function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [customerCareAuthorized, setCustomerCareAuthorized] = useState(false)
  const [customerCareAuthError, setCustomerCareAuthError] = useState('')
  const [page, setPage] = useState('home')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)
        setWishlistUser(currentUser?.uid ?? null)
        setBagUser(currentUser?.uid ?? null)

        if (!currentUser) {
          setCustomerCareAuthorized(false)
          setCustomerCareAuthError('Please sign in first.')
          setAuthReady(true)
          return
        }

        try {
          const idToken = await currentUser.getIdToken()

          const response = await fetch(
            'http://localhost:4242/api/customer-care/access',
            {
              headers: {
                Authorization: `Bearer ${idToken}`,
              },
            },
          )

          const data = await response.json().catch(() => ({}))

          if (response.ok) {
            setCustomerCareAuthorized(data.authorized === true)
            setCustomerCareAuthError('')
          } else {
            setCustomerCareAuthorized(false)
            setCustomerCareAuthError(
              data?.error ||
                `Customer Care authorization failed (${response.status}).`,
            )
            console.error(
              'Customer Care authorization failed:',
              response.status,
              data,
            )
          }
        } catch (error) {
          console.error(
            'Failed to verify Customer Care access:',
            error,
          )
          setCustomerCareAuthorized(false)
          setCustomerCareAuthError(
            error instanceof Error
              ? error.message
              : 'Unable to verify Customer Care access.',
          )
        } finally {
          setAuthReady(true)
        }
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    const updatePage = () => {
      const hash = window.location.hash.replace('#', '')

      if (hash.startsWith('product/')) {
        setSelectedProductId(hash.replace('product/', ''))
        setPage('product')
      } else {
        setSelectedProductId(null)
        setPage(hash || 'home')
      }
    }

    updatePage()
    window.addEventListener('hashchange', updatePage)

    return () => {
      window.removeEventListener('hashchange', updatePage)
    }
  }, [])

  const renderStorefront = (content: ReactNode) => (
    <>
      {content}
      <SiteFooter onNavigate={navigate} />
      <ThaaneConcierge
        userName={user?.displayName || null}
        userEmail={user?.email || null}
        userId={user?.uid || null}
        onNavigate={navigate}
      />
    </>
  )

  const navigate = (nextPage: string) => {
    if (nextPage.startsWith('product/')) {
      setSelectedProductId(nextPage.replace('product/', ''))
      setPage('product')
    } else {
      setSelectedProductId(null)
      setPage(nextPage)
    }

    window.location.hash = nextPage
  }

  if (showIntro) {
    return (
      <BrandIntro
        onComplete={() => {
          setShowIntro(false)
        }}
      />
    )
  }

  if (!authReady) {
    return null
  }

  if (page === 'admin-orders') {
    if (!isAdmin(user)) {
      window.location.hash = 'home'
      return <HomePage user={user} />
    }

    return <AdminOrdersPage onNavigate={navigate} />
  }

  if (page === 'admin-customers') {
    if (!isAdmin(user)) {
      window.location.hash = 'home'
      return <HomePage user={user} />
    }

    return <AdminCustomersPage onNavigate={navigate} />
  }

  if (page === 'admin-customer-care-staff') {
    if (!isAdmin(user)) {
      return null
    }

    return <AdminCustomerCareStaffPage onNavigate={navigate} />
  }

  if (page === 'admin-customer-care') {
    if (!isAdmin(user)) {
      window.location.hash = 'home'
      return <HomePage user={user} />
    }

    return <AdminCustomerCarePage onNavigate={navigate} />
  }

  if (page === 'customer-care') {
    if (!customerCareAuthorized) {
      return (
        <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
          <h1>Customer Care Access</h1>
          <p>{customerCareAuthError || 'Customer Care access is not authorized.'}</p>
          <button
            type="button"
            onClick={() => window.location.hash = 'home'}
          >
            BACK HOME
          </button>
        </main>
      )
    }

    return (
      <AdminCustomerCarePage
        onNavigate={navigate}
      />
    )
  }

  if (page === 'orders') {
    return (
      <MyOrdersPage
        onNavigate={navigate}
        user={user}
      />
    )
  }

  if (
    page === 'admin' ||
    page === 'admin-products' ||
    page === 'admin-inventory' ||
    page === 'admin-catalog-sync'
  ) {
    if (!isAdmin(user)) {
      window.location.hash = 'home'
      return <HomePage user={user} />
    }

    if (page === 'admin-products') {
      return <AdminProductsPage onNavigate={navigate} />
    }

    if (page === 'admin-inventory') {
      return <AdminInventoryPage onNavigate={navigate} />
    }

    if (page === 'admin-catalog-sync') {
      return <AdminCatalogSync onNavigate={navigate} />
    }

    return <AdminPage onNavigate={navigate} />
  }

  if (page === 'product' && selectedProductId) {
    return renderStorefront(
      <ProductDetailPage
        productId={selectedProductId}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'wishlist') {
    return renderStorefront(<WishlistPage onNavigate={navigate} />)
  }

  if (page === 'bag') {
    return renderStorefront(<BagPage onNavigate={navigate} user={user} />)
  }

  if (page === 'addresses') {
    return renderStorefront(
      <SavedAddressesPage
        user={user}
        onNavigate={navigate}
      />,
    )
  }

  if (page === 'checkout') {
    return (
      <CheckoutPage
        onNavigate={navigate}
        user={user}
      />
    )
  }

  if (page === 'payment') {
    return (
      <PaymentPage
        onNavigate={navigate}
        user={user}
      />
    )
  }

  if (page === 'collections') {
    return renderStorefront(<CollectionsPage onNavigate={navigate} user={user} />)
  }

  if (page === 'new-in') {
    return renderStorefront(<NewInPage onNavigate={navigate} user={user} />)
  }

  if (page === 'clothing') {
    return renderStorefront(<ClothingPage onNavigate={navigate} user={user} />)
  }

  if (page === 'sarees') {
    return renderStorefront(<SareesPage onNavigate={navigate} user={user} />)
  }

  if (page === 'accessories') {
    return renderStorefront(<AccessoriesPage onNavigate={navigate} user={user} />)
  }

  if (page === 'journal') {
    return renderStorefront(<JournalPage onNavigate={navigate} />)
  }

  if (page === 'our-story') {
    return renderStorefront(<OurStoryPage onNavigate={navigate} />)
  }

  if (page === 'contact') {
    return renderStorefront(<ContactPage onNavigate={navigate} />)
  }

  if (page === 'shipping') {
    return (
      <InfoPage
        title="SHIPPING & DELIVERY"
        eyebrow="THAANE CUSTOMER CARE"
        intro="Everything you need to know about receiving your THAANE order."
        sections={[
          {
            heading: 'ORDER PROCESSING',
            body: 'Orders are carefully prepared after purchase. Processing and dispatch timelines will be confirmed with your order information and may vary during high-demand periods.',
          },
          {
            heading: 'DELIVERY',
            body: 'Delivery timelines depend on the destination and courier service. Once your order has been dispatched, available shipment information will be provided to you.',
          },
          {
            heading: 'TRACKING',
            body: 'When tracking information is available, you will be able to use the tracking details provided for your order to follow its delivery progress.',
          },
          {
            heading: 'DELIVERY SUPPORT',
            body: 'If you have questions about an order or delivery, please contact THAANE Customer Care with your order details so our team can assist you.',
          },
        ]}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'returns') {
    return (
      <InfoPage
        title="RETURNS & EXCHANGES"
        eyebrow="THAANE CUSTOMER CARE"
        intro="Information about returning or exchanging an eligible THAANE purchase."
        sections={[
          {
            heading: 'RETURN REQUESTS',
            body: 'Return requests must follow the conditions applicable to the purchased product. Please keep your order information available when contacting Customer Care.',
          },
          {
            heading: 'PRODUCT CONDITION',
            body: 'Items requested for return or exchange should be kept in their original condition, with applicable packaging, tags and accessories intact.',
          },
          {
            heading: 'EXCHANGES',
            body: 'Where an exchange is available, Customer Care will guide you through the applicable process and product availability.',
          },
          {
            heading: 'CUSTOMER SUPPORT',
            body: 'For help with a return or exchange, contact THAANE Customer Care and provide your order number and the reason for your request.',
          },
        ]}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'cancellation') {
    return (
      <InfoPage
        title="CANCELLATION"
        eyebrow="THAANE CUSTOMER CARE"
        intro="Information about cancelling a THAANE order."
        sections={[
          {
            heading: 'CANCELLATION REQUEST',
            body: 'If you need to cancel an order, contact THAANE Customer Care as soon as possible with your order number.',
          },
          {
            heading: 'ORDER STATUS',
            body: 'Cancellation availability may depend on whether your order has already been processed or dispatched.',
          },
          {
            heading: 'REFUND',
            body: 'Where a cancellation is accepted and a refund applies, Customer Care will provide the applicable refund information and process details.',
          },
        ]}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'privacy') {
    return (
      <InfoPage
        title="PRIVACY POLICY"
        eyebrow="THAANE"
        intro="How THAANE handles information associated with your use of our website and services."
        sections={[
          {
            heading: 'INFORMATION WE COLLECT',
            body: 'Information may be collected when you create an account, place an order, contact Customer Care or otherwise use services provided through THAANE.',
          },
          {
            heading: 'HOW INFORMATION IS USED',
            body: 'Information may be used to provide account services, process orders, support customers, communicate important service information and improve the THAANE experience.',
          },
          {
            heading: 'ACCOUNT SECURITY',
            body: 'Please keep your account credentials and verification information secure. Contact Customer Care if you believe your account has been accessed without authorization.',
          },
          {
            heading: 'CONTACT',
            body: 'For privacy-related questions or requests, please contact THAANE Customer Care.',
          },
        ]}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'terms') {
    return (
      <InfoPage
        title="TERMS & CONDITIONS"
        eyebrow="THAANE"
        intro="The general terms that apply when using the THAANE website and services."
        sections={[
          {
            heading: 'USE OF THE WEBSITE',
            body: 'By using the THAANE website, you agree to use the service lawfully and responsibly and to provide accurate information when required.',
          },
          {
            heading: 'ORDERS',
            body: 'Orders are subject to product availability, payment confirmation and applicable order-processing conditions.',
          },
          {
            heading: 'PRODUCT INFORMATION',
            body: 'THAANE aims to present product descriptions, imagery and availability accurately. Product appearance may vary depending on screen settings and photography.',
          },
          {
            heading: 'CUSTOMER SUPPORT',
            body: 'Questions concerning orders, products or services can be directed to THAANE Customer Care.',
          },
        ]}
        onNavigate={navigate}
      />
    )
  }

  if (page === 'faq') {
    return (
      <InfoPage
        title="FREQUENTLY ASKED QUESTIONS"
        eyebrow="THAANE CUSTOMER CARE"
        intro="Answers to common questions about shopping with THAANE."
        sections={[
          {
            heading: 'HOW DO I PLACE AN ORDER?',
            body: 'Browse the collection, open a product, add eligible items to your Bag and continue through Checkout after signing in to your account.',
          },
          {
            heading: 'HOW CAN I CHECK MY ORDER?',
            body: 'Order and tracking information will be available through your account when the relevant order and shipment information has been created.',
          },
          {
            heading: 'HOW DO I CONTACT THAANE?',
            body: 'Use the Contact page or Customer Care options provided on the website to reach the THAANE support team.',
          },
          {
            heading: 'I HAVE AN ISSUE WITH MY ORDER. WHAT SHOULD I DO?',
            body: 'Contact Customer Care with your order number and a clear description of the issue. Our support team can guide you through the next steps.',
          },
        ]}
        onNavigate={navigate}
      />
    )
  }

  return (
    <>
      <HomePage
        user={user}
        openAccount={page === 'account'}
        customerCareAuthorized={customerCareAuthorized}
      />
      <SiteFooter onNavigate={navigate} />
      <ThaaneConcierge
        userName={user?.displayName || null}
        userEmail={user?.email || null}
        userId={user?.uid || null}
        onNavigate={navigate}
      />
    </>
  )
}
