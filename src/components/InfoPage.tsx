import { ArrowLeft } from 'lucide-react'

type InfoPageProps = {
  title: string
  eyebrow: string
  intro: string
  sections: {
    heading: string
    body: string
  }[]
  onNavigate: (page: string) => void
}

export default function InfoPage({
  title,
  eyebrow,
  intro,
  sections,
  onNavigate,
}: InfoPageProps) {
  return (
    <main className="info-page">
      <section className="info-page-hero">
        <button
          type="button"
          className="info-page-back"
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft size={15} strokeWidth={1.2} />
          BACK TO HOME
        </button>

        <p className="info-page-eyebrow">{eyebrow}</p>

        <h1>{title}</h1>

        <p className="info-page-intro">{intro}</p>
      </section>

      <section className="info-page-content">
        {sections.map((section) => (
          <article className="info-page-section" key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
