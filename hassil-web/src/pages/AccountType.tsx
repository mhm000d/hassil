import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AccountType.css'

export default function AccountType() {
    const navigate = useNavigate()

    return (
        <main className="account-select-page">
            <div className="page-heading centered">
                <h1>Choose account type</h1>
                <p>Pick the flow that matches how the invoice will be repaid.</p>
            </div>
            <div className="account-select-cards">
                <button className="account-type-card" onClick={() => navigate('/register?type=SmallBusiness')}>
                    <div className="account-type-icon blue-soft">SMB</div>
                    <h2>Small Business</h2>
                    <p>Best when the client can confirm and pay Hassil directly.</p>
                    <ul className="account-type-features">
                        <li>Client confirms invoice</li>
                        <li>Client pays Hassil directly</li>
                        <li>Settlement buffer released after payment</li>
                    </ul>
                </button>
                <button className="account-type-card" onClick={() => navigate('/register?type=Freelancer')}>
                    <div className="account-type-icon gold-soft">FR</div>
                    <h2>Freelancer</h2>
                    <p>Best when the client or platform pays you first.</p>
                    <ul className="account-type-features">
                        <li>No client notification</li>
                        <li>Client pays freelancer normally</li>
                        <li>Freelancer repays after payment detection</li>
                    </ul>
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
