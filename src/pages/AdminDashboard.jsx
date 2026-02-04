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
    MoreHorizontal,
    TrendingUp
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import '../AdminDashboard.css'
import logo from '../assets/techxl-logo.png';

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
    const [isAddingMetal, setIsAddingMetal] = useState(false)
    const [selectedAssignee, setSelectedAssignee] = useState(null)
    const [selectedMetalId, setSelectedMetalId] = useState('')
    const [activeTab, setActiveTab] = useState('inventory') // 'inventory' or 'requests'
    const [requests, setRequests] = useState([])
    const [msg, setMsg] = useState({ text: '', type: '' })
    const [userAccessMap, setUserAccessMap] = useState({})
    const [filterType, setFilterType] = useState('All')
    const [platformStock, setPlatformStock] = useState({})
    const [allTransactions, setAllTransactions] = useState([])
    const [showUserModal, setShowUserModal] = useState(false)
    const [userSearch, setUserSearch] = useState('')

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        const { data: usersData } = await supabase.from('profiles').select('*')
        const { data: metalsData } = await supabase.from('metals').select('*').order('name')
        const { data: accessData } = await supabase.from('user_metal_access').select('user_id, metals(name, id)')
        const { data: requestsData, error: requestsError } = await supabase.from('metal_requests').select('*, profiles(email), metals(name)').eq('status', 'pending')

        if (requestsError) console.error('Error fetching requests:', requestsError)
        setRequests(requestsData || [])
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
        if (metalsData) {
            setMetals(metalsData)
            // Fetch platform stock
            const { data: stockData } = await supabase.from('platform_inventory').select('*')
            const stockMap = {}
            stockData?.forEach(s => stockMap[s.metal_id] = s.quantity)
            setPlatformStock(stockMap)
        }

        // Fetch all transactions for admin
        const { data: txData } = await supabase.from('metal_transactions').select('*, profiles(email), metals(name)').order('created_at', { ascending: false })
        setAllTransactions(txData || [])
    }

    // --- Actions ---
    const handleLogout = async () => { await logout(); navigate('/login'); }
    const handleDeleteMetal = async (id) => { if (window.confirm('Delete Asset?')) { await supabase.from('metals').delete().eq('id', id); fetchData(); } }

    const startAddMetal = () => { setIsAddingMetal(true); setEditMetal({ name: '', rate: '', change: '', type: 'precious' }); setSelectedAssignee(null); setMsg({ text: '', type: '' }); setShowModal(true); }
    const startEditMetal = (metal) => { setIsAddingMetal(false); setEditMetal(metal); setSelectedAssignee(null); setMsg({ text: '', type: '' }); setShowModal(true); }

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

    const handleSaveMetal = async (e) => {
        e.preventDefault()
        setMsg({ text: 'Saving asset...', type: 'info' })
        const meta = {
            name: e.target.name.value,
            rate: parseFloat(e.target.rate.value),
            change: parseFloat(e.target.change.value),
            type: e.target.type.value
        }

        const qty = parseFloat(e.target.stock?.value || 0)

        if (isAddingMetal) {
            const { data: newMetal, error } = await supabase.from('metals').insert([meta]).select().single()
            if (!error) {
                // Initialize platform stock
                await supabase.from('platform_inventory').insert({ metal_id: newMetal.id, quantity: qty })
                fetchData(); setShowModal(false); setMsg({ text: '', type: '' });
            } else { setMsg({ text: 'Error: ' + error.message, type: 'err' }); }
        } else {
            const { error } = await supabase.from('metals').update(meta).eq('id', editMetal.id)
            if (!error) {
                // Update platform stock
                await supabase.from('platform_inventory').upsert({ metal_id: editMetal.id, quantity: qty })
                fetchData(); setShowModal(false); setMsg({ text: '', type: '' });
            } else { setMsg({ text: 'Error: ' + error.message, type: 'err' }); }
        }
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

    const handleApproveRequest = async (req) => {
        // 1. Grant Access
        const { error: accessErr } = await supabase.from('user_metal_access').insert({ user_id: req.user_id, metal_id: req.metal_id })
        if (accessErr && accessErr.code !== '23505') { // Ignore if already granted
            setMsg({ text: 'Error: ' + accessErr.message, type: 'err' }); return
        }
        // 2. Delete Request
        await supabase.from('metal_requests').delete().eq('id', req.id)
        fetchData()
    }

    const handleRejectRequest = async (id) => {
        await supabase.from('metal_requests').update({ status: 'rejected' }).eq('id', id)
        fetchData()
    }

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? All their data will be removed.')) return
        setMsg({ text: 'Deleting user...', type: 'info' })
        const { error } = await supabase.rpc('delete_user_safely', { target_user_id: id })
        if (error) {
            setMsg({ text: 'Error: ' + error.message, type: 'err' })
        } else {
            setMsg({ text: 'User deleted successfully', type: 'succ' })
            fetchData()
        }
    }

    const handleAddUser = async (e) => {
        e.preventDefault()
        const email = e.target.email.value
        const password = e.target.password.value
        const name = e.target.name.value

        setMsg({ text: 'Adding user...', type: 'info' })
        // Use signUp to create the auth account (trigger will create profile)
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
        })

        if (error) {
            setMsg({ text: 'Error: ' + error.message, type: 'err' })
        } else {
            setMsg({ text: 'User invited! They need to confirm email.', type: 'succ' })
            setShowUserModal(false)
            fetchData()
        }
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
                <div className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                    <LayoutDashboard size={20} />
                    <span>Inventory</span>
                </div>
                <div className={`menu-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                    <div style={{ position: 'relative' }}>
                        <Ticket size={20} />
                        {requests.length > 0 && <div className="notification-badge">{requests.length}</div>}
                    </div>
                    <span>Requests</span>
                </div>
                <div className={`menu-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    <Users size={20} />
                    <span>Users</span>
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

            {/* MAIN CONTENT */}
            <main className="admin-main">
                <div className="dashboard-center">

                    {activeTab === 'inventory' && (
                        <>
                            {/* Inventory Header */}
                            <header className="section-header">
                                <img src={logo} alt="Techxl Logo" style={{ height: '30px', marginBottom: '20px', objectFit: 'contain' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h1>Metal Inventory</h1>
                                    <button onClick={startAddMetal} style={{ background: 'var(--primary)', color: '#3D2900', border: 'none', borderRadius: '15px', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Plus size={20} /> Add Asset
                                    </button>
                                </div>
                                <div className="filter-bar">
                                    <div className="filter-group">
                                        <label>Asset Type:</label>
                                        <select className="dark-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                            <option value="All">All Metals</option>
                                            <option value="precious">Precious</option>
                                            <option value="industrial">Industrial</option>
                                            <option value="other">Other</option>
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
                            <div>
                                <h3 style={{ marginBottom: '20px' }}>Active Listings</h3>
                                <div className="tickets-list">
                                    {metals.filter(m => filterType === 'All' || m.type === filterType).map(metal => (
                                        <div key={metal.id} className="ticket-card" onClick={() => navigate(`/metal/${metal.id}`)}>
                                            <div className="ticket-info">
                                                <div style={{ fontSize: '0.8rem', color: '#A098B5', marginBottom: '4px' }}>#00{metal.id.substring(0, 4)}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h3>{metal.name}</h3>
                                                    <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', color: 'var(--primary)' }}>
                                                        Stock: {platformStock[metal.id] || 0}
                                                    </div>
                                                </div>
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
                        </>
                    )}

                    {activeTab === 'requests' && (
                        <>
                            {/* Requests View */}
                            <header className="section-header">
                                <h1>Access Requests</h1>
                                <p>Manage pending user requests for metal access</p>
                            </header>

                            <div className="requests-container">
                                {requests.length === 0 ? (
                                    <div className="neon-card" style={{ textAlign: 'center', padding: '60px' }}>
                                        <Ticket size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                                        <p style={{ color: 'var(--text-muted)' }}>No pending requests at the moment.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {requests.map(req => (
                                            <div key={req.id} className="ticket-card" style={{ flexDirection: 'row', minHeight: 'auto', alignItems: 'center', gap: '20px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#A098B5' }}>User Request</div>
                                                    <h3 style={{ margin: '5px 0' }}>{req.profiles?.email}</h3>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Wants access to: <strong>{req.metals?.name}</strong></div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleRejectRequest(req.id)} style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid #FF4757', color: '#FF4757', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                                                    <button onClick={() => handleApproveRequest(req)} style={{ background: 'var(--secondary)', border: 'none', color: '#0A2F25', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Approve Access</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'users' && (
                        <>
                            {/* Users Management View */}
                            <header className="section-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h1>User Directory</h1>
                                    <button onClick={() => { setShowUserModal(true); setMsg({ text: '', type: '' }); }} style={{ background: 'var(--primary)', color: '#3D2900', border: 'none', borderRadius: '15px', padding: '12px 24px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Plus size={20} /> Add User
                                    </button>
                                </div>
                                <div className="filter-bar">
                                    <div className="filter-group" style={{ flex: 1 }}>
                                        <label>Search Users:</label>
                                        <div className="dark-date" style={{ width: '100%' }}>
                                            <Search size={16} color="#FDBA31" style={{ marginRight: '10px' }} />
                                            <input
                                                type="text"
                                                placeholder="Name or Email..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </header>

                            <div className="tickets-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {realUsers
                                    .filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()))
                                    .map(u => (
                                        <div key={u.id} className="ticket-card" style={{ flexDirection: 'row', minHeight: 'auto', alignItems: 'center', padding: '15px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                                                <div className="sidebar-avatar" style={{ width: '45px', height: '45px', fontSize: '1.2rem', margin: 0 }}>
                                                    {u.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{u.name || 'Unnamed User'}</h3>
                                                    <div style={{ fontSize: '0.85rem', color: '#A098B5' }}>{u.email}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'right', display: 'none' }}>
                                                    <div style={{ fontSize: '0.75rem', color: '#A098B5' }}>Holdings</div>
                                                    <div style={{ fontWeight: 'bold' }}>{u.access?.length || 0} Assets</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => startAssignUser(u)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>Inspect</button>
                                                    <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid #FF4757', color: '#FF4757', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* RIGHT PANEL - 'Manage Access' Integrated Here */}
            <aside className="right-panel">
                <div className="right-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                        <h3>User Access</h3>
                        <MoreHorizontal color="#A098B5" />
                    </div>

                    <div className="user-scroll" style={{ marginBottom: '30px' }}>
                        {realUsers.map(u => (
                            <div key={u.id} className="user-row" style={{ background: selectedAssignee?.id === u.id ? 'rgba(253, 186, 49, 0.1)' : 'transparent', borderRadius: '10px', padding: '8px 12px', transition: '0.2s', marginBottom: '5px' }}>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '600', color: selectedAssignee?.id === u.id ? '#FDBA31' : 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name || u.email.split('@')[0]}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#A098B5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                                </div>
                                <button
                                    onClick={() => startAssignUser(u)}
                                    style={{
                                        background: selectedAssignee?.id === u.id ? '#FDBA31' : 'rgba(255,255,255,0.05)',
                                        color: selectedAssignee?.id === u.id ? '#3D2900' : 'white',
                                        border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', marginLeft: '10px'
                                    }}
                                >
                                    {selectedAssignee?.id === u.id ? 'Active' : 'Pick'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* CONDITIONAL MANAGE ACCESS BLOCK */}
                    {selectedAssignee ? (
                        <div style={{ background: '#150B25', padding: '20px', borderRadius: '20px', border: '1px solid var(--primary)', animation: 'fadeIn 0.3s', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                                <span style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem' }}>Manage Access</span>
                                <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSelectedAssignee(null)} />
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                                {userAccessMap[selectedAssignee.id]?.length > 0 ? (
                                    userAccessMap[selectedAssignee.id].map(m => (
                                        <div key={m.id} className="permission-pill" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#2D1B4E', fontSize: '0.7rem' }}>
                                            {m.name}
                                            <X size={10} style={{ cursor: 'pointer', color: '#FF4757' }} onClick={() => handleRevoke(m.id)} />
                                        </div>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#666' }}>No access.</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select style={{ flex: 1, fontSize: '0.75rem', padding: '8px' }} className="dark-select" onChange={e => setSelectedMetalId(e.target.value)} value={selectedMetalId}>
                                    <option value="">Grant...</option>
                                    {metals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <button onClick={handleGrantAccess} style={{ width: '32px', height: '32px', background: 'var(--secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2F25' }}><Plus size={16} /></button>
                            </div>
                            {msg.text && <div style={{ marginTop: '8px', fontSize: '0.7rem', color: msg.type === 'err' ? '#FF4757' : '#00D5A0' }}>{msg.text}</div>}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <h4 style={{ fontSize: '0.85rem', marginBottom: '15px', color: 'var(--text-muted)' }}>Global Activity</h4>
                            <div style={{ flex: 1, paddingRight: '5px' }}>
                                {allTransactions.length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>No activity</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {allTransactions.slice(0, 15).map(tx => (
                                            <div key={tx.id} style={{ padding: '10px', background: '#150B25', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                                                    <span style={{ color: tx.action === 'BUY' ? '#00D5A0' : '#FF4757', fontWeight: 'bold' }}>{tx.action}</span>
                                                    <span style={{ color: 'white', marginLeft: '5px' }}>{tx.metals?.name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#A098B5' }}>
                                                    <span>{tx.profiles?.email?.split('@')[0]}</span>
                                                    <span>{tx.quantity}u @ ${tx.rate}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '20px', background: '#150B25', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#A098B5' }}>Inventory</span>
                                    <span>{stats.metals} Assets</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#A098B5' }}>Users</span>
                                    <span>{stats.users} Active</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
            {showModal && editMetal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-dark" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <h2>{isAddingMetal ? 'Create New Asset' : 'Edit Asset'}</h2>
                            <X style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
                        </div>

                        {msg.text && <div style={{ padding: '10px', background: msg.type === 'err' ? '#5c1b1b' : '#0e4231', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>{msg.text}</div>}

                        <form onSubmit={handleSaveMetal} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Asset Name</label>
                                <input className="dark-select" style={{ width: '100%' }} defaultValue={editMetal.name} name="name" placeholder="e.g. Gold" required />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Current Rate ($)</label>
                                <input className="dark-select" style={{ width: '100%' }} defaultValue={editMetal.rate} type="number" step="0.01" name="rate" placeholder="0.00" required />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>24h Change (%)</label>
                                <input className="dark-select" style={{ width: '100%' }} defaultValue={editMetal.change} type="number" step="0.1" name="change" placeholder="0.0" required />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Metal Type</label>
                                <select className="dark-select" style={{ width: '100%' }} defaultValue={editMetal.type} name="type" required>
                                    <option value="precious">Precious (Gold, Silver, etc.)</option>
                                    <option value="industrial">Industrial (Copper, Aluminum, etc.)</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Platform Stock (Available for Purchase)</label>
                                <input className="dark-select" style={{ width: '100%' }} name="stock" type="number" defaultValue={platformStock[editMetal.id] || 0} required />
                            </div>

                            {!isAddingMetal && (
                                <button
                                    type="button"
                                    onClick={() => handleDeleteMetal(editMetal.id)}
                                    style={{ background: 'transparent', border: '1px solid #FF4757', color: '#FF4757', padding: '10px', borderRadius: '15px', marginTop: '10px', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Delete Asset
                                </button>
                            )}

                            <button type="submit" style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', color: '#3D2900', cursor: 'pointer' }}>
                                {isAddingMetal ? 'Create Asset' : 'Update Asset'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* User Addition Modal */}
            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-dark" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div className="sidebar-avatar" style={{ margin: 0, width: '40px', height: '40px' }}><Users size={20} /></div>
                                <h2>Onboard New Member</h2>
                            </div>
                            <X style={{ cursor: 'pointer' }} onClick={() => setShowUserModal(false)} />
                        </div>

                        {msg.text && <div style={{ padding: '12px', background: msg.type === 'err' ? '#5c1b1b' : '#0e4231', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>{msg.text}</div>}

                        <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Full Name</label>
                                <input className="dark-select" style={{ width: '100%' }} name="name" placeholder="John Doe" required />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Email Address</label>
                                <input className="dark-select" style={{ width: '100%' }} name="email" type="email" placeholder="john@example.com" required />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.75rem', color: '#A098B5', marginLeft: '10px' }}>Temporary Password</label>
                                <input className="dark-select" style={{ width: '100%' }} name="password" type="password" placeholder="••••••••" required />
                            </div>

                            <button type="submit" style={{ width: '100%', padding: '15px', background: 'var(--primary)', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', color: '#3D2900', cursor: 'pointer' }}>
                                Create Account
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
