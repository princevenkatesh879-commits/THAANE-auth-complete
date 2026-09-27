import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronDown, ClipboardList, MapPin } from 'lucide-react'
import {
  subscribeToOrders,
  updateOrderStatus,
  updateOrderTracking,
  type Order,
} from '../lib/orders'

type AdminOrdersPageProps = {
  onNavigate: (page: string) => void
}

const orderStatuses: Order['orderStatus'][] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

function formatDate(value: unknown) {
  if (!value) {
    return '—'
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return '—'
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminOrdersPage({
  onNavigate,
}: AdminOrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    null,
  )
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(
    null,
  )
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(
    null,
  )
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    trackingCarrier: '',
    estimatedDelivery: '',
    trackingUrl: '',
  })

  useEffect(() => {
    setLoading(true)

    const unsubscribe = subscribeToOrders(
      (nextOrders) => {
        setOrders(nextOrders)
        setLoading(false)
        setError('')
      },
      (subscriptionError) => {
        console.error('Failed to load admin orders:', subscriptionError)
        setError(
          'Unable to load orders. Please check your admin access.',
        )
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'paid'),
    [orders],
  )

  const revenue = useMemo(
    () =>
      paidOrders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      ),
    [paidOrders],
  )

  const openTrackingEditor = (order: Order) => {
    setTrackingOrderId(order.id)
    setTrackingForm({
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      estimatedDelivery: order.estimatedDelivery,
      trackingUrl: order.trackingUrl,
    })
  }

  const handleTrackingSave = async () => {
    if (!trackingOrderId) return

    try {
      setUpdatingOrderId(trackingOrderId)

      await updateOrderTracking(trackingOrderId, trackingForm)

      setTrackingOrderId(null)
    } catch (error) {
      console.error('Failed to update tracking:', error)
      setError('Unable to update tracking details.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleStatusChange = async (
    orderId: string,
    status: Order['orderStatus'],
  ) => {
    setUpdatingOrderId(orderId)
    setError('')

    try {
      await updateOrderStatus(orderId, status)
    } catch (updateError) {
      console.error('Failed to update order status:', updateError)
      setError('Unable to update the order status. Please try again.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

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
          <strong>ORDERS</strong>
        </div>

        <button
          className="admin-exit"
          onClick={() => onNavigate('admin')}
        >
          ADMIN DASHBOARD
        </button>
      </header>

      <section className="admin-content">
        <button
          type="button"
          className="admin-orders-back"
          onClick={() => onNavigate('admin')}
        >
          <ArrowLeft size={15} strokeWidth={1.2} />
          BACK TO DASHBOARD
        </button>

        <div className="admin-intro admin-orders-intro">
          <span>THAANE MANAGEMENT</span>
          <h1>ORDERS</h1>
          <p>
            Review customer orders, payment details, delivery information
            and fulfillment status.
          </p>
        </div>

        <div className="admin-orders-summary">
          <div>
            <span>TOTAL ORDERS</span>
            <strong>{orders.length}</strong>
          </div>

          <div>
            <span>PAID ORDERS</span>
            <strong>{paidOrders.length}</strong>
          </div>

          <div>
            <span>PAID REVENUE</span>
            <strong>{formatCurrency(revenue, 'INR')}</strong>
          </div>
        </div>

        {error && (
          <div className="admin-orders-message admin-orders-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="admin-orders-message">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-orders-empty">
            <ClipboardList size={24} strokeWidth={1.2} />
            <strong>NO ORDERS YET</strong>
            <span>
              Completed customer orders will appear here.
            </span>
          </div>
        ) : (
          <div className="admin-orders-list">
            {orders.map((order) => {
              const expanded = expandedOrderId === order.id
              const updating = updatingOrderId === order.id

              return (
                <article
                  className={`admin-order-card${
                    expanded ? ' is-expanded' : ''
                  }`}
                  key={order.id}
                >
                  <button
                    type="button"
                    className="admin-order-summary"
                    onClick={() =>
                      setExpandedOrderId(
                        expanded ? null : order.id,
                      )
                    }
                  >
                    <div className="admin-order-summary-main">
                      <span>ORDER</span>
                      <strong>#{order.id.slice(-8).toUpperCase()}</strong>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>

                    <div className="admin-order-summary-customer">
                      <strong>{order.customerName || 'Customer'}</strong>
                      <span>
                        {order.customerEmail || 'No email provided'}
                      </span>
                    </div>

                    <div className="admin-order-summary-payment">
                      <span className={`admin-order-status status-${order.paymentStatus}`}>
                        PAYMENT {order.paymentStatus.toUpperCase()}
                      </span>
                      <strong>
                        {formatCurrency(order.total, order.currency)}
                      </strong>
                    </div>

                    <ChevronDown
                      className={`admin-order-chevron${
                        expanded ? ' is-open' : ''
                      }`}
                      size={18}
                      strokeWidth={1.2}
                    />
                  </button>

                  {expanded && (
                    <div className="admin-order-details">
                      <div className="admin-order-detail-grid">
                        <section>
                          <span className="admin-order-detail-label">
                            CUSTOMER
                          </span>
                          <strong>
                            {order.customerName || '—'}
                          </strong>
                          <p>
                            {order.customerEmail || 'No email provided'}
                          </p>
                        </section>

                        <section>
                          <span className="admin-order-detail-label">
                            PAYMENT
                          </span>
                          <strong>
                            {order.paymentMethod}
                          </strong>
                          <p>
                            Status: {order.paymentStatus}
                          </p>
                          <p>
                            Razorpay order: {order.razorpayOrderId || '—'}
                          </p>
                          <p>
                            Razorpay payment: {order.razorpayPaymentId || '—'}
                          </p>
                        </section>

                        <section className="admin-order-address">
                          <span className="admin-order-detail-label">
                            DELIVERY ADDRESS
                          </span>
                          <div className="admin-order-address-heading">
                            <MapPin size={15} strokeWidth={1.2} />
                            <strong>{order.address.fullName || '—'}</strong>
                          </div>
                          <p>
                            {order.address.addressLine1}
                            {order.address.addressLine2
                              ? `, ${order.address.addressLine2}`
                              : ''}
                          </p>
                          <p>
                            {order.address.city},{' '}
                            {order.address.state}{' '}
                            {order.address.postalCode}
                          </p>
                          <p>{order.address.country}</p>
                          <p>Phone: {order.address.phone || '—'}</p>
                        </section>
                      </div>

                      <div className="admin-order-items">
                        <div className="admin-order-detail-label">
                          ITEMS
                        </div>

                        {order.items.map((item, index) => (
                          <div
                            className="admin-order-item"
                            key={`${order.id}-${item.productId}-${index}`}
                          >
                            <div>
                              <strong>{item.productName}</strong>
                              <span>
                                {item.size
                                  ? `Size ${item.size}`
                                  : 'Size —'}
                                {item.color
                                  ? ` · ${item.color}`
                                  : ''}
                              </span>
                            </div>

                            <span>
                              × {item.quantity}
                            </span>

                            <strong>
                              {formatCurrency(
                                item.price * item.quantity,
                                order.currency,
                              )}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className="admin-order-tracking">
        <div className="admin-order-detail-label">TRACKING DETAILS</div>

        {trackingOrderId === order.id ? (
          <div className="admin-order-tracking-form">
            <input
              type="text"
              value={trackingForm.trackingNumber}
              onChange={(event) =>
                setTrackingForm({
                  ...trackingForm,
                  trackingNumber: event.target.value,
                })
              }
              placeholder="TRACKING NUMBER"
            />

            <input
              type="text"
              value={trackingForm.trackingCarrier}
              onChange={(event) =>
                setTrackingForm({
                  ...trackingForm,
                  trackingCarrier: event.target.value,
                })
              }
              placeholder="CARRIER"
            />

            <input
              type="text"
              value={trackingForm.estimatedDelivery}
              onChange={(event) =>
                setTrackingForm({
                  ...trackingForm,
                  estimatedDelivery: event.target.value,
                })
              }
              placeholder="ESTIMATED DELIVERY"
            />

            <input
              type="url"
              value={trackingForm.trackingUrl}
              onChange={(event) =>
                setTrackingForm({
                  ...trackingForm,
                  trackingUrl: event.target.value,
                })
              }
              placeholder="TRACKING URL"
            />

            <div className="admin-order-tracking-actions">
              <button
                type="button"
                onClick={handleTrackingSave}
                disabled={updating}
              >
                SAVE TRACKING
              </button>

              <button
                type="button"
                onClick={() => setTrackingOrderId(null)}
                disabled={updating}
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div className="admin-order-tracking-summary">
            <div>
              <span>CARRIER</span>
              <strong>{order.trackingCarrier || '—'}</strong>
            </div>
            <div>
              <span>TRACKING NUMBER</span>
              <strong>{order.trackingNumber || '—'}</strong>
            </div>
            <div>
              <span>ESTIMATED DELIVERY</span>
              <strong>{order.estimatedDelivery || '—'}</strong>
            </div>
            <button
              type="button"
              onClick={() => openTrackingEditor(order)}
            >
              {order.trackingNumber ? 'EDIT TRACKING' : 'ADD TRACKING'}
            </button>
          </div>
        )}
      </div>

      <div className="admin-order-footer">
                        <div className="admin-order-totals">
                          <span>
                            SUBTOTAL{' '}
                            {formatCurrency(
                              order.subtotal,
                              order.currency,
                            )}
                          </span>
                          <span>
                            SHIPPING{' '}
                            {formatCurrency(
                              order.shipping,
                              order.currency,
                            )}
                          </span>
                          <strong>
                            TOTAL{' '}
                            {formatCurrency(
                              order.total,
                              order.currency,
                            )}
                          </strong>
                        </div>

                        <div className="admin-order-status-control">
                          <label htmlFor={`status-${order.id}`}>
                            ORDER STATUS
                          </label>

                          <select
                            id={`status-${order.id}`}
                            value={order.orderStatus}
                            disabled={updating}
                            onChange={(event) =>
                              handleStatusChange(
                                order.id,
                                event.target.value as Order['orderStatus'],
                              )
                            }
                          >
                            {orderStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
