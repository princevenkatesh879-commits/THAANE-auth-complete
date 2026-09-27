import type { User } from 'firebase/auth'
import ProductGrid from './ProductGrid'
import CollectionHeader from './CollectionHeader'

type SareesPageProps = {
  onNavigate: (page: string) => void
  user?: User | null
}

export default function SareesPage({ onNavigate, user }: SareesPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="sarees"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>TIMELESS WEAVES</span>
          <h1>SAREES</h1>
          <p>
            Draped silhouettes and refined textiles made for modern occasions.
          </p>
        </div>

        <ProductGrid
          user={user}
          showHeading={false}
          initialCategory="sarees"
          onProduct={(id) => onNavigate(`product/${id}`)}
        />
      </section>
    </main>
  )
}
