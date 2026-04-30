import '../../../styles/WhyHassil.css'
import type { ReactNode } from 'react'

interface Feature {
    title: string
    description: string
    icon: ReactNode
}

const features: Feature[] = [
    {
        title: 'Clear before you commit',
        description: 'You see the advance amount and fee upfront, then decide if it works for your cash flow.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    {
        title: 'Made for real payment delays',
        description: 'Built for invoices, platform holds, client approval cycles, and the day-to-day costs that arrive before payment does.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818 3 3 3-3M9 8.818l3-3 3 3M4.5 19.5h15A2.25 2.25 0 0 0 21.75 17.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
        ),
    },
    {
        title: 'Works for how you get paid',
        description: 'Small businesses can use client-confirmed invoices. Freelancers can keep the client relationship private.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
            </svg>
        ),
    },
    {
        title: 'Your history helps you',
        description: 'Successful repayments can improve future limits, speed up review, and unlock better offers over time.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125C16.5 3.504 17.004 3 17.625 3h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
    },
]

export default function WhyHassil() {
    return (
        <section className="why-hassil" id="why-hassil">
            <div className="container why-hassil__inner">
                <div className="why-hassil__image-wrapper">
                    <div className="why-hassil__metric">
                        <span>Step 1</span>
                        <strong>Share the invoice</strong>
                        <small>Add the amount, client, due date, and basic details.</small>
                    </div>
                    <div className="why-hassil__metric">
                        <span>Step 2</span>
                        <strong>Review the offer</strong>
                        <small>Know how much you can receive and what the fee is.</small>
                    </div>
                    <div className="why-hassil__metric why-hassil__metric--wide">
                        <span>Step 3</span>
                        <strong>Receive cash sooner and settle after payment arrives</strong>
                    </div>
                </div>
                <div className="why-hassil__content">
                    <h2 className="why-hassil__title">Hassil keeps the process easy to understand.</h2>
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
