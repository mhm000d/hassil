import { useNavigate } from 'react-router-dom'
import { createStarterData } from '../utils/starterData'
import '../styles/AccountType.css'

export default function AccountType() {
    const navigate = useNavigate()

    const startOnboarding = (accountType: 'SmallBusiness' | 'Freelancer') => {
        sessionStorage.setItem('hassil_pending_reg', JSON.stringify(createStarterData(accountType)))
        navigate(accountType === 'Freelancer' ? '/onboarding/freelancer' : '/onboarding/small-business')
    }

    return (
        <main className="account-select-page">
            <div className="page-heading centered">
                <h1>Choose how you usually get paid</h1>
                <p>Hassil turn finished work into cash easer than before</p>
            </div>
            <div className="account-select-cards">
                <button className="account-type-card" onClick={() => startOnboarding('SmallBusiness')}>
                    <div className="account-type-icon blue-soft">SMB</div>
                    <h2>Small Business</h2>
                    <p>For teams using client invoices to cover payroll, suppliers, and operating costs.</p>
                    <ul className="account-type-features">
                        <li>Your client confirms the finished work</li>
                        <li>You receive cash before the invoice due date</li>
                        <li>The rest is settled after payment arrives</li>
                    </ul>
                    <span className="account-type-action">Continue as small business</span>
                </button>
                <button className="account-type-card" onClick={() => startOnboarding('Freelancer')}>
                    <div className="account-type-icon gold-soft">FR</div>
                    <h2>Freelancer</h2>
                    <p>For independent workers waiting on client transfers, platform payouts, or escrow.</p>
                    <ul className="account-type-features">
                        <li>Your client relationship stays private</li>
                        <li>You receive cash while waiting for payout</li>
                        <li>You settle after your payment arrives</li>
                    </ul>
                    <span className="account-type-action">Continue as freelancer</span>
                </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <a href="/" className="login-card__back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gray)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    Back to Home
                </a>
            </div>
        </main>
    )
}
