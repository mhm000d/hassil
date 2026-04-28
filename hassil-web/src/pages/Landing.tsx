export default function Landing() {
    return (
        <div className="page-page">
            <section className="hero-section">
                <div className="hero-copy">
                    <p className="eyebrow">Welcome to Hassil</p>
                    <h2>Invoice finance and cash flow for freelancers and small businesses</h2>
                    <p>
                        Start with a clean landing page, choose your account type, and move into the demo workflow.
                    </p>
                </div>
                <div className="hero-visual">
                    <img src="/assets/hero-section.png" alt="Hassil landing" />
                </div>
            </section>
            <section className="feature-grid">
                <article>
                    <h3>Fast invoice advances</h3>
                    <p>Get a quote, submit an advance request, and track every step in one place.</p>
                </article>
                <article>
                    <h3>Trusted financing flows</h3>
                    <p>Invoice factoring and discounting paths designed for work, not debt.</p>
                </article>
                <article>
                    <h3>Simulated cash movements</h3>
                    <p>Review ledgers, payments, buffer release, and trust score updates in the demo.</p>
                </article>
            </section>
        </div>
    )
}
