import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import {
  ArrowLeft,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import {
  addSavedAddress,
  deleteSavedAddress,
  subscribeToAddresses,
  updateSavedAddress,
  type SavedAddress,
} from '../lib/addresses'

type SavedAddressesPageProps = {
  user: User | null
  onNavigate: (page: string) => void
}

type AddressForm = Omit<SavedAddress, 'id'>

const emptyForm: AddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
}

export default function SavedAddressesPage({
  user,
  onNavigate,
}: SavedAddressesPageProps) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)

    const unsubscribe = subscribeToAddresses(
      user.uid,
      (nextAddresses) => {
        setAddresses(nextAddresses)
        setLoading(false)
      },
      () => {
        setError('Unable to load your saved addresses.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const openAddForm = () => {
    setEditingAddressId(null)
    setForm({
      ...emptyForm,
      isDefault: addresses.length === 0,
    })
    setError('')
    setShowForm(true)
  }

  const openEditForm = (address: SavedAddress) => {
    const { id, ...addressData } = address
    setEditingAddressId(id)
    setForm(addressData)
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (saving) return
    setShowForm(false)
    setEditingAddressId(null)
    setForm(emptyForm)
    setError('')
  }

  const updateField = (
    field: keyof AddressForm,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!user) return

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingAddressId) {
        await updateSavedAddress(
          user.uid,
          editingAddressId,
          form,
        )
      } else {
        await addSavedAddress(user.uid, form)
      }

      closeForm()
    } catch (saveError) {
      console.error('Failed to save address:', saveError)
      setError('Unable to save this address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteAddressId) return

    setDeleting(true)
    setError('')

    try {
      await deleteSavedAddress(user.uid, deleteAddressId)
      setDeleteAddressId(null)
    } catch (deleteError) {
      console.error('Failed to delete address:', deleteError)
      setError('Unable to delete this address. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (!user) {
    return (
      <main className="saved-addresses-page">
        <section className="saved-addresses-empty">
          <p className="saved-addresses-eyebrow">
            THAANE ACCOUNT
          </p>

          <h1>SAVED ADDRESSES</h1>

          <p>
            Please sign in to manage your saved delivery addresses.
          </p>

          <button
            type="button"
            onClick={() => onNavigate('home')}
          >
            BACK TO ACCOUNT
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="saved-addresses-page">

      <header className="saved-addresses-header">
        <button
          type="button"
          className="saved-addresses-back"
          onClick={() => onNavigate('account')}
        >
          <ArrowLeft size={15} strokeWidth={1.2} />
          ACCOUNT
        </button>

        <div className="saved-addresses-title">
          <span>THAANE ACCOUNT</span>
          <h1>SAVED ADDRESSES</h1>
        </div>

        <button
          type="button"
          className="saved-addresses-add"
          onClick={openAddForm}
        >
          <Plus size={15} strokeWidth={1.2} />
          ADD ADDRESS
        </button>
      </header>

      <section className="saved-addresses-content">

        <div className="saved-addresses-intro">
          <p>
            Save your preferred delivery addresses for a faster,
            smoother THAANE checkout.
          </p>
        </div>

        {error && (
          <div className="saved-addresses-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="saved-addresses-loading">
            LOADING ADDRESSES
          </div>
        ) : addresses.length === 0 ? (
          <div className="saved-addresses-empty-card">
            <MapPin size={24} strokeWidth={1.1} />

            <h2>NO SAVED ADDRESSES</h2>

            <p>
              Add a delivery address to make your next order easier.
            </p>

            <button
              type="button"
              onClick={openAddForm}
            >
              ADD YOUR FIRST ADDRESS
            </button>
          </div>
        ) : (
          <div className="saved-addresses-grid">
            {addresses.map((address) => (
              <article
                className="saved-address-card"
                key={address.id}
              >
                <div className="saved-address-card-top">
                  <div>
                    <span className="saved-address-label">
                      {address.isDefault
                        ? 'DEFAULT ADDRESS'
                        : 'SAVED ADDRESS'}
                    </span>

                    <h2>{address.fullName}</h2>
                  </div>

                  {address.isDefault && (
                    <span className="saved-address-check">
                      <Check size={13} strokeWidth={1.4} />
                    </span>
                  )}
                </div>

                <div className="saved-address-details">
                  <p>{address.phone}</p>
                  <p>{address.addressLine1}</p>

                  {address.addressLine2 && (
                    <p>{address.addressLine2}</p>
                  )}

                  <p>
                    {address.city}, {address.state}
                  </p>

                  <p>
                    {address.postalCode}, {address.country}
                  </p>
                </div>

                <div className="saved-address-actions">
                  <button
                    type="button"
                    onClick={() => openEditForm(address)}
                  >
                    <Pencil size={13} strokeWidth={1.2} />
                    EDIT
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteAddressId(address.id)}
                  >
                    <Trash2 size={13} strokeWidth={1.2} />
                    DELETE
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

      </section>

      {deleteAddressId && (
        <div
          className="saved-address-delete-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Delete saved address"
        >
          <div className="saved-address-delete-card">
            <span>THAANE ACCOUNT</span>

            <h2>DELETE ADDRESS?</h2>

            <p>
              This saved delivery address will be permanently
              removed from your account.
            </p>

            <div className="saved-address-delete-actions">
              <button
                type="button"
                onClick={() => setDeleteAddressId(null)}
                disabled={deleting}
              >
                KEEP ADDRESS
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'DELETING...' : 'DELETE ADDRESS'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="saved-address-modal">
          <div className="saved-address-modal-card">

            <div className="saved-address-modal-top">
              <div>
                <span>THAANE ACCOUNT</span>
                <h2>
                  {editingAddressId
                    ? 'EDIT ADDRESS'
                    : 'ADD ADDRESS'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
              >
                <X size={21} strokeWidth={1.2} />
              </button>
            </div>

            <div className="saved-address-form">

              <label>
                FULL NAME *
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    updateField(
                      'fullName',
                      event.target.value,
                    )
                  }
                  placeholder="Full name"
                />
              </label>

              <label>
                PHONE *
                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value,
                    )
                  }
                  placeholder="Phone number"
                  inputMode="tel"
                />
              </label>

              <label>
                ADDRESS LINE 1 *
                <input
                  value={form.addressLine1}
                  onChange={(event) =>
                    updateField(
                      'addressLine1',
                      event.target.value,
                    )
                  }
                  placeholder="House / flat / street"
                />
              </label>

              <label>
                ADDRESS LINE 2
                <input
                  value={form.addressLine2}
                  onChange={(event) =>
                    updateField(
                      'addressLine2',
                      event.target.value,
                    )
                  }
                  placeholder="Area / landmark"
                />
              </label>

              <div className="saved-address-form-row">
                <label>
                  CITY *
                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField(
                        'city',
                        event.target.value,
                      )
                    }
                    placeholder="City"
                  />
                </label>

                <label>
                  STATE *
                  <input
                    value={form.state}
                    onChange={(event) =>
                      updateField(
                        'state',
                        event.target.value,
                      )
                    }
                    placeholder="State"
                  />
                </label>
              </div>

              <div className="saved-address-form-row">
                <label>
                  POSTAL CODE *
                  <input
                    value={form.postalCode}
                    onChange={(event) =>
                      updateField(
                        'postalCode',
                        event.target.value,
                      )
                    }
                    placeholder="Postal code"
                    inputMode="numeric"
                  />
                </label>

                <label>
                  COUNTRY
                  <input
                    value={form.country}
                    onChange={(event) =>
                      updateField(
                        'country',
                        event.target.value,
                      )
                    }
                    placeholder="Country"
                  />
                </label>
              </div>

              <label className="saved-address-default">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    updateField(
                      'isDefault',
                      event.target.checked,
                    )
                  }
                />
                <span>
                  MAKE THIS MY DEFAULT ADDRESS
                </span>
              </label>

              {error && (
                <div className="saved-address-form-error">
                  {error}
                </div>
              )}

              <div className="saved-address-form-actions">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'SAVING...' : 'SAVE ADDRESS'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </main>
  )
}
