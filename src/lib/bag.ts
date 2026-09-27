import { products, type Product } from './products'

export type BagItem = {
  productId: string
  quantity: number
  size?: string
  color?: string
}

const STORAGE_KEY_PREFIX = 'thaane-bag'
let activeBagUserKey: string | null = null

export function setBagUser(userKey: string | null) {
  activeBagUserKey = userKey
  notifyBagUpdated()
}

function getStorageKey() {
  return activeBagUserKey
    ? `${STORAGE_KEY_PREFIX}:${activeBagUserKey}`
    : null
}
const BAG_UPDATED_EVENT = 'thaane-bag-updated'

function notifyBagUpdated() {
  window.dispatchEvent(new Event(BAG_UPDATED_EVENT))
}

function getItemKey(item: BagItem) {
  return `${item.productId}::${item.size || ''}::${item.color || ''}`
}

export function getBag(): BagItem[] {
  try {
    const key = getStorageKey()

    if (!key) {
      return []
    }

    const stored = localStorage.getItem(key)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
  } catch {
    return []
  }
}

export function saveBag(items: BagItem[]) {
  const key = getStorageKey()

  if (!key) {
    return
  }

  localStorage.setItem(key, JSON.stringify(items))
  notifyBagUpdated()
}

export function addToBag(
  productId: string,
  quantity = 1,
  size?: string,
  color?: string,
  maxStock?: number,
) {
  const bag = getBag()
  const newItem: BagItem = {
    productId,
    quantity,
    size,
    color,
  }

  const existing = bag.find(
    (item) => getItemKey(item) === getItemKey(newItem),
  )

  const requestedQuantity = existing
    ? existing.quantity + quantity
    : quantity

  const safeQuantity =
    typeof maxStock === 'number'
      ? Math.min(requestedQuantity, Math.max(0, maxStock))
      : requestedQuantity

  if (safeQuantity <= 0) {
    return
  }

  if (existing) {
    existing.quantity = safeQuantity
  } else {
    bag.push({
      ...newItem,
      quantity: safeQuantity,
    })
  }

  saveBag(bag)
}

export function updateBagQuantity(
  productId: string,
  quantity: number,
  size?: string,
  color?: string,
) {
  const bag = getBag()

  const targetKey = getItemKey({
    productId,
    quantity,
    size,
    color,
  })

  const updated = bag
    .map((item) =>
      getItemKey(item) === targetKey
        ? { ...item, quantity }
        : item,
    )
    .filter((item) => item.quantity > 0)

  saveBag(updated)
}

export function removeFromBag(
  productId: string,
  size?: string,
  color?: string,
) {
  const targetKey = getItemKey({
    productId,
    quantity: 1,
    size,
    color,
  })

  const bag = getBag().filter(
    (item) => getItemKey(item) !== targetKey,
  )

  saveBag(bag)
}

export function clearBag() {
  saveBag([])
}

export function getBagProducts(): Array<{
  product: Product
  quantity: number
  size?: string
  color?: string
}> {
  const bag = getBag()

  return bag
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
    .filter(
      (
        item,
      ): item is {
        product: Product
        quantity: number
        size: string | undefined
        color: string | undefined
      } => item !== null,
    )
}

export function syncBagWithProducts(
  liveProducts: Product[],
) {
  const bag = getBag()

  const validItems = bag
    .map((item) => {
      const product = liveProducts.find(
        (product) => product.id === item.productId,
      )

      if (!product) {
        return null
      }

      const stock = product.stock ?? 0

      if (
        stock <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return null
      }

      return {
        ...item,
        quantity: Math.min(item.quantity, stock),
      }
    })
    .filter(
      (item): item is BagItem => item !== null,
    )

  const changed =
    JSON.stringify(validItems) !== JSON.stringify(bag)

  if (changed) {
    saveBag(validItems)
  }

  return validItems
}

export function getBagCount(liveProducts?: Product[]) {
  const bag = getBag()

  if (!liveProducts) {
    return bag.reduce(
      (total, item) => total + item.quantity,
      0,
    )
  }

  return bag.reduce((total, item) => {
    const product = liveProducts.find(
      (product) => product.id === item.productId,
    )

    if (!product) {
      return total
    }

    const stock = product.stock ?? 0

    if (stock <= 0) {
      return total
    }

    return total + Math.min(item.quantity, stock)
  }, 0)
}

export function getBagTotal() {
  return getBagProducts().reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )
}
