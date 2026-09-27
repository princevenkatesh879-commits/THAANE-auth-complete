import CollectionHeader from './CollectionHeader'

type JournalPageProps = {
  onNavigate: (page: string) => void
}

const journalEntries = [
  {
    number: '01',
    title: 'THE THAANE JOURNAL',
    category: 'THAANE NOTES',
    text: 'Stories on style, craftsmanship, textiles and the quiet details behind the THAANE wardrobe.',
  },
  {
    number: '02',
    title: 'THE ART OF DRESSING',
    category: 'STYLE',
    text: 'A considered approach to dressing — refined silhouettes, thoughtful layers and timeless pieces.',
  },
  {
    number: '03',
    title: 'TEXTURES & STORIES',
    category: 'CRAFT',
    text: 'Exploring the materials, techniques and traditions that inspire each THAANE collection.',
  },
]

export default function JournalPage({ onNavigate }: JournalPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="journal"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>THAANE STORIES</span>
          <h1>JOURNAL</h1>
          <p>
            Notes on fashion, craft, culture and the stories behind THAANE.
          </p>
        </div>

        <div className="journal-grid">
          {journalEntries.map((entry) => (
            <article className="journal-card" key={entry.number}>
              <div className="journal-card-image">
                <span>THAANE</span>
              </div>

              <div className="journal-card-content">
                <span className="journal-card-number">
                  {entry.number}
                </span>

                <small>{entry.category}</small>

                <h2>{entry.title}</h2>

                <p>{entry.text}</p>

                <button type="button">
                  READ STORY
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
