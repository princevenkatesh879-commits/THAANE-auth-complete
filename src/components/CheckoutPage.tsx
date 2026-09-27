import { useEffect, useMemo, useState } from 'react'
import type { User } from 'firebase/auth'
import { ArrowLeft, Check, Lock, MapPin, ShoppingBag } from 'lucide-react'
import { getBag } from '../lib/bag'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'
import {
  subscribeToAddresses,
  type SavedAddress,
} from '../lib/addresses'
import {
  getCheckoutAddress,
  saveCheckoutAddress,
  type CheckoutAddress,
} from '../lib/checkoutAddress'

type CheckoutPageProps = {
  onNavigate: (page: string) => void
  user: User | null
}

export default function CheckoutPage({
  onNavigate,
  user,
}: CheckoutPageProps) {
  const { products, loading: productsLoading } =
    useFirestoreProducts()

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(true)
  const [checkoutAddress, setCheckoutAddress] =
    useState<CheckoutAddress | null>(() => getCheckoutAddress())

  const bag = getBag()

  useEffect(() => {
    if (!user) {
      setSavedAddresses([])
      setSelectedAddressId(null)
      setShowNewAddressForm(true)
      return
    }

    const unsubscribe = subscribeToAddresses(
      user.uid,
      (addresses) => {
        setSavedAddresses(addresses)

        if (addresses.length > 0) {
          const defaultAddress =
            addresses.find((address) => address.isDefault) ||
            addresses[0]

          const existingCheckoutAddress = getCheckoutAddress()

          setSelectedAddressId(defaultAddress.id)
          setShowNewAddressForm(false)
          setCheckoutAddress(existingCheckoutAddress)
        } else {
          setSelectedAddressId(null)
          setShowNewAddressForm(true)
        }
      },
      (error) => {
        console.error('Failed to load checkout addresses:', error)
      },
    )

    return unsubscribe
  }, [user])

  const selectedAddress = savedAddresses.find(
    (address) => address.id === selectedAddressId,
  )

  useEffect(() => {
    if (!selectedAddress || showNewAddressForm) {
      return
    }

    const nextAddress: CheckoutAddress = {
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      addressLine1: selectedAddress.addressLine1,
      addressLine2: selectedAddress.addressLine2,
      city: selectedAddress.city,
      state: selectedAddress.state,
      postalCode: selectedAddress.postalCode,
      country: selectedAddress.country,
    }

    setCheckoutAddress(nextAddress)
    saveCheckoutAddress(nextAddress)
  }, [selectedAddress, showNewAddressForm])

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

  const stockIssue = items.find(
    (item) =>
      item.quantity > (item.product.stock ?? 0) ||
      (item.product.stock ?? 0) <= 0 ||
      !item.product.available,
  )

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
          <h1>CHECKOUT</h1>
          <p>Complete your order with ease.</p>
        </div>

        {productsLoading && bag.length > 0 ? (
          <div className="checkout-loading">
            UPDATING YOUR ORDER
          </div>
        ) : (
        <div className="checkout-layout">
          <form
            className="checkout-form"
            onSubmit={async (event) => {
              event.preventDefault()

              const form = event.currentTarget

              if (!form.checkValidity()) {
                form.reportValidity()
                return
              }

              if (stockIssue) {
                window.alert(
                  stockIssue.product.stock && stockIssue.product.stock > 0
                    ? `${stockIssue.product.name} has only ${stockIssue.product.stock} available. Please update your bag.`
                    : `${stockIssue.product.name} is currently out of stock. Please update your bag.`,
                )
                onNavigate('bag')
                return
              }

              if (selectedAddress && !showNewAddressForm) {
                const selectedCheckoutAddress: CheckoutAddress = {
                  fullName: selectedAddress.fullName,
                  phone: selectedAddress.phone,
                  addressLine1: selectedAddress.addressLine1,
                  addressLine2: selectedAddress.addressLine2,
                  city: selectedAddress.city,
                  state: selectedAddress.state,
                  postalCode: selectedAddress.postalCode,
                  country: selectedAddress.country,
                }

                setCheckoutAddress(selectedCheckoutAddress)
                saveCheckoutAddress(selectedCheckoutAddress)
                onNavigate('payment')
                return
              }

              const formData = new FormData(form)

              const firstName = String(formData.get('firstName') ?? '').trim()
              const lastName = String(formData.get('lastName') ?? '').trim()

              const newAddress: CheckoutAddress = {
                fullName: `${firstName} ${lastName}`.trim(),
                phone: String(formData.get('phone') ?? '').trim(),
                addressLine1: String(formData.get('addressLine1') ?? '').trim(),
                addressLine2: String(formData.get('addressLine2') ?? '').trim(),
                city: String(formData.get('city') ?? '').trim(),
                state: String(formData.get('state') ?? '').trim(),
                postalCode: String(formData.get('postalCode') ?? '').trim(),
                country: 'India',
              }

              setCheckoutAddress(newAddress)
              saveCheckoutAddress(newAddress)

              if (user) {
                const isDuplicate = savedAddresses.some((address) =>
                  address.fullName.trim().toLowerCase() === newAddress.fullName.toLowerCase() &&
                  address.phone.trim() === newAddress.phone &&
                  address.addressLine1.trim().toLowerCase() === newAddress.addressLine1.toLowerCase() &&
                  address.addressLine2.trim().toLowerCase() === newAddress.addressLine2.toLowerCase() &&
                  address.city.trim().toLowerCase() === newAddress.city.toLowerCase() &&
                  address.state.trim().toLowerCase() === newAddress.state.toLowerCase() &&
                  address.postalCode.trim() === newAddress.postalCode
                )

                if (!isDuplicate) {
                  try {
                    const { addSavedAddress } = await import('../lib/addresses')

                    await addSavedAddress(user.uid, {
                      ...newAddress,
                      isDefault: savedAddresses.length === 0,
                    })
                  } catch (saveError) {
                    console.error(
                      'Failed to save checkout address:',
                      saveError,
                    )
                  }
                }
              }

              onNavigate('payment')
            }}
          >
            <div className="checkout-section">
              <span className="checkout-section-number">01</span>
              <div>
                <h2>CONTACT INFORMATION</h2>
                <p>Your details for order updates.</p>
              </div>
            </div>

            <label>
              EMAIL ADDRESS
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <div className="checkout-section">
              <span className="checkout-section-number">02</span>
              <div>
                <h2>DELIVERY ADDRESS</h2>
                <p>Where should we deliver your THAANE order?</p>
              </div>
            </div>

            {user && savedAddresses.length > 0 && (
              <div className="checkout-saved-addresses">
                <div className="checkout-saved-addresses-heading">
                  <span>SAVED ADDRESSES</span>
                  <small>
                    Choose an address or enter a new one.
                  </small>
                </div>

                <div className="checkout-saved-address-list">
                  {savedAddresses.map((address) => (
                    <button
                      type="button"
                      className={`checkout-saved-address ${
                        selectedAddressId === address.id &&
                        !showNewAddressForm
                          ? 'is-selected'
                          : ''
                      }`}
                      key={address.id}
                      onClick={() => {
                        setSelectedAddressId(address.id)
                        setShowNewAddressForm(false)
                      }}
                    >
                      <span className="checkout-saved-address-radio">
                        {selectedAddressId === address.id &&
                          !showNewAddressForm && (
                            <Check
                              size={12}
                              strokeWidth={1.5}
                            />
                          )}
                      </span>

                      <span className="checkout-saved-address-copy">
                        <strong>
                          {address.fullName}
                        </strong>

                        <small>
                          {address.addressLine1}
                          {address.addressLine2
                            ? `, ${address.addressLine2}`
                            : ''}
                        </small>

                        <small>
                          {address.city}, {address.state}{' '}
                          {address.postalCode}
                        </small>

                        <small>
                          {address.phone}
                        </small>
                      </span>

                      {address.isDefault && (
                        <span className="checkout-saved-address-default">
                          DEFAULT
                        </span>
                      )}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`checkout-new-address-option ${
                      showNewAddressForm
                        ? 'is-selected'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedAddressId(null)
                      setShowNewAddressForm(true)
                    }}
                  >
                    <span className="checkout-saved-address-radio">
                      {showNewAddressForm && (
                        <Check
                          size={12}
                          strokeWidth={1.5}
                        />
                      )}
                    </span>

                    <span>
                      USE A NEW ADDRESS
                    </span>
                  </button>
                </div>
              </div>
            )}

            {(!user ||
              savedAddresses.length === 0 ||
              showNewAddressForm) && (
              <>
              <div className="checkout-form-grid">
              <label>
                FIRST NAME
                <input type="text" name="firstName"
                  placeholder="First name" required />
              </label>

              <label>
                LAST NAME
                <input type="text" name="lastName"
                  placeholder="Last name" required />
              </label>
            </div>

            <label>
              ADDRESS
              <input type="text" name="addressLine1" placeholder="Street address" required />
            </label>

            <div className="checkout-form-grid">
              <label>
                CITY
                <input type="text" name="city"
                placeholder="City" required />
              </label>

              <label>
                PINCODE
                <input
                type="text"
                name="postalCode"
                placeholder="Pincode"
                inputMode="numeric"
                pattern="[0-9]{6}"
                title="Enter a valid 6-digit pincode"
                required
              />
              </label>
            </div>

            <label>
              STATE
              <input type="text" name="state"
                placeholder="State" required />
            </label>

            <label>
              PHONE NUMBER
              <input
                type="tel"
                name="phone"
                placeholder="+91"
                inputMode="tel"
                required
              />
            </label>
              </>
            )}

            {user &&
              savedAddresses.length > 0 &&
              !showNewAddressForm &&
              selectedAddress && (
                <div className="checkout-selected-address-note">
                  <MapPin size={14} strokeWidth={1.2} />
                  <span>
                    Delivering to your selected saved address.
                  </span>
                </div>
              )}

            <div className="checkout-section checkout-payment-section">
              <span className="checkout-section-number">03</span>
              <div>
                <h2>PAYMENT</h2>
                <p>Secure payment options will be available here.</p>
              </div>
            </div>

            <button
              className="checkout-payment-button"
              type="submit"
            >
              CONTINUE TO PAYMENT
            </button>
          </form>

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
              <span>SUBTOTAL</span>
              <strong>₹{total.toLocaleString('en-IN')}</strong>
            </div>

            <div className="checkout-summary-note">
              Shipping and taxes will be calculated before payment.
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
