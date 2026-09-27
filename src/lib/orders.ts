import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type OrderItem = {
  productId: string
  productName: string
  quantity: number
  price: number
  size: string
  color: string
}

export type OrderAddress = {
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type Order = {
  id: string
  userId: string | null
  customerEmail: string
  customerName: string
  items: OrderItem[]
  address: OrderAddress
  subtotal: number
  shipping: number
  total: number
  currency: string
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
  trackingNumber: string
  trackingCarrier: string
  estimatedDelivery: string
  trackingUrl: string
  razorpayOrderId: string
  razorpayPaymentId: string
  createdAt: unknown
  updatedAt: unknown
}

export type CreateOrderInput = Omit<
  Order,
  'id' | 'createdAt' | 'updatedAt'
>

const ordersCollection = collection(db, 'orders')

export async function createOrder(order: CreateOrderInput) {
  const reference = await addDoc(ordersCollection, {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return reference.id
}

export function subscribeToOrders(
  onChange: (orders: Order[]) => void,
  onError?: (error: Error) => void,
) {
  const ordersQuery = query(
    ordersCollection,
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((item) => {
        const data = item.data()

        return {
          id: item.id,
          userId: data.userId ?? null,
          customerEmail: data.customerEmail ?? '',
          customerName: data.customerName ?? '',
          items: Array.isArray(data.items) ? data.items : [],
          address: data.address ?? {
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
          },
          subtotal: Number(data.subtotal ?? 0),
          shipping: Number(data.shipping ?? 0),
          total: Number(data.total ?? 0),
          currency: data.currency ?? 'INR',
          paymentMethod: data.paymentMethod ?? 'ONLINE',
          paymentStatus: data.paymentStatus ?? 'pending',
          orderStatus: data.orderStatus ?? 'pending',
          trackingNumber: data.trackingNumber ?? '',
          trackingCarrier: data.trackingCarrier ?? '',
          estimatedDelivery: data.estimatedDelivery ?? '',
          trackingUrl: data.trackingUrl ?? '',
          razorpayOrderId: data.razorpayOrderId ?? '',
          razorpayPaymentId: data.razorpayPaymentId ?? '',
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        }
      })

      orders.sort((a, b) => {
        const getTime = (value: unknown) => {
          if (
            typeof value === 'object' &&
            value !== null &&
            'toDate' in value &&
            typeof value.toDate === 'function'
          ) {
            return value.toDate().getTime()
          }

          const time = new Date(String(value ?? '')).getTime()
          return Number.isNaN(time) ? 0 : time
        }

        return getTime(b.createdAt) - getTime(a.createdAt)
      })

      onChange(orders)
    },
    (error) => {
      console.error('Failed to load orders:', error)
      onError?.(error)
    },
  )
}

export function subscribeToUserOrders(
  userId: string,
  onChange: (orders: Order[]) => void,
  onError?: (error: Error) => void,
) {
  const ordersQuery = query(
    ordersCollection,
    where('userId', '==', userId),
  )

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders = snapshot.docs.map((item) => {
        const data = item.data()

        return {
          id: item.id,
          userId: data.userId ?? null,
          customerEmail: data.customerEmail ?? '',
          customerName: data.customerName ?? '',
          items: Array.isArray(data.items) ? data.items : [],
          address: data.address ?? {
            fullName: '',
            phone: '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'India',
          },
          subtotal: Number(data.subtotal ?? 0),
          shipping: Number(data.shipping ?? 0),
          total: Number(data.total ?? 0),
          currency: data.currency ?? 'INR',
          paymentMethod: data.paymentMethod ?? 'ONLINE',
          paymentStatus: data.paymentStatus ?? 'pending',
          orderStatus: data.orderStatus ?? 'pending',
          trackingNumber: data.trackingNumber ?? '',
          trackingCarrier: data.trackingCarrier ?? '',
          estimatedDelivery: data.estimatedDelivery ?? '',
          trackingUrl: data.trackingUrl ?? '',
          razorpayOrderId: data.razorpayOrderId ?? '',
          razorpayPaymentId: data.razorpayPaymentId ?? '',
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        }
      })

      onChange(orders)
    },
    (error) => {
      console.error('Failed to load user orders:', error)
      onError?.(error)
    },
  )
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: Order['orderStatus'],
) {
  await updateDoc(doc(db, 'orders', orderId), {
    orderStatus,
    updatedAt: serverTimestamp(),
  })
}

export async function updateOrderTracking(
  orderId: string,
  tracking: {
    trackingNumber: string
    trackingCarrier: string
    estimatedDelivery: string
    trackingUrl: string
  },
) {
  await updateDoc(doc(db, 'orders', orderId), {
    trackingNumber: tracking.trackingNumber,
    trackingCarrier: tracking.trackingCarrier,
    estimatedDelivery: tracking.estimatedDelivery,
    trackingUrl: tracking.trackingUrl,
    updatedAt: serverTimestamp(),
  })
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: Order['paymentStatus'],
) {
  await updateDoc(doc(db, 'orders', orderId), {
    paymentStatus,
    updatedAt: serverTimestamp(),
  })
}
