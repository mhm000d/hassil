import { useNavigate } from 'react-router-dom'
import '../../../styles/CtaSection.css'

export default function CtaSection() {
    const navigate = useNavigate()

    return (
        <section className="cta" id="cta">
            <div className="container">
                <div className="business-model">
                    <div>
                        <span className="business-model__eyebrow">How Hassil helps</span>
                        <h2>Pick the path that matches how you get paid.</h2>
                        <p>
                            Whether you run a small business or work independently, Hassil gives you a
                            clear way to turn finished work into cash you can use sooner.
                        </p>
                    </div>
                    <div className="business-model__grid">
                        <div className="business-model__card">
                            <h3>Small business</h3>
                            <p>Use confirmed invoices to keep payroll, suppliers, and operations moving.</p>
                            <strong>Client confirms the work</strong>
                            <span>Hassil advances part of the invoice.</span>
                        </div>
                        <div className="business-model__card">
                            <h3>Freelancer</h3>
                            <p>Access cash sooner while the client or platform payment continues normally.</p>
                            <strong>Your client stays private</strong>
                            <span>You repay after the payment arrives.</span>
                        </div>
                    </div>
                </div>
                <div className="cta__inner">
                    <h2 className="cta__title">Start with the flow that feels closest to your work.</h2>
                    <p className="cta__subtitle">
                        See how Hassil can help turn finished work into money you can use sooner.
                    </p>
                    <div className="cta__buttons">
                        <button className="cta__btn-primary" id="btn-cta-start" onClick={() => navigate('/account-type')}>Get Started</button>
                        <button className="cta__btn-secondary" id="btn-cta-how" onClick={() => document.getElementById('bridging')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
                    </div>
                </div>
            </div>
        </section>
    )
}
