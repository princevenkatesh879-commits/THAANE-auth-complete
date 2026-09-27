import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Product } from './products'

const PRODUCTS_COLLECTION = 'products'

export async function getFirestoreProducts(): Promise<Product[]> {
  const snapshot = await getDocs(
    collection(db, PRODUCTS_COLLECTION),
  )

  return snapshot.docs.map((item) => item.data() as Product)
}

export async function saveFirestoreProduct(
  product: Product,
): Promise<void> {
  await setDoc(
    doc(db, PRODUCTS_COLLECTION, product.id),
    product,
    { merge: true },
  )
}

export async function saveAllFirestoreProducts(
  products: Product[],
): Promise<void> {
  await Promise.all(
    products.map((product) => saveFirestoreProduct(product)),
  )
}


export async function deleteFirestoreProduct(
  productId: string,
): Promise<void> {
  await deleteDoc(
    doc(db, PRODUCTS_COLLECTION, productId),
  )
}
