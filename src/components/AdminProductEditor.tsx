import { ArrowLeft, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { saveFirestoreProduct } from '../lib/firestoreProducts'
import { categoryLabels, ProductCategory } from '../lib/products'
import { useFirestoreProducts } from '../lib/useFirestoreProducts'

type AdminProductEditorProps = {
  productId: string | null
  onClose: () => void
}

export default function AdminProductEditor({
  productId,
  onClose,
}: AdminProductEditorProps) {
  const { products, loading } = useFirestoreProducts()

  const product = productId
    ? products.find((item) => item.id === productId)
    : undefined

  const isNewProduct = !productId

  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product?.price.toString() ?? '')
  const [category, setCategory] = useState<ProductCategory>(
    product?.category ?? 'dresses',
  )
  const [description, setDescription] = useState(
    product?.description ?? '',
  )
  const [image, setImage] = useState(product?.image ?? '')
  const [sizes, setSizes] = useState(
    product?.sizes?.join(', ') ?? '',
  )
  const [colors, setColors] = useState(
    product?.colors?.join(', ') ?? '',
  )
  const [stock, setStock] = useState(
    product?.stock?.toString() ?? '0',
  )
  const [featured, setFeatured] = useState(product?.featured ?? false)
  const [available, setAvailable] = useState(product?.available ?? true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!product) return

    setName(product.name)
    setPrice(product.price.toString())
    setCategory(product.category)
    setDescription(product.description ?? '')
    setImage(product.image)
    setSizes(product.sizes?.join(', ') ?? '')
    setColors(product.colors?.join(', ') ?? '')
    setStock(product.stock?.toString() ?? '0')
    setFeatured(product.featured ?? false)
    setAvailable(product.available ?? true)
  }, [product])

  if (loading && !isNewProduct) {
    return (
      <main className="admin-page">
        <section className="admin-content">
          <div className="admin-products-empty">
            LOADING LIVE PRODUCT
          </div>
        </section>
      </main>
    )
  }

  if (!product && !isNewProduct) {
    return (
      <main className="admin-page">
        <header className="admin-header">
          <button
            className="admin-logo"
            onClick={onClose}
            aria-label="Back to products"
          >
            <img src="/thaane-logo-black.png" alt="THAANE" />
          </button>

          <div className="admin-header-title">
            <span>THAANE</span>
            <strong>PRODUCT EDITOR</strong>
          </div>

          <button className="admin-exit" onClick={onClose}>
            CLOSE
          </button>
        </header>

        <section className="admin-content">
          <div className="admin-intro">
            <span>STORE MANAGEMENT</span>
            <h1>NOT FOUND</h1>
            <p>The selected product could not be found.</p>
          </div>

          <button className="admin-back-link" onClick={onClose}>
            <ArrowLeft size={16} strokeWidth={1.2} />
            BACK TO PRODUCTS
          </button>
        </section>
      </main>
    )
  }

  const handleSave = async () => {
    const numericPrice = Number(price)

    if (!name.trim()) {
      window.alert('Please enter a product name.')
      return
    }

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      window.alert('Please enter a valid price.')
      return
    }

    const numericStock = Number(stock)

    if (
      !Number.isInteger(numericStock) ||
      numericStock < 0
    ) {
      window.alert('Please enter a valid stock quantity.')
      return
    }

    try {
      const parsedSizes = sizes
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      const parsedColors = colors
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean)

      const productIdToSave =
        product?.id ||
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ||
        `product-${Date.now()}`

      const productToSave = {
        id: productIdToSave,
        name: name.trim(),
        price: numericPrice,
        category,
        image: image.trim(),
        description: description.trim(),
        sizes: parsedSizes,
        colors: parsedColors,
        stock: numericStock,
        featured,
        available: numericStock > 0,
      }

      await saveFirestoreProduct(productToSave)

      setSaved(true)

      window.setTimeout(() => {
        setSaved(false)
      }, 1800)
    } catch (error) {
      console.error('Failed to save product:', error)
      window.alert(
        'Could not save the product. Please check your connection and Firestore permissions.',
      )
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button
          className="admin-logo"
          onClick={onClose}
          aria-label="Back to products"
        >
          <img src="/thaane-logo-black.png" alt="THAANE" />
        </button>

        <div className="admin-header-title">
          <span>THAANE</span>
          <strong>EDIT PRODUCT</strong>
        </div>

        <button className="admin-exit" onClick={onClose}>
          CLOSE
        </button>
      </header>

      <section className="admin-content">
        <div className="admin-products-toolbar">
          <div className="admin-intro">
            <span>
              STORE MANAGEMENT / {isNewProduct ? 'NEW PRODUCT' : product?.id}
            </span>
            <h1>{isNewProduct ? 'ADD PRODUCT' : 'EDIT PRODUCT'}</h1>
            <p>
              {isNewProduct
                ? 'Create a new THAANE product for the catalogue.'
                : 'Update the details for this THAANE product.'}
            </p>
          </div>

          <button
            className="admin-primary-action"
            type="button"
            onClick={handleSave}
          >
            <Save size={17} strokeWidth={1.3} />
            {saved
              ? 'SAVED'
              : isNewProduct
                ? 'CREATE PRODUCT'
                : 'SAVE CHANGES'}
          </button>
        </div>

        <div className="admin-editor">
          <div className="admin-editor-preview">
            <div className="admin-editor-image">
              <img
                src={image}
                alt={name}
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            </div>

            <span>IMAGE PREVIEW</span>
          </div>

          <div className="admin-editor-form">
            <label>
              <span>PRODUCT NAME</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>

            <label>
              <span>PRICE (INR)</span>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>

            <label>
              <span>CATEGORY</span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ProductCategory)
                }
              >
                {Object.entries(categoryLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>IMAGE PATH</span>
              <input
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="/assets/products/..."
              />
            </label>

            <label>
              <span>STOCK QUANTITY</span>
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
              />
              <small className="admin-field-help">
                0 automatically marks this product out of stock.
              </small>
            </label>

            <label className="admin-editor-full">
              <span>DESCRIPTION</span>
              <textarea
                rows={5}
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
              />
            </label>

            <label>
              <span>SIZES</span>
              <input
                value={sizes}
                onChange={(event) => setSizes(event.target.value)}
                placeholder="XS, S, M, L, XL"
              />
              <small className="admin-field-help">
                Separate sizes with commas.
              </small>
            </label>

            <label>
              <span>COLOURS</span>
              <input
                value={colors}
                onChange={(event) => setColors(event.target.value)}
                placeholder="BLACK, IVORY, WINE"
              />
              <small className="admin-field-help">
                Separate colours with commas.
              </small>
            </label>

            <div className="admin-editor-options">
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) =>
                    setFeatured(event.target.checked)
                  }
                />
                <span>FEATURED / NEW IN</span>
              </label>

              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(event) =>
                    setAvailable(event.target.checked)
                  }
                />
                <span>AVAILABLE FOR SALE</span>
              </label>
            </div>
          </div>
        </div>

        <button className="admin-back-link" type="button" onClick={onClose}>
          <X size={16} strokeWidth={1.2} />
          CANCEL / BACK TO PRODUCTS
        </button>
      </section>
    </main>
  )
}
