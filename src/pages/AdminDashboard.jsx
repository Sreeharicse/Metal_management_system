import { useEffect, useState } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    MapPin,
    Calendar,
    LayoutDashboard,
    Ticket,
    Users,
    Settings,
    LogOut,
    Plus,
    X,
    Filter,
    Search,
    ChevronDown,
    MoreHorizontal
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import '../AdminDashboard.css'

const chartData = [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 60 },
    { name: 'Apr', value: 90 },
    { name: 'May', value: 75 },
    { name: 'Jun', value: 50 },
];

export default function AdminDashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const [realUsers, setRealUsers] = useState([])
    const [metals, setMetals] = useState([])
    const [stats, setStats] = useState({ users: 0, metals: 0 })

    const [showModal, setShowModal] = useState(false)
    const [editMetal, setEditMetal] = useState(null)
    const [selectedAssignee, setSelectedAssignee] = useState(null)
    const [selectedMetalId, setSelectedMetalId] = useState('')
    const [msg, setMsg] = useState({ text: '', type: '' })
    const [userAccessMap, setUserAccessMap] = useState({})

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data: usersData } = await supabase.from('profiles').select('*')
        const { data: metalsData } = await supabase.from('metals').select('*').order('name')
        const { data: accessData } = await supabase.from('user_metal_access').select('user_id, metals(name, id)')

        const accessMap = {}
        if (accessData) {
            accessData.forEach(item => {
                if (!accessMap[item.user_id]) accessMap[item.user_id] = []
                if (item?.metals) accessMap[item.user_id].push(item.metals)
            })
        }
        setUserAccessMap(accessMap)

        if (usersData) {
            const finalUsers = usersData
                .filter(u => u.role !== 'admin')
                .map(u => ({ ...u, access: accessMap[u.id] || [] }))
            setRealUsers(finalUsers)
            setStats({ users: usersData.length, metals: metalsData?.length || 0 })
        }
        if (metalsData) setMetals(metalsData)
    }

    // --- Actions ---
    const handleLogout = async () => { await logout(); navigate('/login'); }
    const handleDeleteMetal = async (id) => { if (window.confirm('Delete?')) { await supabase.from('metals').delete().eq('id', id); fetchData(); } }

    const startEditMetal = (metal) => { setEditMetal(metal); setSelectedAssignee(null); setMsg({ t: '', ty: '' }); setShowModal(true); }

    // MODIFIED: Toggles sidebar panel instead of opening modal
    const startAssignUser = (u) => {
        if (selectedAssignee?.id === u.id) {
            setSelectedAssignee(null);
        } else {
            setSelectedAssignee(u);
            setEditMetal(null);
            setSelectedMetalId('');
            setMsg({ text: '', type: '' });
        }
    }

    const handleUpdateMetal = async (e) => {
        e.preventDefault()
        const { error } = await supabase.from('metals').update({
            name: e.target.name.value,
            rate: e.target.rate.value,
            change: e.target.change.value
        }).eq('id', editMetal.id)
        if (!error) { fetchData(); setShowModal(false); }
    }

    const handleGrantAccess = async () => {
        if (!selectedAssignee || !selectedMetalId) return
        if (userAccessMap[selectedAssignee.id]?.find(m => m.id == selectedMetalId)) { setMsg({ text: 'Already has access', type: 'err' }); return }
        const { error } = await supabase.from('user_metal_access').insert({ user_id: selectedAssignee.id, metal_id: selectedMetalId })
        if (!error) { fetchData(); setMsg({ text: 'Granted!', type: 'succ' }); }
    }

    // NEW: Revoke functionality
    const handleRevoke = async (metalId) => {
        const { error } = await supabase.from('user_metal_access').delete().eq('user_id', selectedAssignee.id).eq('metal_id', metalId)
        if (!error) fetchData()
    }

    return (
        <div className="admin-container">
            {/* LEFT SIDEBAR - PROFILE STYLE */}
            <nav className="admin-sidebar">
                <div style={{ padding: '20px 0', fontSize: '0.8rem', color: '#666' }}>09:00 AM</div>

                {/* Profile Block */}
                <div className="profile-section">
                    <div className="sidebar-avatar">
                        {user?.email?.[0].toUpperCase()}
                    </div>
                    <div className="profile-name">{user?.email?.split('@')[0]}</div>
                </div>

                {/* Nav Links */}
                <div className="menu-item active">
                    <LayoutDashboard size={20} />
                    <span>Metals</span>
                </div>
                <div className="menu-item">
                    <Users size={20} />
                    <span>Users</span>
                </div>
                <div className="menu-item">
                    <Ticket size={20} />
                    <span>Requests</span>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <div className="menu-item" onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="admin-main">
                <div className="dashboard-center">

                    {/* Header Section */}
                    <header className="section-header">
                        <h1>Metal Inventory</h1>
                        <div className="filter-bar">
                            <div className="filter-group">
                                <label>Asset Type:</label>
                                <select className="dark-select">
                                    <option>All Metals</option>
                                    <option>Precious</option>
                                    <option>Industrial</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Market:</label>
                                <div className="dark-date">
                                    <MapPin size={16} color="#FDBA31" />
                                    Global
                                </div>
                            </div>
                            <div className="filter-group">
                                <label>Date:</label>
                                <div className="dark-date">
                                    <Calendar size={16} color="#FDBA31" />
                                    {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Chart Card */}
                    <div className="neon-card" style={{ height: '280px', overflow: 'hidden', padding: '0' }}>
                        <div style={{ position: 'absolute', top: '20px', left: '30px', zIndex: 10 }}>
                            <h3 style={{ marginBottom: '5px' }}>Market Trends</h3>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Live 24h Performance</p>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{ background: '#150B25', borderRadius: '10px', border: 'none' }} />
                                <Area type="monotone" dataKey="value" stroke="#FDBA31" strokeWidth={3} fillOpacity={1} fill="url(#neonGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Ticket Style Grid */}
                    {/* Ticket Style Grid */}
                    <div>
                        <h3 style={{ marginBottom: '20px' }}>Active Listings</h3>
                        <div className="tickets-list">
                            {metals.map(metal => (
                                <div key={metal.id} className="ticket-card" onClick={() => navigate(`/metal/${metal.id}`)}>
                                    <div className="ticket-info">
                                        <div style={{ fontSize: '0.8rem', color: '#A098B5', marginBottom: '4px' }}>#00{metal.id}</div>
                                        <h3>{metal.name}</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#A098B5' }}>24h Change: <span style={{ color: metal.change >= 0 ? '#00D5A0' : '#FF4757' }}>{metal.change}%</span></div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto' }}>
                                        <div className="ticket-price">${metal.rate.toLocaleString()}</div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEditMetal(metal); }}
                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '36px', height: '36px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}
                                        >
                                            <Settings size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT PANEL - 'Manage Access' Integrated Here */}
                <aside className="right-panel">
                    <div className="right-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <h3>User Access</h3>
                            <MoreHorizontal color="#A098B5" />
                        </div>

                        <div className="user-scroll" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                            {realUsers.map(u => (
                                <div key={u.id} className="user-row" style={{ background: selectedAssignee?.id === u.id ? 'rgba(253, 186, 49, 0.1)' : 'transparent', borderRadius: '10px', paddingLeft: '10px', paddingRight: '10px', transition: '0.2s' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', color: selectedAssignee?.id === u.id ? '#FDBA31' : 'white' }}>{u.name || u.email.split('@')[0]}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#A098B5' }}>{u.email}</div>
                                    </div>
                                    <button
                                        onClick={() => startAssignUser(u)}
                                        style={{
                                            background: selectedAssignee?.id === u.id ? '#FDBA31' : 'rgba(255,255,255,0.1)',
                                            color: selectedAssignee?.id === u.id ? '#3D2900' : 'white',
                                            border: 'none', borderRadius: '10px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'
                                        }}
                                    >
                                        {selectedAssignee?.id === u.id ? 'Editing' : 'Inspect'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* CONDITIONAL MANAGE ACCESS BLOCK */}
                        <div style={{ marginTop: '20px' }}>
                            {selectedAssignee ? (
                                <div style={{ background: '#150B25', padding: '20px', borderRadius: '20px', border: '1px solid var(--primary)', animation: 'fadeIn 0.3s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                                        <span style={{ color: 'white', fontWeight: '600' }}>Manage {selectedAssignee.email.split('@')[0]}</span>
                                        <X size={16} style={{ cursor: 'pointer' }} onClick={() => setSelectedAssignee(null)} />
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                                        {userAccessMap[selectedAssignee.id]?.length > 0 ? (
                                            userAccessMap[selectedAssignee.id].map(m => (
                                                <div key={m.id} className="permission-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2D1B4E' }}>
                                                    {m.name}
                                                    <X size={12} style={{ cursor: 'pointer', color: '#FF4757' }} onClick={() => handleRevoke(m.id)} />
                                                </div>
                                            ))
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#666' }}>No metals assigned.</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select style={{ flex: 1, fontSize: '0.8rem' }} className="dark-select" onChange={e => setSelectedMetalId(e.target.value)} value={selectedMetalId}>
                                            <option value="">Add...</option>
                                            {metals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <button onClick={handleGrantAccess} style={{ width: '40px', background: 'var(--secondary)', border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2F25' }}><Plus size={20} /></button>
                                    </div>
                                    {msg.text && <div style={{ marginTop: '10px', fontSize: '0.75rem', color: msg.type === 'err' ? '#FF4757' : '#00D5A0' }}>{msg.text}</div>}
                                </div>
                            ) : (
                                <div style={{ background: '#150B25', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span style={{ color: '#A098B5' }}>Total Inventory</span>
                                        <span>{stats.metals} Units</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span style={{ color: '#A098B5' }}>Registered Users</span>
                                        <span>{stats.users} Active</span>
                                    </div>
                                    <button style={{ width: '100%', padding: '15px', background: 'var(--secondary)', border: 'none', borderRadius: '15px', fontWeight: '700', fontSize: '1rem', color: '#0A2F25', cursor: 'pointer' }}>
                                        System Status: OK
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* DARK MODAL - Only for Edit Metal now */}
            {showModal && editMetal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-dark" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <h2>Edit Asset</h2>
                            <X style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
                        </div>

                        {msg.text && <div style={{ padding: '10px', background: msg.type === 'err' ? '#5c1b1b' : '#0e4231', borderRadius: '10px', marginBottom: '20px' }}>{msg.text}</div>}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <input className="dark-select" defaultValue={editMetal.name} name="name" placeholder="Name" />
                            <input className="dark-select" defaultValue={editMetal.rate} type="number" step="0.01" name="rate" placeholder="Rate" />
                            <input className="dark-select" defaultValue={editMetal.change} type="number" step="0.1" name="change" placeholder="Change %" />
                            <button onClick={handleUpdateMetal} style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '20px' }}>Update Asset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
