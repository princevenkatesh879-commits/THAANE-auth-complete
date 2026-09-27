import { Mail, MapPin } from 'lucide-react'
import CollectionHeader from './CollectionHeader'

type ContactPageProps = {
  onNavigate: (page: string) => void
}

export default function ContactPage({
  onNavigate,
}: ContactPageProps) {
  return (
    <main className="collections-page">
      <CollectionHeader
        currentPage="contact"
        onNavigate={onNavigate}
      />

      <section className="collections-content">
        <div className="collections-intro">
          <span>WE WOULD LOVE TO HEAR FROM YOU</span>
          <h1>CONTACT</h1>
          <p>
            Questions about an order, our collections or THAANE?
            We&apos;re here to help.
          </p>
        </div>

        <div className="contact-layout">
          <div className="contact-details">
            <div className="contact-detail">
              <Mail size={20} strokeWidth={1.2} />
              <div>
                <span>EMAIL</span>
                <strong>hello@thaane.com</strong>
              </div>
            </div>

            <div className="contact-detail">
              <MapPin size={20} strokeWidth={1.2} />
              <div>
                <span>THAANE HOUSE</span>
                <strong>India</strong>
              </div>
            </div>
          </div>

          <form
            className="contact-form"
            onSubmit={(event) => {
              event.preventDefault()
              window.alert(
                'Thank you for contacting THAANE. We will be in touch soon.',
              )
            }}
          >
            <label>
              NAME
              <input
                type="text"
                placeholder="Your name"
                required
              />
            </label>

            <label>
              EMAIL
              <input
                type="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              MESSAGE
              <textarea
                rows={7}
                placeholder="How can we help?"
                required
              />
            </label>

            <button type="submit">
              SEND MESSAGE
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
