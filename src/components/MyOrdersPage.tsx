import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronDown, MapPin, PackageCheck } from 'lucide-react'
import type { User } from 'firebase/auth'
import {
  subscribeToUserOrders,
  type Order,
} from '../lib/orders'

type MyOrdersPageProps = {
  onNavigate: (page: string) => void
  user: User | null
}

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

function statusLabel(status: Order['orderStatus']) {
  return status.replace('_', ' ').toUpperCase()
}

export default function MyOrdersPage({
  onNavigate,
  user,
}: MyOrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToUserOrders(
      user.uid,
      (nextOrders) => {
        setOrders(nextOrders)
        setLoading(false)
        setError('')
      },
      (subscriptionError) => {
        console.error('Failed to load customer orders:', subscriptionError)
        setError(
          'Unable to load your orders. Please try again.',
        )
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  if (!user) {
    return (
      <main className="account-page">
        <div className="account-page-inner">
          <button
            type="button"
            className="account-page-back"
            onClick={() => onNavigate('home')}
          >
            <ArrowLeft size={15} strokeWidth={1.2} />
            BACK TO HOME
          </button>

          <div className="account-page-empty">
            <strong>SIGN IN TO VIEW YOUR ORDERS</strong>
            <span>
              Your order history is available after you sign in.
            </span>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="account-page">
      <div className="account-page-inner">
        <button
          type="button"
          className="account-page-back"
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft size={15} strokeWidth={1.2} />
          BACK TO ACCOUNT
        </button>

        <div className="account-page-intro">
          <span>THAANE ACCOUNT</span>
          <h1>MY ORDERS</h1>
          <p>
            View your order history, payment status and delivery
            information.
          </p>
        </div>

        {error && (
          <div className="account-orders-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="account-page-empty">
            <span>LOADING YOUR ORDERS...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="account-page-empty">
            <PackageCheck size={25} strokeWidth={1.1} />
            <strong>NO ORDERS YET</strong>
            <span>
              Your completed orders will appear here.
            </span>
            <button
              type="button"
              onClick={() => onNavigate('home')}
            >
              CONTINUE SHOPPING
            </button>
          </div>
        ) : (
          <div className="account-orders-list">
            {orders.map((order) => {
              const expanded = expandedOrderId === order.id

              return (
                <article
                  className={`account-order-card${
                    expanded ? ' is-expanded' : ''
                  }`}
                  key={order.id}
                >
                  <button
                    type="button"
                    className="account-order-summary"
                    onClick={() =>
                      setExpandedOrderId(
                        expanded ? null : order.id,
                      )
                    }
                  >
                    <div>
                      <span>ORDER</span>
                      <strong>
                        #{order.id.slice(-8).toUpperCase()}
                      </strong>
                      <small>
                        {formatDate(order.createdAt)}
                      </small>
                    </div>

                    <div>
                      <span>STATUS</span>
                      <strong className="account-order-status">
                        {statusLabel(order.orderStatus)}
                      </strong>
                    </div>

                    <div>
                      <span>PAYMENT</span>
                      <strong>
                        {order.paymentStatus.toUpperCase()}
                      </strong>
                    </div>

                    <div className="account-order-total">
                      <span>TOTAL</span>
                      <strong>
                        {formatCurrency(
                          order.total,
                          order.currency,
                        )}
                      </strong>
                    </div>

                    <ChevronDown
                      className={`account-order-chevron${
                        expanded ? ' is-open' : ''
                      }`}
                      size={17}
                      strokeWidth={1.2}
                    />
                  </button>

                  {expanded && (
                    <div className="account-order-details">
                      <div className="account-order-detail-heading">
                        <span>ORDER DETAILS</span>
                        <small>
                          Placed {formatDate(order.createdAt)}
                        </small>
                      </div>

                      <div className="account-order-items">
                        {order.items.map((item, index) => (
                          <div
                            className="account-order-item"
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

                            <span>× {item.quantity}</span>

                            <strong>
                              {formatCurrency(
                                item.price * item.quantity,
                                order.currency,
                              )}
                            </strong>
                          </div>
                        ))}
                      </div>

                      <div className="account-order-tracking">
                        <div className="account-order-tracking-heading">
                          <span>DELIVERY TRACKING</span>
                          {order.estimatedDelivery && (
                            <small>
                              Estimated delivery {order.estimatedDelivery}
                            </small>
                          )}
                        </div>

                        <div className="account-order-tracking-steps">
                          {(
                            [
                              'confirmed',
                              'processing',
                              'shipped',
                              'delivered',
                            ] as const
                          ).map((step, index) => {
                            const statusOrder = [
                              'pending',
                              'confirmed',
                              'processing',
                              'shipped',
                              'delivered',
                              'cancelled',
                            ]

                            const currentIndex =
                              statusOrder.indexOf(order.orderStatus)
                            const stepIndex =
                              statusOrder.indexOf(step)

                            const completed =
                              order.orderStatus !== 'cancelled' &&
                              currentIndex >= stepIndex

                            const current =
                              order.orderStatus === step

                            return (
                              <div
                                className={`account-order-tracking-step${
                                  completed ? ' is-complete' : ''
                                }${
                                  current ? ' is-current' : ''
                                }`}
                                key={step}
                              >
                                <div className="account-order-tracking-marker">
                                  <span />
                                </div>

                                <strong>
                                  {step.replace('_', ' ').toUpperCase()}
                                </strong>

                                {index < 3 && (
                                  <div className="account-order-tracking-line" />
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {order.trackingNumber ||
                        order.trackingCarrier ||
                        order.estimatedDelivery ||
                        order.trackingUrl ? (
                          <div className="account-order-tracking-details">
                            {order.trackingCarrier && (
                              <div>
                                <span>CARRIER</span>
                                <strong>{order.trackingCarrier}</strong>
                              </div>
                            )}

                            {order.trackingNumber && (
                              <div>
                                <span>TRACKING NUMBER</span>
                                <strong>{order.trackingNumber}</strong>
                              </div>
                            )}

                            {order.estimatedDelivery && (
                              <div>
                                <span>ESTIMATED DELIVERY</span>
                                <strong>
                                  {order.estimatedDelivery}
                                </strong>
                              </div>
                            )}

                            {order.trackingUrl && (
                              <a
                                href={order.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="account-order-tracking-link"
                              >
                                TRACK SHIPMENT
                                <ArrowLeft
                                  size={13}
                                  strokeWidth={1.2}
                                />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="account-order-tracking-empty">
                            <strong>
                              {order.orderStatus === 'shipped'
                                ? 'TRACKING INFORMATION PENDING'
                                : 'TRACKING INFORMATION WILL APPEAR HERE'}
                            </strong>
                            <span>
                              Delivery tracking will be available once
                              your shipment information has been added.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="account-order-info-grid">
                        <section>
                          <span>DELIVERY ADDRESS</span>
                          <div className="account-order-address-title">
                            <MapPin size={14} strokeWidth={1.2} />
                            <strong>
                              {order.address.fullName || '—'}
                            </strong>
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
                          <p>
                            {order.address.country}
                          </p>
                          <p>
                            Phone: {order.address.phone || '—'}
                          </p>
                        </section>

                        <section>
                          <span>PAYMENT</span>
                          <strong>
                            {order.paymentMethod}
                          </strong>
                          <p>
                            Payment status:{' '}
                            {order.paymentStatus}
                          </p>
                        </section>
                      </div>

                      <div className="account-order-total-row">
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
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
