import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import '../styles/InfoPage.css'

const principles = [
    {
        title: 'Clear offer before acceptance',
        text: 'Users see the available advance amount, fee, and repayment expectation before accepting an offer.'
    },
    {
        title: 'No compounding charges',
        text: 'Hassil is built around a clear fee shown upfront, not open-ended or compounding pricing.'
    },
    {
        title: 'Invoice authenticity matters',
        text: 'Invoices, client details, and supporting documents must reflect real completed work.'
    },
    {
        title: 'Client confirmation where needed',
        text: 'Small-business invoice flows may require client confirmation before an advance is approved.'
    },
    {
        title: 'Trust improves over time',
        text: 'Successful repayments can improve future limits, review speed, and offer quality.'
    },
    {
        title: 'Suspicious activity can be rejected',
        text: 'Hassil may reject duplicate, unverifiable, disputed, or suspicious invoices.'
    }
]

export default function Compliance() {
    return (
        <>
            <Navbar />
            <main className="info-page">
                <section className="info-hero">
                    <span className="info-eyebrow">Compliance</span>
                    <h1>Simple rules for a trusted cash-flow experience.</h1>
                    <p>
                        Hassil is designed to help users access money they have already earned.
                        The process depends on clear invoices, transparent fees, and honest repayment.
                    </p>
                </section>

                <section className="info-grid">
                    {principles.map((item) => (
                        <article className="info-card" key={item.title}>
                            <h2>{item.title}</h2>
                            <p>{item.text}</p>
                        </article>
                    ))}
                </section>
            </main>
            <Footer />
        </>
    )
}
