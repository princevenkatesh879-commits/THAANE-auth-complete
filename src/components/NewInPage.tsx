import type { User } from 'firebase/auth'
import ProductGrid from './ProductGrid'
import CollectionHeader from './CollectionHeader'

type NewInPageProps = {
  onNavigate: (page: string) => void
  user?: User | null
}

export default function NewInPage({ onNavigate, user }: NewInPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="new-in"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>THE LATEST EDIT</span>
          <h1>NEW IN</h1>
          <p>
            The newest additions to the THAANE wardrobe.
          </p>
        </div>

        <ProductGrid
          user={user}
          showHeading={false}
          initialCategory="new-in"
          onProduct={(id) => onNavigate(`product/${id}`)}
        />
      </section>
    </main>
  )
}
