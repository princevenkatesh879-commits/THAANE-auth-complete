import type { User } from 'firebase/auth'
import ProductGrid from './ProductGrid'
import CollectionHeader from './CollectionHeader'

type AccessoriesPageProps = {
  onNavigate: (page: string) => void
  user?: User | null
}

export default function AccessoriesPage({
  onNavigate,
  user,
}: AccessoriesPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="accessories"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>THE FINISHING EDIT</span>
          <h1>ACCESSORIES</h1>
          <p>
            Thoughtful finishing pieces designed to complete the THAANE wardrobe.
          </p>
        </div>

        <ProductGrid
          user={user}
          showHeading={false}
          initialCategory="accessories"
          onProduct={(id) => onNavigate(`product/${id}`)}
        />
      </section>
    </main>
  )
}
