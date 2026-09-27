import { useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { ArrowLeft, Lock, ShoppingBag } from 'lucide-react'
import { getBag } from '../lib/bag'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'
import {
  getCheckoutAddress,
  type CheckoutAddress,
} from '../lib/checkoutAddress'
import { createOrder } from '../lib/orders'

type PaymentPageProps = {
  onNavigate: (page: string) => void
  user: User | null
}

export default function PaymentPage({
  onNavigate,
  user,
}: PaymentPageProps) {
  const { products, loading: productsLoading } =
    useFirestoreProducts()

  const bag = getBag()
  const checkoutAddress: CheckoutAddress | null =
    getCheckoutAddress()

  const items = useMemo(
    () =>
      bag
        .map((item) => {
          const product = products.find(
            (product) => product.id === item.productId,
          )

          if (!product) {
            return null
          }

          return {
            product,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    [bag, products],
  )

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const startPayment = async () => {
    if (items.length === 0) {
      setPaymentError('Your bag is empty.')
      return
    }

    setPaymentLoading(true)
    setPaymentError('')

    try {
      const response = await fetch('https://thaane-auth-complete.onrender.com/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: 'INR',
          items: items.map(({ product, quantity, size, color }) => ({
            productId: product.id,
            quantity,
            size,
            color,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to create payment order.')
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'THAANE',
        description: 'THAANE Order',
        order_id: data.id,
        theme: {
          color: '#2b1a15',
        },
        handler: async (paymentResponse) => {
          try {
            setPaymentLoading(true)

            if (!checkoutAddress) {
              throw new Error(
                'Delivery address is missing. Please return to checkout and confirm your address.',
              )
            }

            const customerName =
              checkoutAddress.fullName ||
              user?.displayName ||
              'THAANE Customer'

            const orderItems = items.map(
              ({ product, quantity, size, color }) => ({
                productId: product.id,
                productName: product.name,
                quantity,
                price: product.price,
                size: size ?? '',
                color: color ?? '',
              }),
            )

            const verificationResponse = await fetch(
              'https://thaane-auth-complete.onrender.com/api/verify-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...paymentResponse,
                  order: {
                    userId: user?.uid ?? null,
                    customerEmail: user?.email ?? '',
                    customerName,
                    items: orderItems,
                    address: checkoutAddress,
                    subtotal: total,
                    shipping: 0,
                    total,
                    currency: 'INR',
                  },
                }),
              },
            )

            const verificationData =
              await verificationResponse.json()

            if (!verificationResponse.ok || !verificationData.verified) {
              throw new Error(
                verificationData.error ||
                  'Payment verification failed.',
              )
            }

            setPaymentError('')
            window.alert(
              `Payment successful. Payment ID: ${verificationData.paymentId}`,
            )
          } catch (error) {
            setPaymentError(
              error instanceof Error
                ? error.message
                : 'Payment verification failed.',
            )
          } finally {
            setPaymentLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false)
          },
        },
      })

      razorpay.open()
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : 'Unable to start payment.',
      )
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button
          className="checkout-logo"
          onClick={() => onNavigate('home')}
          aria-label="THAANE home"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <div className="checkout-secure">
          <Lock size={14} strokeWidth={1.3} />
          <span>SECURE CHECKOUT</span>
        </div>

        <button
          className="checkout-bag-button"
          onClick={() => onNavigate('bag')}
          aria-label="Return to bag"
        >
          <ShoppingBag size={19} strokeWidth={1.35} />
          <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </button>
      </header>

      <section className="checkout-content">
        <div className="checkout-intro">
          <span>THAANE</span>
          <h1>PAYMENT</h1>
          <p>Choose your preferred payment method.</p>
        </div>

        {productsLoading && bag.length > 0 ? (
          <div className="checkout-loading">
            UPDATING YOUR ORDER
          </div>
        ) : (
        <div className="checkout-layout">
          <section className="checkout-form">
            <div className="checkout-section">
              <span className="checkout-section-number">03</span>
              <div>
                <h2>PAYMENT METHOD</h2>
                <p>Your secure payment options will appear here.</p>
              </div>
            </div>

            <div className="payment-method-card">
              <div>
                <strong>ONLINE PAYMENT</strong>
                <span>Cards, UPI and other secure payment methods</span>
              </div>
              <span className="payment-method-status">RAZORPAY</span>
            </div>

            {paymentError && (
              <div className="payment-error" role="alert">
                {paymentError}
              </div>
            )}

            <button
              className="checkout-payment-button"
              type="button"
              onClick={startPayment}
              disabled={paymentLoading || items.length === 0}
            >
              {paymentLoading
                ? 'PREPARING PAYMENT...'
                : 'PAY SECURELY'}
            </button>

            <button
              className="checkout-back-button"
              type="button"
              onClick={() => onNavigate('checkout')}
            >
              <ArrowLeft size={14} />
              BACK TO CHECKOUT
            </button>
          </section>

          <aside className="checkout-summary">
            <div className="checkout-summary-heading">
              <span>YOUR ORDER</span>
              <strong>{items.length} ITEMS</strong>
            </div>

            {items.map(({ product, quantity, size, color }) => (
              <div
                className="checkout-summary-item"
                key={`${product.id}-${size || ''}-${color || ''}`}
              >
                <div className="checkout-summary-image">
                  <span>THAANE</span>
                </div>

                <div>
                  <h3>{product.name}</h3>
                  {color && <p>COLOUR {color}</p>}
                  {size && <p>SIZE {size}</p>}
                  <p>QTY {quantity}</p>
                </div>

                <strong>
                  ₹{(product.price * quantity).toLocaleString('en-IN')}
                </strong>
              </div>
            ))}

            <div className="checkout-summary-total">
              <span>TOTAL</span>
              <strong>₹{total.toLocaleString('en-IN')}</strong>
            </div>

            <div className="checkout-summary-note">
              Payment processing will be connected before launch.
            </div>

            <button
              className="checkout-back-button"
              onClick={() => onNavigate('bag')}
            >
              <ArrowLeft size={14} />
              BACK TO BAG
            </button>
          </aside>
        </div>
        )}
      </section>
    </main>
  )
}
