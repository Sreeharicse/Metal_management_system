import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabaseClient'
import { ArrowLeft, Award, TrendingUp, Activity, DollarSign, Clock, MapPin } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import '../AdminDashboard.css'

// Helper to generate fake history based on a base price
const generateMockHistory = (basePrice) => {
    const data = []
    let currentPrice = basePrice || 1000
    const points = 24
    for (let i = 0; i < points; i++) {
        data.push({
            time: `${23 - i}:00`,
            price: Number(currentPrice.toFixed(2))
        })
        const change = (Math.random() - 0.5) * 0.04
        currentPrice = currentPrice * (1 - change)
    }
    return data.reverse()
}

export default function MetalDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [metal, setMetal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState([])

    useEffect(() => {
        const fetchMetal = async () => {
            const { data, error } = await supabase.from('metals').select('*').eq('id', id).single()
            if (data) {
                setMetal(data)
                setChartData(generateMockHistory(data.rate))
            }
            setLoading(false)
        }
        fetchMetal()
    }, [id])

    if (loading) return <div className="admin-container flex-center" style={{ color: 'white' }}>Loading...</div>
    if (!metal) return <div className="admin-container flex-center" style={{ color: 'white' }}>Metal not found</div>

    return (
        <div className="admin-container" style={{ flexDirection: 'column', height: '100vh', overflow: 'auto', padding: '20px 40px' }}>
            {/* Header / Nav */}
            <div style={{ paddingBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '14px',
                        width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={22} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>{metal.name}</h1>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Asset Details & Analysis</div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ maxWidth: '1400px', width: '100%', display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>

                {/* Left Column: Chart & Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {/* Hero Stats Wrapper */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div className="neon-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Current Price</span>
                            <h2 style={{ fontSize: '3.5rem', margin: 0, lineHeight: '1.1' }}>${(metal.rate || 0).toLocaleString()}</h2>
                            <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                    padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: (metal.change || 0) >= 0 ? 'var(--secondary)' : '#FF4757',
                                    color: '#130B29'
                                }}>
                                    <TrendingUp size={16} /> {(metal.change || 0) > 0 ? '+' : ''}{metal.change || 0}%
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>Last 24 hours</span>
                            </div>
                        </div>

                        {/* Analysis Block - Styled like the Reference Image */}
                        <div className="neon-card" style={{
                            background: '#1F1135', /* Slightly darker tone for contrast */
                            padding: '30px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                        }}>
                            <div>
                                <h3 style={{ marginBottom: '15px', color: 'white' }}>Analysis</h3>
                                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                    {metal.name} is currently showing <strong style={{ color: 'white' }}>strong bullish signals</strong>.
                                    The 24h trend indicates significant volatility in the
                                    <span style={{ color: 'var(--primary)', margin: '0 4px' }}>${(metal.rate * 0.98).toFixed(2)} - ${(metal.rate * 1.02).toFixed(2)}</span>
                                    range. Analysts suggest accumulation.
                                </p>
                            </div>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume</div>
                                    <div style={{ fontWeight: 'bold' }}>$45.2M</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Updated</div>
                                    <div style={{ fontWeight: 'bold' }}>Just now</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="neon-card" style={{ height: '400px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <div>
                                <h3 style={{ marginBottom: '5px' }}>Live Performance</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time market data</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', background: '#150B25', padding: '5px', borderRadius: '12px' }}>
                                <span style={{ padding: '8px 16px', background: 'var(--primary)', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#3D2900', cursor: 'pointer' }}>1D</span>
                                <span style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>1W</span>
                                <span style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)' }}>1M</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.6} />
                                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#A098B5', fontSize: 12 }} minTickGap={30} />
                                    <YAxis hide={false} orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#A098B5', fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#150B25', border: 'none', borderRadius: '12px', color: 'white' }} itemStyle={{ color: '#fff' }} formatter={(val) => [`$${val.toLocaleString()}`, 'Price']} />
                                    <Area type="monotone" dataKey="price" stroke="#FDBA31" strokeWidth={3} fillOpacity={1} fill="url(#detailGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Right Column: Key Metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div className="neon-card" style={{ padding: '0', overflow: 'hidden', background: '#2D1B4E' }}>
                        <div style={{ padding: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontWeight: 'bold' }}>Key Statistics</span>
                            <Activity size={20} color="var(--primary)" />
                        </div>
                        <div style={{ padding: '25px' }}>
                            {[
                                { label: 'Market Cap', value: '$1.42B' },
                                { label: 'Circulating Supply', value: '18.5M' },
                                { label: 'All Time High', value: '$2,450.00' },
                                { label: 'Popularity', value: '#1 in Metals' },
                            ].map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                    <span style={{ fontWeight: 'bold' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="neon-card" style={{ flex: 1, backgroundImage: 'linear-gradient(135deg, #00D5A0 0%, #00AB80 100%)', color: '#0A2F25', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <Award size={40} style={{ marginBottom: '20px', opacity: 0.8 }} />
                        <h3 style={{ color: '#0A2F25', marginBottom: '10px' }}>Premium Asset</h3>
                        <p style={{ marginBottom: '25px', fontSize: '0.9rem', opacity: 0.8, maxWidth: '80%' }}>
                            This asset is verified and audited. Safe for high-volume trading.
                        </p>
                        <button style={{ background: 'white', color: '#00AB80', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Download Report</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
