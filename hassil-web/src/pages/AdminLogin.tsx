import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import '../styles/Login.css'

export default function AdminLogin() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState('admin@hassil.io')
    const [password, setPassword] = useState('1')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            await login({ email, password })
            navigate('/admin')
        } catch (err: any) {
            setError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h2>Admin Login</h2>
                    <p>Enter your credentials to access the admin dashboard.</p>
                </div>
                
                <form className="login-form" onSubmit={handleSubmit}>
                    {error && <div className="feedback-item error mb-18">{error}</div>}
                    
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@hassil.io"
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-actions" style={{ marginTop: '24px' }}>
                        <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gray)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                            ← Back to Home
                        </a>
                    </div>
                </form>
            </div>
        </main>
    )
}
