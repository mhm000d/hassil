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
                        Get Paid When the <span className="typewriter">Work Is Done.</span>
                    </h1>
                    <p className="hero__description">
                        Hassil turns confirmed work into usable cash in hours not weeks.
                        No interest, just one flat fee tailored for the MENA market.
                    </p>
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
                <div className="hero__image">
                    <img src="/hero-image.png" alt="Financing for MENA businesses" />
                </div>
            </div>
        </section>
    )
}
