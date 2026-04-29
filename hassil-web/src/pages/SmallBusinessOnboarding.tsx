import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import '../styles/FreelancerOnboarding.css'

export default function SmallBusinessOnboarding() {
    const navigate = useNavigate()
    const { completeProfile } = useAuth()

    const pending = (() => {
        try { return JSON.parse(sessionStorage.getItem('hassil_pending_reg') ?? '{}') } catch { return {} }
    })()

    const [form, setForm] = useState({
        businessName: '',
        registrationNumber: '',
        email: pending.email ?? '',
        phone: '',
        country: '',
        bankName: '',
        bankLast4: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Display name = contact person from registration, not the business name
        const email = form.email || pending.email
        const companyName = form.businessName || pending.name || 'Business'
        
        if (email) {
            await completeProfile({ email, displayName: companyName })
        }
        
        sessionStorage.removeItem('hassil_pending_reg')
        navigate('/dashboard')
    }

    return (
        <div className="onboarding-page">
            <div className="onboarding-card">
                <div className="onboarding-card__logo">
                    <div className="onboarding-card__logo-icon">H</div>
                    <span className="onboarding-card__logo-text">
                        Hass<span className="onboarding-card__logo-accent">il</span>
                    </span>
                </div>
                <h1 className="onboarding-card__title">Small Business Onboarding</h1>
                <p className="onboarding-card__subtitle">
                    Enter the basic profile and bank details needed to request advances.
                </p>
                <form className="onboarding-form" onSubmit={handleSubmit}>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-businessName">BUSINESS NAME</label>
                            <input id="ob-businessName" name="businessName" type="text" className="onboarding-field__input" placeholder="Cairo Visual Works" value={form.businessName} onChange={handleChange} required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-registrationNumber">REGISTRATION NUMBER</label>
                            <input id="ob-registrationNumber" name="registrationNumber" type="text" className="onboarding-field__input" placeholder="EG-DEMO-2026" value={form.registrationNumber} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-email">EMAIL</label>
                            <input id="ob-email" name="email" type="email" className="onboarding-field__input" placeholder="finance@cairovisual.example" value={form.email} onChange={handleChange} required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-phone">PHONE NUMBER</label>
                            <input id="ob-phone" name="phone" type="tel" className="onboarding-field__input" placeholder="+20 100 000 4444" value={form.phone} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-country">COUNTRY</label>
                            <input id="ob-country" name="country" type="text" className="onboarding-field__input" placeholder="Egypt" value={form.country} onChange={handleChange} required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-bankName">VERIFIED BANK ACCOUNT NAME</label>
                            <input id="ob-bankName" name="bankName" type="text" className="onboarding-field__input" placeholder="Cairo Visual Works LLC" value={form.bankName} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field" style={{ flex: '0 0 48%' }}>
                            <label className="onboarding-field__label" htmlFor="ob-bankLast4">BANK ACCOUNT LAST 4 DIGITS</label>
                            <input id="ob-bankLast4" name="bankLast4" type="text" className="onboarding-field__input" placeholder="7781" maxLength={4} value={form.bankLast4} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__actions">
                        <button type="button" className="onboarding-btn--secondary" onClick={() => navigate(-1)}>Back</button>
                        <button type="submit" className="onboarding-btn--primary" id="btn-complete-profile">Complete Profile</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
