import { useEffect, useMemo, useState } from 'react'
import { auth } from '../lib/firebase'
import { ArrowLeft, Users } from 'lucide-react'
import {
  subscribeToOrders,
  type Order,
} from '../lib/orders'

type AdminCustomersPageProps = {
  onNavigate: (page: string) => void
}

type Customer = {
  key: string
  name: string
  email: string
  orderCount: number
  paidOrders: number
  totalSpent: number
  latestOrder: Order | null
  orders: Order[]
  registered: boolean
  disabled: boolean
  emailVerified: boolean
  phoneNumber: string
  createdAt: string | null
  lastSignInAt: string | null
}

function formatDate(value: unknown) {
  if (!value) return '—'

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const date = new Date(String(value))

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminCustomersPage({
  onNavigate,
}: AdminCustomersPageProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [registeredCustomers, setRegisteredCustomers] = useState<
    Array<{
      uid: string
      email: string
      displayName: string
      disabled: boolean
      emailVerified: boolean
      phoneNumber: string
      createdAt: string | null
      lastSignInAt: string | null
    }>
  >([])

  useEffect(() => {
    const loadRegisteredCustomers = async () => {
      try {
        const currentUser = auth.currentUser

        if (!currentUser) {
          return
        }

        const idToken = await currentUser.getIdToken()

        const response = await fetch(
          'http://localhost:4242/api/admin/customers',
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error('Unable to load registered customers.')
        }

        const data = await response.json()

        setRegisteredCustomers(
          Array.isArray(data.customers)
            ? data.customers
            : [],
        )
      } catch (loadError) {
        console.error(
          'Failed to load registered customers:',
          loadError,
        )
      }
    }

    void loadRegisteredCustomers()
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToOrders(
      (nextOrders) => {
        setOrders(nextOrders)
        setLoading(false)
      },
      () => {
        setError('Unable to load customer data.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const customers = useMemo<Customer[]>(() => {
    const customerMap = new Map<string, Customer>()

    for (const order of orders) {
      const key =
        order.userId ||
        order.customerEmail ||
        order.customerName ||
        order.id

      const existing = customerMap.get(key)

      if (!existing) {
        customerMap.set(key, {
          key,
          name: order.customerName || 'THAANE Customer',
          email: order.customerEmail || '—',
          orderCount: 1,
          paidOrders: order.paymentStatus === 'paid' ? 1 : 0,
          totalSpent:
            order.paymentStatus === 'paid'
              ? Number(order.total || 0)
              : 0,
          latestOrder: order,
          orders: [order],
          registered: false,
          disabled: false,
          emailVerified: false,
          phoneNumber: '',
          createdAt: null,
          lastSignInAt: null,
        })
        continue
      }

      existing.orderCount += 1
      existing.orders.push(order)

      if (order.paymentStatus === 'paid') {
        existing.paidOrders += 1
        existing.totalSpent += Number(order.total || 0)
      }

      const existingTime =
        existing.latestOrder?.createdAt &&
        typeof existing.latestOrder.createdAt === 'object' &&
        'toDate' in existing.latestOrder.createdAt &&
        typeof existing.latestOrder.createdAt.toDate === 'function'
          ? existing.latestOrder.createdAt.toDate().getTime()
          : 0

      const currentTime =
        order.createdAt &&
        typeof order.createdAt === 'object' &&
        'toDate' in order.createdAt &&
        typeof order.createdAt.toDate === 'function'
          ? order.createdAt.toDate().getTime()
          : 0

      if (currentTime > existingTime) {
        existing.latestOrder = order
      }
    }

    const customerEntries = Array.from(customerMap.values())

    for (const registeredCustomer of registeredCustomers) {
      const existing = customerMap.get(registeredCustomer.uid)

      if (existing) {
        existing.registered = true
        existing.disabled = registeredCustomer.disabled
        existing.emailVerified = registeredCustomer.emailVerified
        existing.createdAt = registeredCustomer.createdAt
        existing.lastSignInAt = registeredCustomer.lastSignInAt
        continue
      }

      customerEntries.push({
        key: registeredCustomer.uid,
        name:
          registeredCustomer.displayName ||
          registeredCustomer.email ||
          'THAANE Customer',
        email: registeredCustomer.email || '—',
        orderCount: 0,
        paidOrders: 0,
        totalSpent: 0,
        latestOrder: null,
        orders: [],
        registered: true,
        disabled: registeredCustomer.disabled,
        emailVerified: registeredCustomer.emailVerified,
        phoneNumber: registeredCustomer.phoneNumber,
        createdAt: registeredCustomer.createdAt,
        lastSignInAt: registeredCustomer.lastSignInAt,
      })
    }

    return customerEntries.sort(
      (a, b) => b.totalSpent - a.totalSpent,
    )
  }, [orders, registeredCustomers])

  const filteredCustomers = useMemo(() => {
    const search = customerSearch.trim().toLowerCase()

    return customers.filter((customer) => {
      const matchesSearch =
        !search ||
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search)

      const matchesFilter =
        customerFilter === 'all' ||
        (customerFilter === 'registered' && customer.registered) ||
        (customerFilter === 'with-orders' && customer.orderCount > 0) ||
        (customerFilter === 'no-orders' && customer.orderCount === 0) ||
        (customerFilter === 'verified' && customer.emailVerified) ||
        (customerFilter === 'unverified' && !customer.emailVerified)

      return matchesSearch && matchesFilter
    })
  }, [customers, customerSearch, customerFilter])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <main className="admin-page admin-customers-page">
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
          <strong>CUSTOMERS</strong>
        </div>

        <button
          className="admin-exit"
          onClick={() => onNavigate('admin')}
        >
          BACK TO ADMIN
        </button>
      </header>

      <section className="admin-content">
        <button
          className="admin-back-button"
          type="button"
          onClick={() => onNavigate('admin')}
        >
          <ArrowLeft size={16} strokeWidth={1.2} />
          ADMIN DASHBOARD
        </button>

        <div className="admin-intro">
          <span>THAANE MANAGEMENT</span>
          <h1>CUSTOMERS</h1>
          <p>View customers and their order activity.</p>
        </div>

        <div className="admin-overview">
          <div className="admin-overview-card">
            <span>CUSTOMERS</span>
            <strong>{customers.length}</strong>
            <small>Registered accounts</small>
          </div>

          <div className="admin-overview-card">
            <span>ORDERS</span>
            <strong>{orders.length}</strong>
            <small>Across all customers</small>
          </div>

          <div className="admin-overview-card">
            <span>PAID ORDERS</span>
            <strong>
              {orders.filter(
                (order) => order.paymentStatus === 'paid',
              ).length}
            </strong>
            <small>Payment confirmed</small>
          </div>
        </div>

        {!loading && !error && customers.length > 0 && (
          <div className="admin-customer-toolbar">
            <div className="admin-customer-search">
              <Users size={16} strokeWidth={1.2} />
              <input
                type="search"
                value={customerSearch}
                onChange={(event) =>
                  setCustomerSearch(event.target.value)
                }
                placeholder="SEARCH CUSTOMERS"
                aria-label="Search customers"
              />
            </div>

            <select
              className="admin-customer-filter"
              value={customerFilter}
              onChange={(event) =>
                setCustomerFilter(event.target.value)
              }
              aria-label="Filter customers"
            >
              <option value="all">ALL CUSTOMERS</option>
              <option value="registered">REGISTERED</option>
              <option value="with-orders">WITH ORDERS</option>
              <option value="no-orders">NO ORDERS</option>
              <option value="verified">VERIFIED EMAIL</option>
              <option value="unverified">UNVERIFIED EMAIL</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="admin-empty-state">
            <Users size={22} strokeWidth={1.2} />
            <strong>LOADING CUSTOMERS</strong>
            <span>Please wait while customer data is loaded.</span>
          </div>
        ) : error ? (
          <div className="admin-empty-state">
            <Users size={22} strokeWidth={1.2} />
            <strong>UNABLE TO LOAD CUSTOMERS</strong>
            <span>{error}</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="admin-empty-state">
            <Users size={22} strokeWidth={1.2} />
            <strong>NO CUSTOMERS YET</strong>
            <span>Customers will appear here after orders are placed.</span>
          </div>
        ) : (
          <div className="admin-customer-list">
            {filteredCustomers.length === 0 ? (
              <div className="admin-empty-state">
                <Users size={22} strokeWidth={1.2} />
                <strong>NO MATCHING CUSTOMERS</strong>
                <span>
                  Try a different search or filter.
                </span>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
              <article
                className={`admin-customer-card ${
                  expandedCustomer === customer.key
                    ? 'is-expanded'
                    : ''
                }`}
                key={customer.key}
              >
                <div className="admin-customer-summary-wrap">
                  <button
                    className="admin-customer-summary"
                    type="button"
                    onClick={() =>
                      setExpandedCustomer((current) =>
                        current === customer.key ? null : customer.key,
                      )
                    }
                    aria-expanded={expandedCustomer === customer.key}
                  >
                  <div className="admin-customer-main">
                    <div className="admin-customer-avatar">
                      <Users size={18} strokeWidth={1.2} />
                    </div>

                    <div>
                      <strong>{customer.name}</strong>
                      <span>{customer.email}</span>
                    </div>
                  </div>

                  <div className="admin-customer-stat">
                    <span>ORDERS</span>
                    <strong>{customer.orderCount}</strong>
                  </div>

                  <div className="admin-customer-stat">
                    <span>PAID</span>
                    <strong>{customer.paidOrders}</strong>
                  </div>

                  <div className="admin-customer-stat">
                    <span>SPENT</span>
                    <strong>{formatCurrency(customer.totalSpent)}</strong>
                  </div>

                  <div className="admin-customer-stat">
                    <span>LATEST ORDER</span>
                    <strong>
                      {formatDate(customer.latestOrder?.createdAt)}
                    </strong>
                  </div>
                  </button>
                </div>

                {expandedCustomer === customer.key && (
                  <>
                    <div className="admin-customer-account-details">
                    <div>
                      <span>ACCOUNT STATUS</span>
                      <strong>
                        {customer.disabled ? 'DISABLED' : 'ACTIVE'}
                      </strong>
                    </div>

                    <div>
                      <span>EMAIL STATUS</span>
                      <strong>
                        {customer.emailVerified
                          ? 'VERIFIED'
                          : 'NOT VERIFIED'}
                      </strong>
                    </div>

                    <div>
                      <span>PHONE</span>
                      <strong>{customer.phoneNumber || '—'}</strong>
                    </div>

                    <div>
                      <span>REGISTERED</span>
                      <strong>{formatDate(customer.createdAt)}</strong>
                    </div>

                    <div>
                      <span>LAST SIGN-IN</span>
                      <strong>{formatDate(customer.lastSignInAt)}</strong>
                    </div>
                  </div>

                  <div className="admin-customer-orders">
                    <div className="admin-customer-orders-heading">
                      <span>ORDER HISTORY</span>
                      <strong>{customer.orders.length} orders</strong>
                    </div>

                    {customer.orders.map((order) => (
                      <div
                        className="admin-customer-order"
                        key={order.id}
                      >
                        <button
                          className="admin-customer-order-toggle"
                          type="button"
                          onClick={() =>
                            setExpandedOrder((current) =>
                              current === order.id ? null : order.id,
                            )
                          }
                          aria-expanded={expandedOrder === order.id}
                        >
                          <div className="admin-customer-order-top">
                            <div>
                            <span>ORDER</span>
                            <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                          </div>

                          <div>
                            <span>DATE</span>
                            <strong>{formatDate(order.createdAt)}</strong>
                          </div>

                          <div>
                            <span>STATUS</span>
                            <strong>{order.orderStatus.toUpperCase()}</strong>
                          </div>

                          <div>
                            <span>PAYMENT</span>
                            <strong>{order.paymentStatus.toUpperCase()}</strong>
                          </div>

                            <div>
                              <span>TOTAL</span>
                              <strong>{formatCurrency(order.total)}</strong>
                            </div>
                          </div>
                        </button>

                        <div className="admin-customer-order-items">
                          {order.items.map((item, index) => (
                            <div
                              className="admin-customer-order-item"
                              key={`${order.id}-${item.productId}-${index}`}
                            >
                              <span>
                                {item.productName} × {item.quantity}
                              </span>

                              <small>
                                {item.size || '—'} / {item.color || '—'}
                              </small>

                              <strong>
                                {formatCurrency(
                                  Number(item.price || 0) *
                                    Number(item.quantity || 0),
                                )}
                              </strong>
                            </div>
                          ))}
                        </div>

                        {expandedOrder === order.id && (
                          <div className="admin-customer-order-details">
                            <div className="admin-customer-order-detail-grid">
                              <div>
                                <span>PAYMENT METHOD</span>
                                <strong>{order.paymentMethod || '—'}</strong>
                              </div>

                              <div>
                                <span>PAYMENT STATUS</span>
                                <strong>{order.paymentStatus.toUpperCase()}</strong>
                              </div>

                              <div>
                                <span>RAZORPAY ORDER</span>
                                <strong>{order.razorpayOrderId || '—'}</strong>
                              </div>

                              <div>
                                <span>RAZORPAY PAYMENT</span>
                                <strong>{order.razorpayPaymentId || '—'}</strong>
                              </div>
                            </div>

                            <div className="admin-customer-order-address">
                              <span>DELIVERY ADDRESS</span>
                              <strong>{order.address.fullName || '—'}</strong>
                              <p>
                                {order.address.addressLine1 || '—'}
                                {order.address.addressLine2
                                  ? `, ${order.address.addressLine2}`
                                  : ''}
                                <br />
                                {order.address.city || '—'}
                                {order.address.state
                                  ? `, ${order.address.state}`
                                  : ''}
                                {order.address.postalCode
                                  ? ` - ${order.address.postalCode}`
                                  : ''}
                                <br />
                                {order.address.country || '—'}
                              </p>
                              <small>{order.address.phone || '—'}</small>
                            </div>

                            <div className="admin-customer-order-totals">
                              <div>
                                <span>SUBTOTAL</span>
                                <strong>{formatCurrency(order.subtotal)}</strong>
                              </div>

                              <div>
                                <span>SHIPPING</span>
                                <strong>{formatCurrency(order.shipping)}</strong>
                              </div>

                              <div>
                                <span>TOTAL</span>
                                <strong>{formatCurrency(order.total)}</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  </>
                )}
              </article>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  )
}
