import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { saveRequesterSession } from '../services'
import '../styles/Login.css'

export default function AdminLogin() {
    const navigate = useNavigate()
    const { login, user } = useAuth()
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const enterAdminWorkspace = async () => {
        setError('')
        setSubmitting(true)

        try {
            saveRequesterSession(user)
            await login({ persona: 'admin' })
            navigate('/admin')
        } catch (err: any) {
            setError(err.message || 'Admin access failed.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="login-page">
            <div className="login-card">
                <div className="login-card__logo">
                    <div className="login-card__logo-icon">H</div>
                    <span className="login-card__logo-text">
                        Hass<span className="login-card__logo-accent">il</span>
                    </span>
                </div>
                <h1 className="login-card__title">Admin Review</h1>
                <p className="login-card__subtitle">
                    Enter the reviewer workspace for manual advance decisions and risk checks.
                </p>

                {error && (
                    <div className="feedback-item error" style={{ marginBottom: 16 }}>{error}</div>
                )}

                <button
                    type="button"
                    className="login-card__submit"
                    onClick={enterAdminWorkspace}
                    disabled={submitting}
                >
                    {submitting ? 'Opening Review Queue...' : 'Open Review Queue'}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>

                <div className="login-card__footer">
                    <a href="/" className="login-card__back-link">
                        Back to Home
                    </a>
                </div>
            </div>
        </main>
    )
}
