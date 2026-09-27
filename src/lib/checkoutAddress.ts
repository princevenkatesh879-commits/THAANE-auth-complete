export type CheckoutAddress = {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

const STORAGE_KEY = 'thaane_checkout_address'

export function getCheckoutAddress(): CheckoutAddress | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)

    if (!stored) {
      return null
    }

    return JSON.parse(stored) as CheckoutAddress
  } catch {
    return null
  }
}

export function saveCheckoutAddress(
  address: CheckoutAddress,
) {
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(address),
  )
}

export function clearCheckoutAddress() {
  sessionStorage.removeItem(STORAGE_KEY)
}
