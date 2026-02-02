import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Hexagon, Gift, TreePine } from 'lucide-react'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const { login, user, role, loading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && role) {
            if (role === 'admin') navigate('/admin', { replace: true })
            else navigate('/user', { replace: true })
        }
    }, [user, role, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setError('')
            await login(email, password)
        } catch (err) {
            setError('Failed to log in: ' + err.message)
        }
    }

    return (
        <div className="login-container">
            {/* LEFT SIDE: ILLUSTRATION */}
            <div className="login-left">
                {/* Brand Logo */}
                <div className="brand-logo">
                    <Hexagon size={32} fill="#1B3B2F" stroke="none" />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                        <span>METAL</span>
                        <span>SYSTEMS</span>
                    </div>
                </div>

                {/* Main Illustration Area */}
                <div className="illustration-wrapper">
                    {/* Abstract Representation of the Tree Scene */}
                    <div style={{
                        position: 'relative',
                        width: '300px',
                        height: '300px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#E6F4F1', /* Light mint circle */
                        borderRadius: '50%',
                    }}>
                        {/* Tree Icon */}
                        <TreePine size={180} color="#2F855A" strokeWidth={1.5} absoluteStrokeWidth />

                        {/* Decorative Elements */}
                        <div style={{ position: 'absolute', bottom: '20px', left: '30px' }}>
                            <Gift size={40} color="#E53E3E" fill="#FED7D7" />
                        </div>
                        <div style={{ position: 'absolute', top: '40px', right: '40px', opacity: 0.5 }}>
                            <div style={{ width: '20px', height: '20px', background: '#B2F5EA', borderRadius: '50%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <div className="login-right">
                <div className="login-form-box">
                    <span className="brand-title">Metal Systems</span>
                    <h2>Welcome Back</h2>

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Username (Email)</label>
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
                                placeholder="Enter your password"
                            />
                            <a href="#" className="forgot-link">Forgot Password?</a>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login to System'}
                        </button>
                    </form>

                    <div className="register-text">
                        Don't have an account?
                        <Link to="/register" className="register-link">Register Now</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
