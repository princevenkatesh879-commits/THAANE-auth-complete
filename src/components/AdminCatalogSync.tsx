import { Check, Database, Upload } from 'lucide-react'
import { useState } from 'react'
import { products } from '../lib/products'
import { saveAllFirestoreProducts } from '../lib/firestoreProducts'

type AdminCatalogSyncProps = {
  onNavigate: (page: string) => void
}

export default function AdminCatalogSync({
  onNavigate,
}: AdminCatalogSyncProps) {
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [error, setError] = useState('')

  const syncCatalog = async () => {
    setSyncing(true)
    setSynced(false)
    setError('')

    try {
      await saveAllFirestoreProducts(products)
      setSynced(true)
    } catch (syncError) {
      console.error('Catalog sync failed:', syncError)
      setError(
        'Catalog sync failed. Please check Firestore rules and your connection.',
      )
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button
          className="admin-logo"
          onClick={() => onNavigate('admin')}
          aria-label="Back to admin dashboard"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <div className="admin-header-title">
          <span>THAANE</span>
          <strong>CATALOG SYNC</strong>
        </div>

        <button
          className="admin-exit"
          onClick={() => onNavigate('home')}
        >
          EXIT ADMIN
        </button>
      </header>

      <section className="admin-content">
        <div className="admin-intro">
          <span>FIRESTORE MANAGEMENT</span>
          <h1>CATALOG SYNC</h1>
          <p>
            Upload the current THAANE catalogue to the shared Firestore
            product database.
          </p>
        </div>

        <div className="admin-sync-card">
          <Database size={28} strokeWidth={1.2} />

          <div>
            <span>PRODUCT CATALOGUE</span>
            <strong>{products.length} PRODUCTS READY</strong>
            <p>
              This will create or update the existing product documents
              in Firestore.
            </p>
          </div>

          <button
            className="admin-primary-action"
            type="button"
            onClick={syncCatalog}
            disabled={syncing}
          >
            {synced ? (
              <Check size={17} strokeWidth={1.3} />
            ) : (
              <Upload size={17} strokeWidth={1.3} />
            )}

            {syncing
              ? 'SYNCING...'
              : synced
                ? 'CATALOG SYNCED'
                : 'SYNC CATALOG'}
          </button>
        </div>

        {error && (
          <div className="admin-sync-error">
            {error}
          </div>
        )}

        <button
          className="admin-back-link"
          type="button"
          onClick={() => onNavigate('admin')}
        >
          ← BACK TO DASHBOARD
        </button>
      </section>
    </main>
  )
}
