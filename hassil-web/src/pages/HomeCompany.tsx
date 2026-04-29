export default function HomeCompany() {
    return (
        <div className="home-page">
            <section className="home-hero">
                <div className="hero-copy">
                    <p className="eyebrow">Welcome to Hassil for Companies</p>
                    <h1>Supercharge your business cash flow</h1>
                    <p>
                        Manage your company's finances, approve advances, and monitor liquidity in real-time. Everything you need to scale up your business.
                    </p>
                    <div className="hero-actions">
                        <button type="button">Go to Dashboard</button>
                        <a href="#company-reports">View Reports</a>
                    </div>
                </div>
                <div className="hero-image">
                    <img src="/assets/hero-section.png" alt="Company dashboard preview" />
                </div>
            </section>

            <section className="home-section home-why" id="why-hassil">
                <div className="section-copy">
                    <h2>Why Hassil for Companies?</h2>
                    <p>
                        Build better financial confidence with clear visibility into invoices, advances,
                        transactions, and balance planning.
                    </p>
                </div>
                <img src="/assets/why-hassil-section.png" alt="Why Hassil" />
            </section>

            <section className="home-section home-bridge">
                <img src="/assets/bridging-the-gap-section.png" alt="Bridge the gap" />
                <div className="section-copy">
                    <h2>Bridge the gap between cash and growth</h2>
                    <p>
                        See overdue receivables, monitor advances, and keep your cash cycle aligned with your
                        business goals.
                    </p>
                </div>
            </section>

            <section className="home-section home-cta">
                <div className="cta-copy">
                    <h2>One place for every financial movement</h2>
                    <p>
                        Hassil combines operational review with planning tools so you can move from manual
                        tracking to a modern cash-flow rhythm.
                    </p>
                    <button type="button">Explore features</button>
                </div>
                <img src="/assets/cta-section.png" alt="Call to action" />
            </section>

            <footer className="home-footer">
                <div className="footer-copy">
                    <h3>Ready to see your cash flow clearly?</h3>
                    <p>Start with Hassil and bring your invoices, advances, and transactions into one place.</p>
                </div>
                <img src="/assets/footer-section.png" alt="Footer illustration" />
            </footer>
        </div>
    )
}
