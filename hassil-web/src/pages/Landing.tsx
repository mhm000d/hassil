import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

export default function Landing() {
    const navigate = useNavigate()

    return (
        <main className="landing">
            <div className="landing-mesh" />
            <div className="landing-grid" />

            <nav className="landing-nav">
                <Logo onClick={() => navigate('/')} />
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    <Icon name="open" /> Open App
                </button>
            </nav>

            <section className="landing-hero">
                <div className="landing-tag">Receivables finance for SMEs and freelancers</div>
                <h1>Turn approved work into predictable cash flow.</h1>
                <p>
                    Hassil gives teams one place to verify invoices, request advances, confirm clients,
                    and track settlement without hidden fees.
                </p>
                <div className="landing-cta">
                    <button className="btn btn-primary btn-xl" onClick={() => navigate('/dashboard')}>
                        <Icon name="open" /> Open Workspace
                    </button>
                    <button className="btn btn-secondary btn-xl" onClick={() => navigate('/dashboard')}>
                        <Icon name="plus" /> Create Profile
                    </button>
                </div>
                <div className="landing-proof-row">
                    <span>Flat fee shown upfront</span>
                    <span>Client confirmation when needed</span>
                    <span>Ledger-backed settlement trail</span>
                </div>
            </section>

            <section className="landing-product">
                <div className="product-preview" aria-label="Hassil workspace preview">
                    <div className="preview-topbar">
                        <div>
                            <span>Ahmed Studio</span>
                            <strong>Invoice Factoring</strong>
                        </div>
                        <div className="preview-score">Trust 60 · Good</div>
                    </div>
                    <div className="preview-metrics">
                        <div><span>Open receivables</span><strong>$30,400</strong></div>
                        <div><span>Available now</span><strong>$27,360</strong></div>
                        <div><span>Fixed fees</span><strong>$608</strong></div>
                    </div>
                    <div className="preview-table">
                        <div><span>AHM-2026-019</span><strong>Awaiting client</strong><em>$12,400</em></div>
                        <div><span>AHM-2026-018</span><strong>Ready to request</strong><em>$18,000</em></div>
                        <div><span>AHM-2026-016</span><strong>Disputed</strong><em>$7,600</em></div>
                    </div>
                </div>
                <div className="landing-workflow">
                    <div>
                        <span>01</span>
                        <strong>Verify receivable</strong>
                        <p>Invoice details, evidence, duplicate checks, and eligibility rules.</p>
                    </div>
                    <div>
                        <span>02</span>
                        <strong>Choose the right model</strong>
                        <p>Factoring for confirmed client payment, discounting for private freelancer advances.</p>
                    </div>
                    <div>
                        <span>03</span>
                        <strong>Track money movement</strong>
                        <p>Funding, repayment, fee collection, buffer release, and trust-score changes.</p>
                    </div>
                </div>
            </section>

            <section className="landing-models">
                <div className="model-card factoring">
                    <div className="model-card-icon blue-soft">SMB</div>
                    <h3>Factoring for businesses</h3>
                    <p>
                        Client confirms the invoice, pays Hassil on the due date, and the remaining
                        balance is released after settlement.
                    </p>
                    <div className="model-metrics">
                        <div>
                            <div className="model-metric-val">80–95%</div>
                            <div className="model-metric-label">Advance range</div>
                        </div>
                        <div>
                            <div className="model-metric-val">0.8–3.5%</div>
                            <div className="model-metric-label">Flat fee</div>
                        </div>
                    </div>
                </div>
                <div className="model-card discounting">
                    <div className="model-card-icon gold-soft">FR</div>
                    <h3>Discounting for freelancers</h3>
                    <p>
                        The client relationship stays unchanged. Hassil advances cash, then the
                        freelancer repays after receiving payment.
                    </p>
                    <div className="model-metrics">
                        <div>
                            <div className="model-metric-val">70–90%</div>
                            <div className="model-metric-label">Advance range</div>
                        </div>
                        <div>
                            <div className="model-metric-val">1.5–5%</div>
                            <div className="model-metric-label">Flat fee</div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
