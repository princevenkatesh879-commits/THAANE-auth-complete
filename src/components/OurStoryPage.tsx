import CollectionHeader from './CollectionHeader'

type OurStoryPageProps = {
  onNavigate: (page: string) => void
}

export default function OurStoryPage({
  onNavigate,
}: OurStoryPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="our-story"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>THE HOUSE OF THAANE</span>
          <h1>OUR STORY</h1>
          <p>
            A modern expression of Indian fashion, shaped by craftsmanship,
            restraint and timeless design.
          </p>
        </div>

        <div className="story-layout">
          <div className="story-image">
            <span>THAANE</span>
          </div>

          <div className="story-content">
            <span>01 / THE BEGINNING</span>

            <h2>
              ROOTED IN TRADITION.
              <br />
              DESIGNED FOR NOW.
            </h2>

            <p>
              THAANE is a women&apos;s fashion house built around the idea
              that elegance does not need to be loud.
            </p>

            <p>
              Our collections bring together refined silhouettes,
              considered textiles and the richness of Indian design,
              creating pieces made to live beyond a single season.
            </p>

            <span className="story-signature">
              THAANE
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
