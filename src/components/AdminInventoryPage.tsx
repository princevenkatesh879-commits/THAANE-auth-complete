import { ArrowLeft, Package } from 'lucide-react'
import { useState } from 'react'
import { categoryLabels } from '../lib/products'
import AdminProductEditor from './AdminProductEditor'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type AdminInventoryPageProps = {
  onNavigate: (page: string) => void
}

export default function AdminInventoryPage({
  onNavigate,
}: AdminInventoryPageProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const { products, loading } = useFirestoreProducts()

  if (editingProductId) {
    return (
      <AdminProductEditor
        productId={editingProductId}
        onClose={() => setEditingProductId(null)}
      />
    )
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
          <strong>INVENTORY</strong>
        </div>

        <button
          className="admin-exit"
          onClick={() => onNavigate('home')}
        >
          EXIT ADMIN
        </button>
      </header>

      <section className="admin-content">
        <div className="admin-products-toolbar">
          <div className="admin-intro">
            <span>STORE MANAGEMENT</span>
            <h1>INVENTORY</h1>
            <p>Monitor and update THAANE stock levels.</p>
          </div>
        </div>

        <div className="admin-products-count">
          <Package size={17} strokeWidth={1.2} />
          <span>
            {loading
              ? 'LOADING INVENTORY'
              : `${products.length} PRODUCTS IN INVENTORY`}
          </span>
        </div>

        <div className="admin-products-list">
          {loading ? (
            <div className="admin-products-empty">
              LOADING LIVE INVENTORY
            </div>
          ) : products.length === 0 ? (
            <div className="admin-products-empty">
              NO PRODUCTS IN INVENTORY
            </div>
          ) : (
            products.map((product) => {
              const stock = product.stock ?? 0

              const status =
                stock === 0
                  ? 'OUT OF STOCK'
                  : stock < 5
                    ? 'LOW STOCK'
                    : 'IN STOCK'

              return (
                <article
                  className="admin-product-row"
                  key={product.id}
                >
                  <div className="admin-product-image">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>

                  <div className="admin-product-info">
                    <strong>{product.name}</strong>
                    <span>{product.id}</span>
                  </div>

                  <div className="admin-product-category">
                    <span>CATEGORY</span>
                    <strong>
                      {categoryLabels[product.category]}
                    </strong>
                  </div>

                  <div className="admin-product-price">
                    <span>STOCK</span>
                    <strong>{stock}</strong>
                  </div>

                  <div className="admin-product-status">
                    <span>STATUS</span>
                    <strong>{status}</strong>
                  </div>

                  <button
                    className="admin-product-edit"
                    type="button"
                    onClick={() =>
                      setEditingProductId(product.id)
                    }
                  >
                    EDIT STOCK
                  </button>
                </article>
              )
            })
          )}
        </div>

        <button
          className="admin-back-link"
          type="button"
          onClick={() => onNavigate('admin')}
        >
          <ArrowLeft size={16} strokeWidth={1.2} />
          BACK TO DASHBOARD
        </button>
      </section>
    </main>
  )
}
