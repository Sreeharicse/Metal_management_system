import { useState, useEffect } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    LogOut,
    Award,
    Shield,
    X,
    TrendingUp,
    TrendingDown,
    Settings,
    MoreHorizontal
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import '../AdminDashboard.css'

export default function UserDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [myMetals, setMyMetals] = useState([])
    const [loading, setLoading] = useState(true)

    // Using a simple static chart for the user view "Portfolio" feel
    const mockChartData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    useEffect(() => {
        if (user) fetchMyMetals()
    }, [user])

    const fetchMyMetals = async () => {
        try {
            const { data, error } = await supabase
                .from('user_metal_access')
                .select(`
                    id,
                    assigned_at,
                    metals (
                        id,
                        name,
                        rate,
                        type,
                        change
                    )
                `)
                .eq('user_id', user.id)

            if (error) throw error
            if (data) {
                const formatted = data.map(item => ({
                    ...item.metals,
                    assigned_at: item.assigned_at
                }))
                setMyMetals(formatted)
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => { await logout(); navigate('/login'); }

    return (
        <div className="admin-container">
            {/* Sidebar matching Admin */}
            <nav className="admin-sidebar">
                <div style={{ padding: '20px 0', fontSize: '0.8rem', color: '#666' }}>09:00 AM</div>

                <div className="profile-section">
                    <div className="sidebar-avatar">
                        {user?.email?.[0].toUpperCase()}
                    </div>
                    <div className="profile-name">{user?.email?.split('@')[0]}</div>
                </div>

                <div className="menu-item active">
                    <LayoutDashboard size={20} />
                    <span>My Assets</span>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div className="menu-item" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="admin-main">
                <div className="dashboard-center">

                    <header className="section-header">
                        <h1>My Portfolio</h1>
                        <p>Welcome back</p>
                    </header>

                    {/* Portfolio Summary Card - Reusing Neon Card */}
                    <div className="neon-card" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>Total Asset Value</p>
                            <h2 style={{ fontSize: '3rem', marginBottom: '10px' }}>
                                ${myMetals.reduce((acc, m) => acc + (m.rate || 0), 0).toLocaleString()}
                            </h2>
                            <div className="ticket-price" style={{ display: 'inline-block' }}>
                                +2.4% Today
                            </div>
                        </div>
                        <div style={{ width: '40%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockChartData}>
                                    <defs>
                                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FDBA31" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#FDBA31" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#FDBA31" strokeWidth={3} fillOpacity={1} fill="url(#userGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Ticket Grid - Matching Admin Style */}
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Assigned Metals</h3>
                        <div className="tickets-list">
                            {loading ? <p>Loading...</p> : myMetals.length === 0 ? (
                                <div className="ticket-card" style={{ justifyContent: 'center', color: 'var(--text-muted)', minHeight: '100px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}><Shield size={24} style={{ marginRight: '10px' }} /> No Access Assigned</div>
                                </div>
                            ) : (
                                myMetals.map(metal => (
                                    <div key={metal.id} className="ticket-card" onClick={() => navigate(`/metal/${metal.id}`)}>
                                        <div className="ticket-info">
                                            <div style={{ fontSize: '0.8rem', color: '#A098B5', marginBottom: '4px' }}>Owned Asset</div>
                                            <h3>{metal.name}</h3>
                                            <div style={{ fontSize: '0.85rem', color: '#A098B5', marginBottom: '15px' }}>
                                                {metal.change >= 0 ?
                                                    <span style={{ color: '#00D5A0', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} /> +{metal.change}%</span>
                                                    :
                                                    <span style={{ color: '#FF4757', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={14} /> {metal.change}%</span>
                                                }
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto' }}>
                                            <div className="ticket-price">${metal.rate?.toLocaleString()}</div>
                                            {/* Hidden button for consistent spacing if needed, or just remove */}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <aside className="right-panel">
                    <div className="right-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <h3>Account</h3>
                            <Settings color="#A098B5" size={20} />
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div className="sidebar-avatar" style={{ width: '80px', height: '80px', margin: '0 auto 15px auto', fontSize: '2rem' }}>
                                {user?.email?.[0].toUpperCase()}
                            </div>
                            <h3>{user?.email?.split('@')[0]}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="user-row">
                                <span>Status</span>
                                <span className="permission-pill" style={{ color: '#00D5A0', borderColor: '#00D5A0' }}>Active</span>
                            </div>
                            <div className="user-row">
                                <span>Member Since</span>
                                <span style={{ color: 'var(--text-muted)' }}>2024</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
                            <div style={{ background: '#150B25', padding: '20px', borderRadius: '20px' }}>
                                <h4 style={{ marginBottom: '10px' }}>Need Help?</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>Contact your administrator to request access to more metals.</p>
                                <button style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer' }}>Contact Support</button>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    )
}
