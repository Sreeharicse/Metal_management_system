import { useState, useEffect } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    LogOut,
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Activity,
    Clock,
    DollarSign,
    Layers
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import '../AdminDashboard.css'
import logo from '../assets/techxl-logo.png';

export default function Market() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [metals, setMetals] = useState([])
    const [selectedMetal, setSelectedMetal] = useState(null)
    const [inventory, setInventory] = useState([])
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [tradeQty, setTradeQty] = useState(1)
    const [msg, setMsg] = useState({ text: '', type: '' })

    // Mock chart data for premium feel
    const mockChartData = [
        { name: '09:00', price: 1850 },
        { name: '10:00', price: 1865 },
        { name: '11:00', price: 1840 },
        { name: '12:00', price: 1890 },
        { name: '13:00', price: 1910 },
        { name: '14:00', price: 1880 },
        { name: '15:00', price: 1925 },
    ];

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        const [mRes, iRes, tRes] = await Promise.all([
            supabase.from('metals').select('*').order('name'),
            supabase.from('user_inventory').select('*, metals(*)').eq('user_id', user.id),
            supabase.from('metal_transactions').select('*, metals(name)').eq('user_id', user.id).order('created_at', { ascending: false })
        ])

        if (mRes.data) {
            setMetals(mRes.data)
            if (!selectedMetal && mRes.data.length > 0) setSelectedMetal(mRes.data[0])
        }
        if (iRes.data) setInventory(iRes.data)
        if (tRes.data) setTransactions(tRes.data)
        setLoading(false)
    }

    const handleTrade = async (type) => {
        if (tradeQty <= 0) return
        setMsg({ text: 'Executing trade...', type: 'info' })

        const { error } = await supabase.rpc(type === 'BUY' ? 'buy_metal' : 'sell_metal', {
            target_metal_id: selectedMetal.id,
            target_quantity: tradeQty
        })

        if (error) {
            setMsg({ text: 'Error: ' + error.message, type: 'err' })
        } else {
            setMsg({ text: `Succesfully ${type === 'BUY' ? 'bought' : 'sold'} ${tradeQty} units!`, type: 'succ' })
            fetchData()
        }
    }

    const currentHolding = inventory.find(inv => inv.metal_id === selectedMetal?.id)?.quantity || 0

    return (
        <div className="admin-container" style={{ padding: '0' }}>
            {/* Minimal Sidebar for Market */}
            <nav className="admin-sidebar" style={{ width: '80px', alignItems: 'center', padding: '30px 0', marginRight: '0', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div
                    className="sidebar-avatar"
                    style={{ width: '45px', height: '45px', cursor: 'pointer', borderRadius: '15px' }}
                    onClick={() => navigate('/user')}
                >
                    <ArrowLeft size={20} />
                </div>

                <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="menu-item active" style={{ padding: '10px', borderRadius: '15px' }}>
                        <ShoppingCart size={24} />
                    </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div className="menu-item" onClick={logout} style={{ padding: '10px' }}>
                        <LogOut size={24} />
                    </div>
                </div>
            </nav>

            <main className="admin-main" style={{ gridTemplateColumns: '300px 1fr 300px', gap: '0', paddingRight: '0' }}>
                {/* Metals List Panel */}
                <aside style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '30px' }}>
                        <img src={logo} alt="Techxl Logo" style={{ height: '30px', marginBottom: '20px', objectFit: 'contain' }} />
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Market</h2>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search metals..."
                                style={{ width: '100%', background: '#150B25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 15px', color: 'white' }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '0 15px' }}>
                        {metals.map(metal => (
                            <div
                                key={metal.id}
                                onClick={() => setSelectedMetal(metal)}
                                style={{
                                    padding: '20px',
                                    borderRadius: '20px',
                                    marginBottom: '10px',
                                    cursor: 'pointer',
                                    background: selectedMetal?.id === metal.id ? 'var(--bg-card)' : 'transparent',
                                    border: selectedMetal?.id === metal.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>{metal.name}</span>
                                    <span style={{ color: metal.change >= 0 ? '#00D5A0' : '#FF4757', fontSize: '0.85rem' }}>
                                        {metal.change >= 0 ? '+' : ''}{metal.change}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>${metal.rate?.toLocaleString()}</span>
                                    {inventory.find(i => i.metal_id === metal.id) && (
                                        <Layers size={14} color="var(--primary)" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Trading View */}
                <div style={{ padding: '40px' }}>
                    {selectedMetal ? (
                        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
                                        <h1 style={{ fontSize: '3rem' }}>{selectedMetal.name}</h1>
                                        <div className="ticket-price" style={{ height: 'fit-content' }}>MTL-{selectedMetal.name.substring(0, 3).toUpperCase()}</div>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                                        Live Price: <span style={{ color: 'white', fontWeight: 'bold' }}>${selectedMetal.rate?.toLocaleString()}</span>
                                        <span style={{ color: selectedMetal.change >= 0 ? '#00D5A0' : '#FF4757', marginLeft: '10px' }}>
                                            ({selectedMetal.change >= 0 ? '+' : ''}{selectedMetal.change}%)
                                        </span>
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '5px' }}>Your Balance</p>
                                    <h2 style={{ fontSize: '2rem' }}>{currentHolding} Units</h2>
                                </div>
                            </header>

                            {/* Main Chart Area */}
                            <div className="neon-card" style={{ height: '400px', padding: '30px', marginBottom: '40px', background: '#120A21' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 'bold', borderBottom: '2px solid var(--primary)' }}>Price</button>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>Market Cap</button>
                                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>Supply</button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {['1H', '1D', '1W', '1M', '1Y'].map(t => (
                                            <button key={t} style={{ background: t === '1D' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height="90%">
                                    <AreaChart data={mockChartData}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                        <Tooltip
                                            contentStyle={{ background: '#150B25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: 'var(--primary)' }}
                                        />
                                        <Area type="monotone" dataKey="price" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Trading Controls */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                                <div className="neon-card" style={{ padding: '30px' }}>
                                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Activity size={20} color="var(--secondary)" /> Execution
                                    </h3>

                                    {msg.text && (
                                        <div style={{ padding: '12px', background: msg.type === 'err' ? '#5c1b1b' : msg.type === 'succ' ? '#0e4231' : '#150B25', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem' }}>
                                            {msg.text}
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px', marginLeft: '5px' }}>Amount to Trade</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={tradeQty}
                                                onChange={(e) => setTradeQty(parseFloat(e.target.value))}
                                                style={{ width: '100%', background: '#150B25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', padding: '15px 20px', paddingRight: '80px', fontSize: '1.2rem', color: 'white', outline: 'none' }}
                                            />
                                            <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Units</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 5px' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Value:</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>${(tradeQty * selectedMetal.rate).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <button
                                            onClick={() => handleTrade('BUY')}
                                            style={{ background: '#00D5A0', color: '#0A2F25', border: 'none', borderRadius: '15px', padding: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'filter 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                            onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
                                        >
                                            Buy {selectedMetal.name}
                                        </button>
                                        <button
                                            onClick={() => handleTrade('SELL')}
                                            style={{ background: '#FF4757', color: 'white', border: 'none', borderRadius: '15px', padding: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'filter 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                                            onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
                                        >
                                            Sell {selectedMetal.name}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <ShoppingCart size={64} style={{ marginBottom: '20px', opacity: 0.2 }} />
                                <h3>Select an asset to start trading</h3>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Account/History Panel */}
                <aside style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '30px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div className="sidebar-avatar" style={{ width: '60px', height: '60px', margin: '0 auto 15px auto', fontSize: '1.5rem' }}>
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <h3 style={{ fontSize: '1.1rem' }}>{user?.email?.split('@')[0]}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</p>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Market Activity</h4>
                        <div style={{ flex: 1, paddingRight: '5px' }}>
                            {transactions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    No trade history yet.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {transactions.slice(0, 15).map(tx => (
                                        <div key={tx.id} style={{ padding: '15px', background: '#150B25', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: tx.action === 'BUY' ? '#00D5A0' : '#FF4757' }}>{tx.action}</span>
                                                <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 'bold' }}>{tx.metals?.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#A098B5' }}>
                                                <span>{tx.quantity} units</span>
                                                <span>${tx.rate}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    )
}
