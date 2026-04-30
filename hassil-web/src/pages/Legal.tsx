import Navbar from '../components/Navbar/Navbar'
import Footer from '../components/Footer/Footer'
import '../styles/InfoPage.css'

const sections = [
    {
        title: 'Terms of use',
        text: 'By using Hassil, users agree to provide accurate business, invoice, bank, and repayment information.'
    },
    {
        title: 'Privacy notice',
        text: 'Hassil uses account, invoice, client, transaction, and trust-score data to review requests and operate the product.'
    },
    {
        title: 'User responsibility',
        text: 'Users are responsible for submitting real invoices and keeping repayment information accurate and up to date.'
    },
    {
        title: 'Review and rejection',
        text: 'Hassil can reject invoices that appear duplicate, disputed, incomplete, unverifiable, or inconsistent with expected activity.'
    },
    {
        title: 'Client communication',
        text: 'Some small-business flows may ask the client to confirm delivered work before an advance is approved.'
    },
    {
        title: 'Updates',
        text: 'Legal and product terms may evolve as Hassil adds production payment, verification, and support workflows.'
    }
]

export default function Legal() {
    return (
        <>
            <Navbar />
            <main className="info-page">
                <section className="info-hero">
                    <span className="info-eyebrow">Legal</span>
                    <h1>Plain-language terms for using Hassil responsibly.</h1>
                    <p>
                        This page summarizes the operating expectations behind Hassil.
                        Full production terms should be reviewed before launch.
                    </p>
                </section>

                <section className="info-list">
                    {sections.map((section) => (
                        <article className="info-row" key={section.title}>
                            <h2>{section.title}</h2>
                            <p>{section.text}</p>
                        </article>
                    ))}
                </section>
            </main>
            <Footer />
        </>
    )
}
