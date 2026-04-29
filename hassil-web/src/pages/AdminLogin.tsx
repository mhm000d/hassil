import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './FreelancerLogin.css'

export default function AdminLogin() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        login({ name: 'Hassil', email: email || 'admin@hassil.io', accountType: 'SmallBusiness' })
        navigate('/admin')
    }

    return (
        <main className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h2>Admin Login</h2>
                    <p>Enter your credentials to access the admin dashboard.</p>
                </div>
                
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@hassil.com"
                            required
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
                        />
                    </div>

                    <div className="form-actions" style={{ marginTop: '24px' }}>
                        <button type="submit" className="btn btn-primary full-width">
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
