import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export type SavedAddress = {
  id: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

type AddressInput = Omit<SavedAddress, 'id'>

const addressesCollection = (uid: string) =>
  collection(db, 'users', uid, 'addresses')

export function subscribeToAddresses(
  uid: string,
  onChange: (addresses: SavedAddress[]) => void,
  onError?: (error: Error) => void,
) {
  const addressesQuery = query(
    addressesCollection(uid),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    addressesQuery,
    (snapshot) => {
      const addresses = snapshot.docs.map((item) => {
        const data = item.data()

        return {
          id: item.id,
          fullName: data.fullName ?? '',
          phone: data.phone ?? '',
          addressLine1: data.addressLine1 ?? '',
          addressLine2: data.addressLine2 ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          postalCode: data.postalCode ?? '',
          country: data.country ?? 'India',
          isDefault: data.isDefault === true,
        }
      })

      onChange(addresses)
    },
    (error) => {
      console.error('Failed to load saved addresses:', error)
      onError?.(error)
    },
  )
}

export async function addSavedAddress(
  uid: string,
  address: AddressInput,
) {
  if (address.isDefault) {
    await clearDefaultAddress(uid)
  }

  await addDoc(addressesCollection(uid), {
    ...address,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateSavedAddress(
  uid: string,
  addressId: string,
  address: AddressInput,
) {
  if (address.isDefault) {
    await clearDefaultAddress(uid, addressId)
  }

  await updateDoc(
    doc(db, 'users', uid, 'addresses', addressId),
    {
      ...address,
      updatedAt: serverTimestamp(),
    },
  )
}

export async function deleteSavedAddress(
  uid: string,
  addressId: string,
) {
  await deleteDoc(
    doc(db, 'users', uid, 'addresses', addressId),
  )
}

async function clearDefaultAddress(
  uid: string,
  exceptAddressId?: string,
) {
  return new Promise<void>((resolve, reject) => {
    const unsubscribe = subscribeToAddresses(
      uid,
      async (addresses) => {
        unsubscribe()

        try {
          await Promise.all(
            addresses
              .filter(
                (address) =>
                  address.isDefault &&
                  address.id !== exceptAddressId,
              )
              .map((address) =>
                updateDoc(
                  doc(db, 'users', uid, 'addresses', address.id),
                  {
                    isDefault: false,
                    updatedAt: serverTimestamp(),
                  },
                ),
              ),
          )

          resolve()
        } catch (error) {
          reject(error)
        }
      },
      (error) => {
        unsubscribe()
        reject(error)
      },
    )
  })
}
