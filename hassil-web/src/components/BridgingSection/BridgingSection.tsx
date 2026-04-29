import { Link } from 'react-router-dom'
import './BridgingSection.css'

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
)

const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
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
                    <h2 className="bridging__title">Bridging the Gap</h2>
                    <p className="bridging__subtitle">
                        Seamless financing solutions built for the modern workforce of the Middle East.
                    </p>
                </div>
                <div className="bridging__cards">
                    <div className="bridging__card bridging__card--smb">
                        <div className="bridging__card-icon"><SMBIcon /></div>
                        <h3 className="bridging__card-title">For SMBs</h3>
                        <p className="bridging__card-desc">
                            Unlock accounts receivable instantly. Stop waiting 60-90 days for client payments.
                        </p>
                        <div className="bridging__card-features">
                            <div className="bridging__card-feature"><CheckIcon /><span>Instant liquidity for confirmed invoices</span></div>
                            <div className="bridging__card-feature"><CheckIcon /><span>Flat transaction fees</span></div>
                        </div>
                        <Link to="/login/company" className="bridging__card-link">Learn More <ArrowIcon /></Link>
                    </div>
                    <div className="bridging__card bridging__card--freelancer">
                        <div className="bridging__card-icon"><FreelancerIcon /></div>
                        <h3 className="bridging__card-title">For Freelancers</h3>
                        <p className="bridging__card-desc">
                            Work delivered? Money received. Bridging the gap between project completion and bank deposits.
                        </p>
                        <Link to="/login/freelancer" className="bridging__card-link">Learn More <ArrowIcon /></Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
