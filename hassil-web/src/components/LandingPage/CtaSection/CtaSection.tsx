import { useNavigate } from 'react-router-dom'
import '../../../styles/CtaSection.css'

export default function CtaSection() {
    const navigate = useNavigate()

    return (
        <section className="cta" id="cta">
            <div className="container">
                <div className="cta__inner">
                    <h2 className="cta__title">Ready to bridge your cash flow gap?</h2>
                    <p className="cta__subtitle">
                        Join thousands of businesses and freelancers in the MENA region who get paid on their own terms.
                    </p>
                    <div className="cta__buttons">
                        <button className="cta__btn-primary" id="btn-cta-start" onClick={() => navigate('/account-type')}>Get Started Now</button>
                        <button className="cta__btn-secondary" id="btn-cta-sales">Contact Sales</button>
                    </div>
                </div>
            </div>
        </section>
    )
}
