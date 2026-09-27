import { ArrowLeft, Package, Plus } from 'lucide-react'
import { useState } from 'react'
import { categoryLabels } from '../lib/products'
import AdminProductEditor from './AdminProductEditor'
import { deleteFirestoreProduct } from '../lib/firestoreProducts'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type AdminProductsPageProps = {
  onNavigate: (page: string) => void
}

export default function AdminProductsPage({
  onNavigate,
}: AdminProductsPageProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [addingProduct, setAddingProduct] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const { products, loading } = useFirestoreProducts()

  const handleDelete = async (
    productId: string,
    productName: string,
  ) => {
    const confirmed = window.confirm(
      `Delete "${productName}" from the THAANE catalogue? This cannot be undone.`,
    )

    if (!confirmed) return

    try {
      setDeletingProductId(productId)
      await deleteFirestoreProduct(productId)
    } catch (error) {
      console.error('Failed to delete product:', error)
      window.alert(
        'Could not delete the product. Please check your connection and Firestore permissions.',
      )
    } finally {
      setDeletingProductId(null)
    }
  }

  if (editingProductId || addingProduct) {
    return (
      <AdminProductEditor
        productId={editingProductId}
        onClose={() => {
          setEditingProductId(null)
          setAddingProduct(false)
        }}
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
          <strong>PRODUCTS</strong>
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
            <h1>PRODUCTS</h1>
            <p>Manage the THAANE product catalogue.</p>
          </div>

          <button
            className="admin-primary-action"
            type="button"
            onClick={() => setAddingProduct(true)}
          >
            <Plus size={17} strokeWidth={1.3} />
            ADD PRODUCT
          </button>
        </div>

        <div className="admin-products-count">
          <Package size={17} strokeWidth={1.2} />
          <span>
            {loading
              ? 'LOADING CATALOGUE'
              : `${products.length} PRODUCTS IN CATALOGUE`}
          </span>
        </div>

        <div className="admin-products-list">
          {loading ? (
            <div className="admin-products-empty">
              LOADING LIVE CATALOGUE
            </div>
          ) : products.length === 0 ? (
            <div className="admin-products-empty">
              NO PRODUCTS IN CATALOGUE
            </div>
          ) : (
            products.map((product) => (
            <article className="admin-product-row" key={product.id}>
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
                <span>PRICE</span>
                <strong>
                  ₹{product.price.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="admin-product-status">
                <span>STATUS</span>
                <strong>
                  {product.available ? 'AVAILABLE' : 'UNAVAILABLE'}
                </strong>
              </div>

                  <div className="admin-product-actions">
                    <button
                      className="admin-product-edit"
                      type="button"
                      onClick={() => setEditingProductId(product.id)}
                    >
                      EDIT
                    </button>

                    <button
                      className="admin-product-delete"
                      type="button"
                      disabled={deletingProductId === product.id}
                      onClick={() =>
                        handleDelete(product.id, product.name)
                      }
                    >
                      {deletingProductId === product.id
                        ? 'DELETING...'
                        : 'DELETE'}
                    </button>
                  </div>
            </article>
            ))
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
