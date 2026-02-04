import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Hexagon, Gift, TreePine } from 'lucide-react'
import './Login.css'
import logo from '../assets/techxl-logo.png'

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
            console.log('Attempting login for:', email)
            const data = await login(email, password)
            console.log('Login successful:', data)
        } catch (err) {
            console.error('Login error:', err)
            if (err.message.includes('Email not confirmed')) {
                setError('Login failed: Please check your email and confirm your account first.')
            } else if (err.message.includes('Invalid login credentials')) {
                setError('Login failed: Incorrect email or password.')
            } else {
                setError('Failed to log in: ' + err.message)
            }
        }
    }

    return (
        <div className="login-container">
            {/* LEFT SIDE: ILLUSTRATION */}
            <div className="login-left">
                {/* Brand Logo */}
                <div className="brand-logo">
                    <img src={logo} alt="Techxl Logo" style={{ height: '50px', objectFit: 'contain' }} />
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
                    <img src={logo} alt="Techxl Logo" style={{ height: '40px', marginBottom: '30px', objectFit: 'contain' }} />

                    {error && <div className="error-msg">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Username (Email)</label>
                            <input
                                type="email"
                                className="custom-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                name="login_email"
                                autoComplete="off"
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
                                name="login_password"
                                autoComplete="new-password"
                                required
                                placeholder="Enter your password"
                            />
                            <a href="#" className="forgot-link">Forgot Password?</a>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
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
