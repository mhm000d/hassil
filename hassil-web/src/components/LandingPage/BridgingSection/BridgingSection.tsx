import '../../../styles/BridgingSection.css'

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
)

const SMBIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 21V9m11.25-5.636V21" />
    </svg>
)

const FreelancerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
)

export default function BridgingSection() {
    return (
        <section className="bridging" id="bridging">
            <div className="container">
                <div className="bridging__header">
                    <span className="bridging__eyebrow">What is Hassil?</span>
                    <h2 className="bridging__title">A faster way to use money you already earned.</h2>
                    <p className="bridging__subtitle">
                        Hassil sits between finished work and late payment. Instead of waiting weeks
                        for a client or platform payout, you can request an advance against the money
                        that is already expected.
                    </p>
                </div>
                <div className="bridging__problem-grid">
                    <div className="bridging__problem">
                        <h3>The waiting period is expensive</h3>
                        <p>
                            Salaries, rent, suppliers, software, and bills do not wait for invoice
                            terms. Hassil helps cover the gap between delivery and payment.
                        </p>
                    </div>
                    <div className="bridging__problem">
                        <h3>The process stays simple</h3>
                        <p>
                            Add the invoice, review the offer, and accept only if the fee and amount
                            make sense for you. No long bank paperwork.
                        </p>
                    </div>
                </div>
                <div className="bridging__cards">
                    <div className="bridging__card bridging__card--smb">
                        <div className="bridging__card-icon"><SMBIcon /></div>
                        <h3 className="bridging__card-title">For small businesses</h3>
                        <p className="bridging__card-desc">
                            Your client confirms the work, Hassil sends the advance, and the remaining
                            balance is released after the client pays.
                        </p>
                        <div className="bridging__card-features">
                            <div className="bridging__card-feature"><CheckIcon /><span>Useful for salaries, suppliers, and operating costs</span></div>
                            <div className="bridging__card-feature"><CheckIcon /><span>Client payment can settle directly through Hassil</span></div>
                            <div className="bridging__card-feature"><CheckIcon /><span>You see the fee before accepting</span></div>
                        </div>
                    </div>
                    <div className="bridging__card bridging__card--freelancer">
                        <div className="bridging__card-icon"><FreelancerIcon /></div>
                        <h3 className="bridging__card-title">For Freelancers</h3>
                        <p className="bridging__card-desc">
                            Upload the invoice, get reviewed, and receive cash sooner while your client
                            or platform payment continues normally.
                        </p>
                        <div className="bridging__card-features">
                            <div className="bridging__card-feature"><CheckIcon /><span>Client relationship stays private</span></div>
                            <div className="bridging__card-feature"><CheckIcon /><span>Repay after your payment arrives</span></div>
                            <div className="bridging__card-feature"><CheckIcon /><span>Good repayment history improves future offers</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
