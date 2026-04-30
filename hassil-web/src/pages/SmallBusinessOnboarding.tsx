import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { createSmallBusinessStarterData } from '../utils/starterData'
import '../styles/FreelancerOnboarding.css'

export default function SmallBusinessOnboarding() {
    const navigate = useNavigate()
    const { onboardSmallBusiness } = useAuth()

    const pending = (() => {
        try { return JSON.parse(sessionStorage.getItem('hassil_pending_reg') ?? '{}') } catch { return {} }
    })()

    const [form, setForm] = useState(() => {
        const defaults = createSmallBusinessStarterData()
        return {
            businessName: pending.businessName ?? pending.name ?? defaults.businessName,
            registrationNumber: pending.registrationNumber ?? defaults.registrationNumber,
            email: pending.email ?? defaults.email,
            phone: pending.phone ?? defaults.phone,
            country: pending.country ?? defaults.country,
            bankName: pending.bankName ?? defaults.bankName,
            bankLast4: pending.bankLast4 ?? defaults.bankLast4,
        }
    })
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.name === 'bankLast4'
            ? e.target.value.replace(/\D/g, '').slice(0, 4)
            : e.target.value

        setError('')
        setForm({ ...form, [e.target.name]: value })
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')

        const bankLast4 = form.bankLast4.trim()
        if (!/^\d{4}$/.test(bankLast4)) {
            setError('Enter the last 4 bank account digits.')
            return
        }

        const email = String(form.email || pending.email || '').trim()
        const businessName = String(form.businessName || pending.name || 'Business').trim()

        setSubmitting(true)

        try {
            await onboardSmallBusiness({
                email,
                businessName,
                registrationNumber: form.registrationNumber.trim(),
                phone: form.phone.trim(),
                country: form.country.trim(),
                businessBankAccountName: form.bankName.trim(),
                businessBankAccountLast4: bankLast4
            })

            sessionStorage.removeItem('hassil_pending_reg')
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Could not complete onboarding.')
        } finally {
            setSubmitting(false)
        }
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
                <div className="onboarding-progress" aria-label="Setup progress">
                    <span className="onboarding-progress__item is-complete">Account</span>
                    <span className="onboarding-progress__item is-active">Profile</span>
                    <span className="onboarding-progress__item">Dashboard</span>
                </div>
                <h1 className="onboarding-card__title">Small Business Onboarding</h1>
                <p className="onboarding-card__subtitle">
                    Starter details are filled in so you can continue quickly. Adjust anything you want.
                </p>
                {error && (
                    <div className="feedback-item error" style={{ marginBottom: 16 }}>{error}</div>
                )}
                <form className="onboarding-form" onSubmit={handleSubmit}>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-businessName">BUSINESS NAME</label>
                            <input id="ob-businessName" name="businessName" type="text" className="onboarding-field__input" placeholder="Cairo Visual Works" value={form.businessName} onChange={handleChange} autoComplete="organization" required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-registrationNumber">REGISTRATION NUMBER</label>
                            <input id="ob-registrationNumber" name="registrationNumber" type="text" className="onboarding-field__input" placeholder="EG-C-204188" value={form.registrationNumber} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-email">EMAIL</label>
                            <input id="ob-email" name="email" type="email" className="onboarding-field__input" placeholder="finance@cairovisual.co" value={form.email} onChange={handleChange} autoComplete="email" required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-phone">PHONE NUMBER</label>
                            <input id="ob-phone" name="phone" type="tel" className="onboarding-field__input" placeholder="+20 100 000 4444" value={form.phone} onChange={handleChange} autoComplete="tel" required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-country">COUNTRY</label>
                            <input id="ob-country" name="country" type="text" className="onboarding-field__input" placeholder="Egypt" value={form.country} onChange={handleChange} autoComplete="country-name" required />
                        </div>
                        <div className="onboarding-field">
                            <label className="onboarding-field__label" htmlFor="ob-bankName">VERIFIED BANK ACCOUNT NAME</label>
                            <input id="ob-bankName" name="bankName" type="text" className="onboarding-field__input" placeholder="Cairo Visual Works LLC" value={form.bankName} onChange={handleChange} autoComplete="organization" required />
                        </div>
                    </div>
                    <div className="onboarding-form__row">
                        <div className="onboarding-field" style={{ flex: '0 0 48%' }}>
                            <label className="onboarding-field__label" htmlFor="ob-bankLast4">BANK ACCOUNT LAST 4 DIGITS</label>
                            <input id="ob-bankLast4" name="bankLast4" type="text" className="onboarding-field__input" placeholder="7781" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} value={form.bankLast4} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="onboarding-form__actions">
                        <button type="button" className="onboarding-btn--secondary" onClick={() => navigate(-1)}>Back</button>
                        <button type="submit" className="onboarding-btn--primary" id="btn-complete-profile" disabled={submitting}>
                            {submitting ? 'Creating Profile...' : 'Complete Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
