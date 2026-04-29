import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/FreelancerOnboarding.css'

export default function FreelancerOnboarding() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const pending = (() => {
        try { return JSON.parse(sessionStorage.getItem('hassil_pending_reg') ?? '{}') } catch { return {} }
    })()

    const [form, setForm] = useState({
        fullName: pending.name ?? '',
        email: pending.email ?? '',
        phone: '',
        country: '',
        bankName: '',
        bankLast4: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        login({ name: form.fullName || pending.name || 'Freelancer', displayName: form.fullName || pending.name || 'Freelancer', email: form.email || pending.email, accountType: 'Freelancer' })
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
                <h1 className="onboarding-card__title">Freelancer Onboarding</h1>
                <p className="onboarding-card__subtitle">
                    Enter the basic profile and bank details needed to request advances.
                </p>
                <form className="onboarding-form" onSubmit={handleSubmit}>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-fullName">FULL NAME</label>
                            <input id="ob-fullName" name="fullName" type="text" className="onboarding-field__input" placeholder="Mona UX Studio" value={form.fullName} onChange={handleChange} required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-email">EMAIL</label>
                            <input id="ob-email" name="email" type="email" className="onboarding-field__input" placeholder="mona.ux@example.com" value={form.email} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-phone">PHONE NUMBER</label>
                            <input id="ob-phone" name="phone" type="tel" className="onboarding-field__input" placeholder="+20 100 000 4444" value={form.phone} onChange={handleChange} required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-country">COUNTRY</label>
                            <input id="ob-country" name="country" type="text" className="onboarding-field__input" placeholder="Egypt" value={form.country} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-bankName">VERIFIED BANK ACCOUNT NAME</label>
                            <input id="ob-bankName" name="bankName" type="text" className="onboarding-field__input" placeholder="Mona Ahmed" value={form.bankName} onChange={handleChange} required />
                        </div>
                        <div className="onboarding-field">
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
