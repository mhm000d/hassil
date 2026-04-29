import { useNavigate } from 'react-router-dom'
import './Hero.css'

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
                        Get Paid When the <span>Work Is Done.</span>
                    </h1>
                    <p className="hero__description">
                        Hassil turns confirmed work into usable cash in hours not weeks.
                        No interest, just one flat fee tailored for the MENA market.
                    </p>
                    <div className="hero__buttons">
                        <button
                            className="hero__btn-primary"
                            id="btn-get-started"
                            onClick={() => navigate('/dashboard')}
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
                <div className="hero__stats">
                    <div className="hero__stat-card hero__stat-card--light">
                        <div className="hero__stat-number">63%</div>
                        <div className="hero__stat-label">of MENA MSMEs lack access to finance</div>
                    </div>
                    <div className="hero__stat-card hero__stat-card--dark">
                        <div className="hero__stat-number">$210–240B</div>
                        <div className="hero__stat-label">MSME financing gap in MENA</div>
                    </div>
                </div>
            </div>
        </section>
    )
}
