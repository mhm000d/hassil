import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks'
import '../styles/Login.css'

export default function Register() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const accountType = (params.get('type') ?? 'SmallBusiness') as 'Freelancer' | 'SmallBusiness'

    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const isFreelancer = accountType === 'Freelancer'
    const onboardingPath = isFreelancer ? '/onboarding/freelancer' : '/onboarding/SmallBusiness'

    const { signup } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (form.password !== form.confirm) {
            setError('Passwords do not match.')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        try {
            await signup({
                email: form.email,
                passwordHash: form.password,
                name: form.name,
                displayName: form.name, // will be updated to company name after onboarding
                accountType,
            })
            // Store pending registration so onboarding can pick it up
            sessionStorage.setItem('hassil_pending_reg', JSON.stringify({ name: form.name, email: form.email, accountType }))
            navigate(onboardingPath)
        } catch (err: any) {
            setError(err.message || 'Registration failed.')
        }
    }

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-bg__circle login-bg__circle--1" />
                <div className="login-bg__circle login-bg__circle--2" />
                <div className="login-bg__circle login-bg__circle--3" />
            </div>
            <div className="login-card">
                <div className="login-card__logo">
                    <div className="login-card__logo-icon">H</div>
                    <span className="login-card__logo-text">
                        Hass<span className="login-card__logo-accent">il</span>
                    </span>
                </div>
                <h1 className="login-card__title">Create your account</h1>
                <p className="login-card__subtitle">
                    {isFreelancer ? 'Freelancer account' : 'Small Business account'} —{' '}
                    {isFreelancer ? 'fill in your login details.' : 'enter the contact person details for your company.'}
                </p>

                {error && (
                    <div className="feedback-item error" style={{ marginBottom: 16 }}>{error}</div>
                )}

                <form className="login-card__form" onSubmit={handleSubmit}>
                    {/* Full name */}
                    <div className="login-field">
                        <label className="login-field__label" htmlFor="reg-name">FULL NAME</label>
                        <div className="login-field__input-wrap">
                            <svg className="login-field__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                            <input id="reg-name" type="text" className="login-field__input" placeholder={isFreelancer ? 'Mona Ahmed' : 'Ahmed Al-Rashid (contact person)'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="login-field">
                        <label className="login-field__label" htmlFor="reg-email">EMAIL ADDRESS</label>
                        <div className="login-field__input-wrap">
                            <svg className="login-field__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            <input id="reg-email" type="email" className="login-field__input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="login-field">
                        <label className="login-field__label" htmlFor="reg-password">PASSWORD</label>
                        <div className="login-field__input-wrap">
                            <svg className="login-field__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <input id="reg-password" type={showPassword ? 'text' : 'password'} className="login-field__input" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                            <button type="button" className="login-field__toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Confirm password */}
                    <div className="login-field">
                        <label className="login-field__label" htmlFor="reg-confirm">CONFIRM PASSWORD</label>
                        <div className="login-field__input-wrap">
                            <svg className="login-field__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <input id="reg-confirm" type={showPassword ? 'text' : 'password'} className="login-field__input" placeholder="Repeat password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
                        </div>
                    </div>

                    <button type="submit" className="login-card__submit">
                        Continue to Profile Setup
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                </form>

                <div className="login-card__footer">
                    <a href="/" className="login-card__back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Back to Home
                    </a>
                    <span className="login-card__footer-sep">·</span>
                    <a href="/login" className="login-card__back-link">Already have an account? Sign in</a>
                </div>
            </div>
        </div>
    )
}
