import { useEffect, useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react'
import {
  subscribeToOrders,
  type Order,
} from '../lib/orders'

type AdminPageProps = {
  onNavigate: (page: string) => void
}

const adminSections = [
  {
    label: 'ORDERS',
    description: 'View and manage customer orders.',
    icon: ClipboardList,
  },
  {
    label: 'PRODUCTS',
    description: 'Add, edit and manage THAANE products.',
    icon: Package,
  },
  {
    label: 'CUSTOMERS',
    description: 'View customer accounts and order history.',
    icon: Users,
  },
  {
    label: 'INVENTORY',
    description: 'Manage stock and product availability.',
    icon: Warehouse,
  },
  {
    label: 'CUSTOMER CARE',
    description: 'View and manage customer care requests.',
    icon: MessageCircle,
  },
  {
    label: 'EMPLOYEES',
    description: 'Manage Customer Care employee accounts.',
    icon: UserCog,
  },
]

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (nextOrders) => {
        setOrders(nextOrders)
      },
      (error) => {
        console.error('Failed to load dashboard orders:', error)
      },
    )

    return unsubscribe
  }, [])

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === 'paid',
  )

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  )

  const formatRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(revenue)

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button
          className="admin-logo"
          onClick={() => onNavigate('home')}
          aria-label="THAANE home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <div className="admin-header-title">
          <span>THAANE</span>
          <strong>ADMIN</strong>
        </div>

        <button
          className="admin-exit"
          onClick={() => onNavigate('home')}
        >
          EXIT ADMIN
        </button>
      </header>

      <section className="admin-content">
        <div className="admin-intro">
          <span>THAANE MANAGEMENT</span>
          <h1>DASHBOARD</h1>
          <p>Manage your store from one place.</p>
        </div>

        <div className="admin-overview">
          <div className="admin-overview-card">
            <span>ORDERS</span>
            <strong>{orders.length}</strong>
            <small>All customer orders</small>
          </div>

          <div className="admin-overview-card">
            <span>PRODUCTS</span>
            <strong>11</strong>
            <small>Current catalog</small>
          </div>

          <div className="admin-overview-card">
            <span>PAID ORDERS</span>
            <strong>{paidOrders.length}</strong>
            <small>Payment confirmed</small>
          </div>

          <div className="admin-overview-card">
            <span>REVENUE</span>
            <strong>{formatRevenue}</strong>
            <small>Paid orders</small>
          </div>
        </div>

        <div className="admin-section-heading">
          <div>
            <span>STORE MANAGEMENT</span>
            <h2>CONTROL CENTER</h2>
          </div>

          <LayoutDashboard size={19} strokeWidth={1.2} />
        </div>

        <div className="admin-section-grid">
          {adminSections.map((section) => {
            const Icon = section.icon

            return (
              <button
                className="admin-section-card"
                key={section.label}
                type="button"
                onClick={() => {
                  if (section.label === 'PRODUCTS') {
                    onNavigate('admin-products')
                  }

                  if (section.label === 'INVENTORY') {
                    onNavigate('admin-inventory')
                  }

                  if (section.label === 'ORDERS') {
                    onNavigate('admin-orders')
                  }

                  if (section.label === 'CUSTOMERS') {
                    onNavigate('admin-customers')
                  }

                  if (section.label === 'CUSTOMER CARE') {
                    onNavigate('admin-customer-care')
                  }

                  if (section.label === 'EMPLOYEES') {
                    onNavigate('admin-customer-care-staff')
                  }
                }}
              >
                <Icon size={21} strokeWidth={1.2} />

                <div>
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                </div>

                <span className="admin-section-status">
                  {section.label === 'PRODUCTS' ||
                  section.label === 'INVENTORY' ||
                  section.label === 'ORDERS' ||
                  section.label === 'CUSTOMERS' ||
                  section.label === 'CUSTOMER CARE' ||
                  section.label === 'EMPLOYEES'
                    ? 'MANAGE'
                    : 'COMING SOON'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="admin-analytics-placeholder">
          <BarChart3 size={20} strokeWidth={1.2} />

          <div>
            <strong>STORE ANALYTICS</strong>
            <span>
              Sales, orders and performance analytics will appear here.
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
