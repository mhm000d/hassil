import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import '../styles/InfoPage.css'

const supportTopics = [
    {
        title: 'Invoice or document issue',
        text: 'Get help if an invoice detail, client email, due date, or uploaded document needs correction.',
        subject: 'Invoice support'
    },
    {
        title: 'Advance or repayment question',
        text: 'Ask about an advance request, repayment step, fee, or expected settlement.',
        subject: 'Advance support'
    },
    {
        title: 'Client confirmation help',
        text: 'Use this if a client did not receive a confirmation link or needs help understanding the request.',
        subject: 'Client confirmation support'
    }
]

function supportHref(subject: string) {
    return `mailto:support@hassil.co?subject=${encodeURIComponent(subject)}`
}

export default function Support() {
    return (
        <>
            <Navbar />
            <main className="info-page">
                <section className="info-hero">
                    <span className="info-eyebrow">Support</span>
                    <h1>Need help with your invoice or advance?</h1>
                    <p>
                        Tell us what is blocked and the Hassil team will help you move the request forward.
                    </p>
                    <a className="info-primary-link" href={supportHref('Hassil support request')}>
                        Email support@hassil.co
                    </a>
                </section>

                <section className="info-grid">
                    {supportTopics.map((topic) => (
                        <article className="info-card" key={topic.title}>
                            <h2>{topic.title}</h2>
                            <p>{topic.text}</p>
                            <a href={supportHref(topic.subject)}>Contact support</a>
                        </article>
                    ))}
                </section>
            </main>
            <Footer />
        </>
    )
}
