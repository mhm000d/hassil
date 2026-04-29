import './WhyHassil.css'
import type { ReactNode } from 'react'

interface Feature {
    title: string
    description: string
    icon: ReactNode
}

const features: Feature[] = [
    {
        title: 'No Interest, Just Fees',
        description: 'We operate on a transparent, flat-fee model. Ethical financing that respects regional financial values and provides predictability.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    {
        title: 'Arab Market Focused',
        description: 'Built from the ground up for the MENA region. We understand the specific payment cycles and legal frameworks of regional markets.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
        ),
    },
    {
        title: 'Institutional Security',
        description: 'Your data and transactions are protected by bank-grade encryption and regional regulatory compliance standards.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
    },
]

export default function WhyHassil() {
    return (
        <section className="why-hassil" id="why-hassil">
            <div className="container why-hassil__inner">
                <div className="why-hassil__image-wrapper">
                    <div className="why-hassil__image-overlay" />
                    <div className="why-hassil__image-glow" />
                </div>
                <div className="why-hassil__content">
                    <h2 className="why-hassil__title">Why Hassil?</h2>
                    <div className="why-hassil__features">
                        {features.map((feature) => (
                            <div className="why-hassil__feature" key={feature.title}>
                                <div className="why-hassil__feature-icon">{feature.icon}</div>
                                <div className="why-hassil__feature-text">
                                    <h4 className="why-hassil__feature-title">{feature.title}</h4>
                                    <p className="why-hassil__feature-desc">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
