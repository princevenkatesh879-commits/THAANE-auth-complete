const WISHLIST_KEY_PREFIX = 'thaane-wishlist'
let activeWishlistUserKey: string | null = null

export function setWishlistUser(userKey: string | null) {
  activeWishlistUserKey = userKey
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT))
}

function getWishlistKey() {
  return activeWishlistUserKey
    ? `${WISHLIST_KEY_PREFIX}:${activeWishlistUserKey}`
    : null
}
export const WISHLIST_UPDATED_EVENT = 'thaane-wishlist-updated'

export function getWishlist(): string[] {
  try {
    const key = getWishlistKey()

    if (!key) {
      return []
    }

    const stored = localStorage.getItem(key)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId)
}

export function addToWishlist(productId: string): void {
  const wishlist = getWishlist()

  if (wishlist.includes(productId)) {
    return
  }

  const key = getWishlistKey()

  if (!key) {
    return
  }

  localStorage.setItem(
    key,
    JSON.stringify([...wishlist, productId]),
  )

  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT))
}

export function removeFromWishlist(productId: string): void {
  const wishlist = getWishlist()

  const key = getWishlistKey()

  if (!key) {
    return
  }

  localStorage.setItem(
    key,
    JSON.stringify(
      wishlist.filter((id) => id !== productId),
    ),
  )

  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT))
}

export function toggleWishlist(productId: string): boolean {
  if (isInWishlist(productId)) {
    removeFromWishlist(productId)
    return false
  }

  addToWishlist(productId)
  return true
}
