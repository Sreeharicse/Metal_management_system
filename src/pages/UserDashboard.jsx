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
    MoreHorizontal,
    ShoppingCart,
    RefreshCw
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import '../AdminDashboard.css'
import logo from '../assets/techxl-logo.png';

export default function UserDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [myMetals, setMyMetals] = useState([])
    const [allMetals, setAllMetals] = useState([])
    const [myRequests, setMyRequests] = useState([])
    const [inventory, setInventory] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState({ text: '', type: '' })
    const [showTradeModal, setShowTradeModal] = useState(false)
    const [selectedTradeMetal, setSelectedTradeMetal] = useState(null)

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
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        await Promise.all([
            fetchMyMetals(),
            fetchAllMetals(),
            fetchMyRequests(),
            fetchInventory(),
            fetchTransactions()
        ])
        setLoading(false)
    }

    const fetchMyMetals = async () => {
        const { data } = await supabase
            .from('user_metal_access')
            .select(`assigned_at, metals (*)`)
            .eq('user_id', user.id)
        if (data) setMyMetals(data.map(item => ({ ...item.metals, assigned_at: item.assigned_at })))
    }

    const fetchAllMetals = async () => {
        const { data } = await supabase.from('metals').select('*').order('name')
        if (data) setAllMetals(data)
    }

    const fetchMyRequests = async () => {
        const { data } = await supabase.from('metal_requests').select('*').eq('user_id', user.id)
        if (data) setMyRequests(data)
    }

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('user_inventory')
            .select(`*, metals(*)`)
            .eq('user_id', user.id)
        if (data) setInventory(data)
    }

    const fetchTransactions = async () => {
        const { data } = await supabase
            .from('metal_transactions')
            .select(`*, metals(name)`)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        if (data) setTransactions(data)
    }

    const handleTrade = async (e) => {
        e.preventDefault()
        const qty = parseFloat(e.target.qty.value)
        const type = e.target.type.value // 'BUY' or 'SELL'

        setMsg({ text: 'Processing trade...', type: 'info' })

        const { error } = await supabase.rpc(type === 'BUY' ? 'buy_metal' : 'sell_metal', {
            target_metal_id: selectedTradeMetal.id,
            target_quantity: qty
        })

        if (error) {
            setMsg({ text: 'Trade Error: ' + error.message, type: 'err' })
        } else {
            setMsg({ text: 'Trade successful!', type: 'succ' })
            setShowTradeModal(false)
            fetchData()
        }
    }

    const startTrade = (metal) => {
        navigate('/market', { state: { metalId: metal.id } })
    }

    const handleRequestAccess = async (metalId) => {
        setMsg({ text: 'Sending request...', type: 'info' })
        const { error } = await supabase.from('metal_requests').insert({
            user_id: user.id,
            metal_id: metalId
        })
        if (error) {
            console.error('Request Error:', error)
            setMsg({ text: 'Request failed: ' + error.message, type: 'err' })
        } else {
            setMsg({ text: 'Request sent successfully!', type: 'succ' })
            fetchData()
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

                <div className="menu-item" onClick={() => navigate('/market')}>
                    <TrendingUp size={20} />
                    <span>Market</span>
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
                        <img src={logo} alt="Techxl Logo" style={{ height: '40px', marginBottom: '15px', objectFit: 'contain' }} />
                        {msg.text && (
                            <div style={{
                                padding: '12px 20px',
                                background: msg.type === 'err' ? '#5c1b1b' : msg.type === 'succ' ? '#0e4231' : '#1a1b3a',
                                borderRadius: '15px',
                                marginBottom: '20px',
                                border: `1px solid ${msg.type === 'err' ? '#ef4444' : msg.type === 'succ' ? '#10b981' : '#3b82f6'}`,
                                animation: 'fadeIn 0.3s'
                            }}>
                                {msg.text}
                            </div>
                        )}
                    </header>

                    {/* Portfolio Summary Card - Reusing Neon Card */}
                    <div className="neon-card" style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>Total Portfolio Value</p>
                            <h2 style={{ fontSize: '3rem', marginBottom: '10px' }}>
                                ${inventory.reduce((acc, item) => acc + ((item.metals?.rate || 0) * item.quantity), 0).toLocaleString()}
                            </h2>
                            <div className="ticket-price" style={{ display: 'inline-block' }}>
                                {inventory.length} Assets Held
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

                    {/* Section: My Assets */}
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ marginBottom: '20px' }}>My Active Assets</h3>
                        <div className="tickets-list">
                            {loading ? <p>Loading...</p> : myMetals.length === 0 ? (
                                <div className="ticket-card" style={{ justifyContent: 'center', color: 'var(--text-muted)', minHeight: '100px', gridColumn: 'span 3' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={24} style={{ marginRight: '10px' }} /> No Metals Assigned Yet</div>
                                </div>
                            ) : (
                                myMetals.map(metal => {
                                    const holding = inventory.find(inv => inv.metal_id === metal.id)
                                    return (
                                        <div key={metal.id} className="ticket-card" onClick={() => navigate(`/metal/${metal.id}`)}>
                                            <div className="ticket-info">
                                                <div style={{ fontSize: '0.8rem', color: '#A098B5', marginBottom: '4px' }}>Secured Asset</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h3>{metal.name}</h3>
                                                    <div className="ticket-price" style={{ background: 'var(--primary)', color: '#3D2900', fontSize: '0.8rem', boxSshadow: 'none' }}>
                                                        {holding?.quantity || 0} Owned
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#A098B5', marginTop: '5px' }}>
                                                    {metal.change >= 0 ?
                                                        <span style={{ color: '#00D5A0', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={14} /> +{metal.change}%</span>
                                                        :
                                                        <span style={{ color: '#FF4757', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingDown size={14} /> {metal.change}%</span>
                                                    }
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto' }}>
                                                <div className="ticket-price" style={{ alignSelf: 'center' }}>${metal.rate?.toLocaleString()}</div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startTrade(metal); }}
                                                    style={{ background: 'var(--secondary)', border: 'none', borderRadius: '10px', padding: '8px 12px', color: '#0A2F25', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                >
                                                    <ShoppingCart size={14} /> Trade
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Section: Explore/Market */}
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Market Explorer</h3>
                        <div className="tickets-list">
                            {allMetals
                                .filter(m => !myMetals.find(my => my.id === m.id))
                                .map(metal => {
                                    const request = myRequests.find(r => r.metal_id === metal.id)
                                    return (
                                        <div key={metal.id} className="ticket-card" style={{ opacity: request ? 0.7 : 1 }}>
                                            <div className="ticket-info">
                                                <div style={{ fontSize: '0.8rem', color: '#A098B5', marginBottom: '4px' }}>Available Asset</div>
                                                <h3>{metal.name}</h3>
                                                <div className="ticket-price" style={{ margin: '10px 0' }}>${metal.rate?.toLocaleString()}</div>
                                            </div>
                                            <div style={{ marginTop: 'auto' }}>
                                                {request ? (
                                                    <button disabled style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#A098B5', cursor: 'default' }}>
                                                        {request.status === 'pending' ? 'Request Pending...' : `Request ${request.status}`}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRequestAccess(metal.id)}
                                                        style={{ width: '100%', padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '12px', color: '#3D2900', fontWeight: 'bold', cursor: 'pointer' }}
                                                    >
                                                        Request Access
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>

                </div>

                {/* Right Panel */}
                <aside className="right-panel">
                    <div className="right-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <h3>Account</h3>
                            <Settings color="#A098B5" size={20} />
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div className="sidebar-avatar" style={{ width: '60px', height: '60px', margin: '0 auto 15px auto', fontSize: '1.5rem' }}>
                                {user?.email?.[0].toUpperCase()}
                            </div>
                            <h3>{user?.email?.split('@')[0]}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                            <div className="user-row">
                                <span>Status</span>
                                <span className="permission-pill" style={{ color: '#00D5A0', borderColor: '#00D5A0' }}>Active</span>
                            </div>
                        </div>

                        {/* Moved Transaction History Here */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '0.9rem' }}>Recent Transactions</h4>
                                <button onClick={fetchTransactions} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                                    <RefreshCw size={12} />
                                </button>
                            </div>
                            <div style={{ flex: 1, paddingRight: '5px' }}>
                                {transactions.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>No history</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {transactions.slice(0, 10).map(tx => (
                                            <div key={tx.id} style={{ padding: '12px', background: '#150B25', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: tx.action === 'BUY' ? '#00D5A0' : '#FF4757' }}>{tx.action} {tx.metals?.name}</span>
                                                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>{tx.quantity}u</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#A098B5' }}>
                                                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                                    <span>at ${tx.rate}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{ background: '#150B25', padding: '15px', borderRadius: '15px' }}>
                                <h4 style={{ marginBottom: '5px', fontSize: '0.85rem' }}>Need Help?</h4>
                                <button style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>Support</button>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Trade Modal */}
            {showTradeModal && selectedTradeMetal && (
                <div className="modal-overlay" onClick={() => setShowTradeModal(false)}>
                    <div className="modal-dark" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <h2>Trade {selectedTradeMetal.name}</h2>
                            <X style={{ cursor: 'pointer' }} onClick={() => setShowTradeModal(false)} />
                        </div>

                        <div className="inventory-summary" style={{ background: '#150B25', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#A098B5' }}>Current Rate:</span>
                                <span>${selectedTradeMetal.rate?.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#A098B5' }}>Owned Units:</span>
                                <span>{inventory.find(inv => inv.metal_id === selectedTradeMetal.id)?.quantity || 0}</span>
                            </div>
                        </div>

                        {msg.text && (
                            <div style={{ padding: '12px', background: msg.type === 'err' ? '#5c1b1b' : '#0e4231', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>
                                {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleTrade} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Quantity</label>
                                <input className="dark-select" style={{ width: '100%' }} name="qty" type="number" step="0.1" defaultValue="1" min="0.1" required />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Transaction Type</label>
                                <select className="dark-select" style={{ width: '100%' }} name="type" required>
                                    <option value="BUY">BUY (Deduct from Platform)</option>
                                    <option value="SELL">SELL (Return to Platform)</option>
                                </select>
                            </div>

                            <button type="submit" style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', color: '#3D2900', cursor: 'pointer' }}>
                                Execute Trade
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
