import { useNavigate } from 'react-router-dom'
import '../../../styles/Hero.css'

export default function Hero() {
    const navigate = useNavigate()

    return (
        <section className="hero" id="hero">
            <div className="container hero__inner">
                <div className="hero__content">
                    <div className="hero__badge">
                        THE WORK IS DONE. THE MONEY ISN'T THERE.
                    </div>
                    <h1 className="hero__title">
                        Get paid when the work is done.
                    </h1>
                    <p className="hero__description">
                        You delivered the work. The invoice is real. The payment is just late.
                        Hassil helps freelancers and small businesses access part of that earned money
                        now, with a clear fee before you accept.
                    </p>
                    <div className="hero__proof">
                        <span>No long bank process</span>
                        <span>No surprise charges</span>
                        <span>Built for delayed payments</span>
                    </div>
                    <div className="hero__buttons">
                        <button
                            className="hero__btn-primary"
                            id="btn-get-started"
                            onClick={() => navigate('/account-type')}
                        >
                            Get Started
                        </button>
                        <button
                            className="hero__btn-secondary"
                            id="btn-how-it-works"
                            onClick={() => document.getElementById('bridging')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            How it works
                        </button>
                    </div>
                </div>
                <div className="hero__cash-panel" aria-label="Hassil cash flow example">
                    <div className="hero__panel-header">
                        <span>Client invoice</span>
                        <strong>Ready</strong>
                    </div>
                    <div className="hero__amount-block">
                        <span>Money already earned</span>
                        <strong>EGP 120,000</strong>
                    </div>
                    <div className="hero__advance-row">
                        <div>
                            <span>Available sooner</span>
                            <strong>up to 90%</strong>
                        </div>
                        <div>
                            <span>You see first</span>
                            <strong>clear fee</strong>
                        </div>
                    </div>
                    <div className="hero__timeline">
                        <div className="hero__timeline-item is-active">
                            <span />
                            <p>Work delivered</p>
                        </div>
                        <div className="hero__timeline-item is-active">
                            <span />
                            <p>Invoice verified</p>
                        </div>
                        <div className="hero__timeline-item">
                            <span />
                            <p>Cash available</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
