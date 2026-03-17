import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DoctorMedicines() {
    const navigate = useNavigate();
    const [medicines,  setMedicines]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        api.get('/medicines')
            .then(r => setMedicines(r.data || []))
            .catch(() => setMedicines([]))
            .finally(() => setLoading(false));
    }, []);

    const types = ['ALL', ...Array.from(new Set(medicines.map(m => m.type).filter(Boolean)))];

    const filtered = medicines.filter(m => {
        const matchSearch = !search ||
            m.name?.toLowerCase().includes(search.toLowerCase()) ||
            m.type?.toLowerCase().includes(search.toLowerCase()) ||
            m.manufacturer?.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'ALL' || m.type === typeFilter;
        return matchSearch && matchType;
    });

    const typeColors = {
        TABLET:    { bg:'#EFF6FF', color:'#185FA5' },
        CAPSULE:   { bg:'#FDF4FF', color:'#7e22ce' },
        SYRUP:     { bg:'#FFF7ED', color:'#c2410c' },
        INJECTION: { bg:'#FEF2F2', color:'#dc2626' },
        CREAM:     { bg:'#F0FDF4', color:'#15803d' },
        DROPS:     { bg:'#F0F9FF', color:'#0369a1' },
        INHALER:   { bg:'#fef9c3', color:'#854d0e' },
    };
    const getTypeStyle = t => typeColors[t?.toUpperCase()] || { bg:'#f3f4f6', color:'#374151' };

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes stagger { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
                .med-card { animation:stagger .3s ease both; transition:box-shadow .15s,transform .15s; }
                .med-card:hover { box-shadow:0 8px 24px rgba(0,0,0,.1)!important; transform:translateY(-2px); }
                .search-inp:focus { border-color:#185FA5!important; outline:none; }
                .tab-btn { transition:all .15s; }
                .tab-btn:hover { background:#EFF6FF!important; color:#185FA5!important; border-color:#185FA5!important; }
            `}</style>

            {/* HERO */}
            <div style={{
                background:'linear-gradient(135deg,#0f3460 0%,#185FA5 100%)',
                padding:'20px 28px 24px', position:'relative', overflow:'hidden', flexShrink:0,
            }}>
                <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,.05)', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', bottom:'-50px', right:'120px', width:'130px', height:'130px', borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
                    <div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'4px' }}>My Account</div>
                        <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>💊 Medicines</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'3px' }}>
                            {loading ? 'Loading...' : `${medicines.length} medicines available in hospital`}
                        </div>
                    </div>
                    <button onClick={() => navigate('/doctor/dashboard')} style={{
                        padding:'8px 16px', borderRadius:'9px',
                        border:'1px solid rgba(255,255,255,.25)',
                        background:'rgba(255,255,255,.12)', color:'#fff',
                        fontSize:'12px', fontWeight:600, cursor:'pointer',
                    }}>← Dashboard</button>
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>

                {/* Search + Type filters */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', flexWrap:'wrap' }}>
                    <input className="search-inp" value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="🔍  Search name, type, manufacturer..."
                           style={{
                               maxWidth:'380px', width:'100%', border:'1px solid #e2e8f0',
                               borderRadius:'10px', padding:'10px 14px', fontSize:'12px',
                               background:'#fff', boxSizing:'border-box', transition:'border .15s',
                               boxShadow:'0 1px 3px rgba(0,0,0,.04)',
                               fontFamily:"'DM Sans','Outfit',sans-serif",
                           }}
                    />
                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {types.map(t => (
                            <button key={t} className="tab-btn" onClick={() => setTypeFilter(t)} style={{
                                padding:'6px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:600,
                                border:'1px solid', cursor:'pointer',
                                borderColor: typeFilter === t ? '#185FA5' : '#e2e8f0',
                                background:  typeFilter === t ? '#185FA5' : '#fff',
                                color:       typeFilter === t ? '#fff'    : '#6b7280',
                            }}>{t}</button>
                        ))}
                    </div>
                </div>

                {/* Summary chips */}
                {!loading && (
                    <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
                        {[
                            { label:'Total',   value: medicines.length, color:'#185FA5', bg:'#EFF6FF' },
                            { label:'Showing', value: filtered.length,  color:'#059669', bg:'#d1fae5' },
                            { label:'Types',   value: types.length - 1, color:'#7e22ce', bg:'#ede9fe' },
                        ].map(s => (
                            <div key={s.label} style={{ background:s.bg, borderRadius:'10px', padding:'7px 16px', display:'flex', alignItems:'center', gap:'7px' }}>
                                <span style={{ fontSize:'17px', fontWeight:800, color:s.color }}>{s.value}</span>
                                <span style={{ fontSize:'11px', color:s.color, fontWeight:500, opacity:.8 }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>
                        <div style={{ fontSize:'32px', marginBottom:'10px' }}>💊</div>
                        Loading medicines...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', padding:'60px 20px', textAlign:'center' }}>
                        <div style={{ fontSize:'40px', marginBottom:'10px' }}>🔍</div>
                        <div style={{ fontSize:'14px', fontWeight:700, color:'#374151', marginBottom:'5px' }}>
                            {search ? `No results for "${search}"` : 'No medicines found'}
                        </div>
                        <div style={{ fontSize:'12px', color:'#94a3b8' }}>Try a different search or filter</div>
                    </div>
                ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', animation:'fadeUp .3s ease' }}>
                        {filtered.map((med, idx) => {
                            const ts = getTypeStyle(med.type);
                            return (
                                <div key={med.id || idx} className="med-card" style={{
                                    background:'#fff', borderRadius:'14px',
                                    border:'1px solid #e8edf2',
                                    boxShadow:'0 1px 4px rgba(0,0,0,.04)',
                                    padding:'16px 18px',
                                    animationDelay:`${Math.min(idx * .04, .5)}s`,
                                }}>
                                    {/* top */}
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                                        <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:ts.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>💊</div>
                                        <span style={{ background:ts.bg, color:ts.color, padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:700 }}>
                                            {med.type || 'OTHER'}
                                        </span>
                                    </div>

                                    {/* name */}
                                    <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'3px', lineHeight:1.3 }}>
                                        {med.name}
                                    </div>
                                    {med.manufacturer && (
                                        <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'10px' }}>🏭 {med.manufacturer}</div>
                                    )}

                                    {/* details */}
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px', marginTop:'10px' }}>
                                        {med.price != null && (
                                            <div style={{ background:'#f8fafc', borderRadius:'8px', padding:'7px 10px' }}>
                                                <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>Price</div>
                                                <div style={{ fontSize:'13px', fontWeight:700, color:'#059669' }}>₹{med.price}</div>
                                            </div>
                                        )}
                                        {med.stock != null && (
                                            <div style={{ background:'#f8fafc', borderRadius:'8px', padding:'7px 10px' }}>
                                                <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>Stock</div>
                                                <div style={{ fontSize:'13px', fontWeight:700, color: med.stock > 10 ? '#0f172a' : '#dc2626' }}>
                                                    {med.stock > 0 ? med.stock : 'Out'}
                                                </div>
                                            </div>
                                        )}
                                        {med.dosage && (
                                            <div style={{ background:'#f8fafc', borderRadius:'8px', padding:'7px 10px' }}>
                                                <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>Dosage</div>
                                                <div style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>{med.dosage}</div>
                                            </div>
                                        )}
                                        {med.unit && (
                                            <div style={{ background:'#f8fafc', borderRadius:'8px', padding:'7px 10px' }}>
                                                <div style={{ fontSize:'9px', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>Unit</div>
                                                <div style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>{med.unit}</div>
                                            </div>
                                        )}
                                    </div>

                                    {med.description && (
                                        <div style={{ fontSize:'11px', color:'#6b7280', lineHeight:1.6, marginTop:'10px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                                            {med.description}
                                        </div>
                                    )}

                                    {/* footer */}
                                    <div style={{ marginTop:'12px', paddingTop:'10px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'10px', fontWeight:600, color: med.available !== false ? '#15803d' : '#dc2626' }}>
                                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: med.available !== false ? '#22c55e' : '#ef4444', display:'inline-block' }}/>
                                            {med.available !== false ? 'Available' : 'Unavailable'}
                                        </span>
                                        <span style={{ fontSize:'10px', color:'#94a3b8' }}>ID #{med.id}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}