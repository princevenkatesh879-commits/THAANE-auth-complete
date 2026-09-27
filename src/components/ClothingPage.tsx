import type { User } from 'firebase/auth'
import ProductGrid from './ProductGrid'
import CollectionHeader from './CollectionHeader'

type ClothingPageProps = {
  onNavigate: (page: string) => void
  user?: User | null
}

export default function ClothingPage({ onNavigate, user }: ClothingPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="clothing"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>MODERN SILHOUETTES</span>
          <h1>CLOTHING</h1>
          <p>
            Refined essentials and considered silhouettes for every day.
          </p>
        </div>

        <ProductGrid
          user={user}
          showHeading={false}
          initialCategory="clothing"
          onProduct={(id) => onNavigate(`product/${id}`)}
        />
      </section>
    </main>
  )
}
