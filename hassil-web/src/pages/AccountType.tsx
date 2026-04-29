import React from 'react'
import { useNavigate } from 'react-router-dom'
import './AccountType.css'

export default function AccountType() {
    const navigate = useNavigate()

    return (
        <main className="account-select-page">
            <div className="page-heading centered">
                <h1>Choose account type</h1>
                <p>Pick the flow that matches how the invoice will be repaid.</p>
            </div>
            <div className="account-select-cards">
                <button className="account-type-card" onClick={() => navigate('/login/company')}>
                    <div className="account-type-icon blue-soft">SMB</div>
                    <h2>Small Business</h2>
                    <p>Best when the client can confirm and pay Hassil directly.</p>
                    <ul className="account-type-features">
                        <li>Client confirms invoice</li>
                        <li>Client pays Hassil directly</li>
                        <li>Settlement buffer released after payment</li>
                    </ul>
                </button>
                <button className="account-type-card" onClick={() => navigate('/login/freelancer')}>
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
        </main>
    )
}
