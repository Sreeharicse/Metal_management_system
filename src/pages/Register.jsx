import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [msg, setMsg] = useState('')
    const { signup, user, role, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && role) {
            if (role === 'admin') navigate('/admin', { replace: true })
            else navigate('/user', { replace: true })
        }
    }, [user, role, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            return setError("Passwords do not match")
        }
        try {
            setError('')
            setMsg('')
            // Aggressive sanitization: remove ALL whitespace (including invisible chars) and lowercase
            const cleanEmail = email.replace(/\s+/g, '').trim().toLowerCase()

            await signup(cleanEmail, password)
            setMsg('Success! Redirecting...')
            // Auto login or redirect
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            console.error(err)
            setError('Failed to register: ' + err.message)
        }
    }

    return (
        <div className="login-container">
            {/* Same structure as Login for consistent UI */}
            <div className="login-right">
                <div className="login-form-box">
                    <span className="brand-title">Metal Systems</span>
                    <h2>Create Account</h2>

                    {error && <div className="error-msg">{error}</div>}
                    {msg && <div className="error-msg" style={{ background: 'rgba(0, 213, 160, 0.1)', color: '#00D5A0', borderColor: '#00D5A0' }}>{msg}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="custom-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="custom-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Create a password"
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                className="custom-input"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Confirm your password"
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Creating...' : 'Register Now'}
                        </button>
                    </form>

                    <div className="register-text">
                        Already have an account?
                        <Link to="/login" className="register-link">Login Here</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
