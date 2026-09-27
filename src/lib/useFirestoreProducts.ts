import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import { products as fallbackProducts } from './products'
import type { Product } from './products'

const PRODUCTS_COLLECTION = 'products'

export function useFirestoreProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const productsQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      orderBy('name'),
    )

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const firestoreProducts = snapshot.docs.map(
          (item) => item.data() as Product,
        )

        if (firestoreProducts.length > 0) {
          setProducts(firestoreProducts)
        } else {
          setProducts(fallbackProducts)
        }

        setLoading(false)
      },
      (error) => {
        console.error('Failed to load Firestore products:', error)
        setProducts(fallbackProducts)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return {
    products,
    loading,
  }
}
