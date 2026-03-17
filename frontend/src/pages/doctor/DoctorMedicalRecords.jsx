import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function Add() {
    const navigate = useNavigate();
    const [records,  setRecords]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');

    useEffect(() => {
        api.get('/medical-records/doctor')
            .then(r => setRecords(r.data || []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = records.filter(r =>
        !search ||
        r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosis?.toLowerCase().includes(search.toLowerCase())
    );

    const bgColors = ['#EFF6FF','#FDF4FF','#FFF7ED','#F0FDF4','#FEF2F2','#F0F9FF'];
    const txColors = ['#185FA5','#7e22ce','#c2410c','#15803d','#dc2626','#0369a1'];

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes stagger { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .rec-card { animation: stagger .3s ease both; transition: box-shadow .15s, transform .15s; }
                .rec-card:hover { box-shadow:0 8px 24px rgba(0,0,0,.1)!important; transform:translateY(-2px); cursor:pointer; }
                .search-inp:focus { border-color:#185FA5!important; outline:none; }
            `}</style>

            {/* Hero */}
            <div style={{
                background:'linear-gradient(135deg,#0f3460 0%,#185FA5 100%)',
                padding:'20px 28px 24px', position:'relative', overflow:'hidden',
            }}>
                <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
                <div style={{ position:'absolute', bottom:'-50px', right:'100px', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(255,255,255,.04)' }}/>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
                    <div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'4px' }}>Patient Care</div>
                        <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>📋 Medical Records</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'3px' }}>
                            {loading ? 'Loading...' : `${records.length} records created`}
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
                {/* Search */}
                <div style={{ marginBottom:'16px' }}>
                    <input className="search-inp" value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="🔍  Search by patient name or diagnosis..."
                           style={{
                               width:'100%', maxWidth:'420px', border:'1px solid #e2e8f0',
                               borderRadius:'10px', padding:'10px 14px', fontSize:'12px',
                               background:'#fff', boxSizing:'border-box', transition:'border .15s',
                               boxShadow:'0 1px 3px rgba(0,0,0,.04)',
                               fontFamily:"'DM Sans','Outfit',sans-serif",
                           }}
                    />
                </div>

                {loading ? (
                    <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>
                        Loading records...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        background:'#fff', borderRadius:'16px',
                        border:'1px solid #e8edf2', padding:'70px 20px', textAlign:'center',
                    }}>
                        <div style={{ fontSize:'44px', marginBottom:'12px' }}>📋</div>
                        <div style={{ fontSize:'15px', fontWeight:700, color:'#374151', marginBottom:'6px' }}>
                            {search ? `No results for "${search}"` : 'No medical records yet'}
                        </div>
                        <div style={{ fontSize:'12px', color:'#94a3b8' }}>
                            Records are created from appointment actions
                        </div>
                    </div>
                ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', animation:'fadeUp .3s ease' }}>
                        {filtered.map((rec, idx) => {
                            const ini = rec.patientName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
                            const bg = bgColors[idx % bgColors.length];
                            const tx = txColors[idx % txColors.length];
                            const dateStr = rec.visitDate
                                ? new Date(rec.visitDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                                : '—';

                            return (
                                <div key={rec.id || idx} className="rec-card" style={{
                                    background:'#fff', borderRadius:'16px',
                                    border:'1px solid #e8edf2',
                                    boxShadow:'0 1px 4px rgba(0,0,0,.04)',
                                    padding:'18px',
                                    animationDelay: `${idx * .05}s`,
                                }}>
                                    {/* Patient row */}
                                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                                        <div style={{
                                            width:'40px', height:'40px', borderRadius:'12px',
                                            background:bg, color:tx, fontSize:'13px', fontWeight:700,
                                            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                                        }}>{ini}</div>
                                        <div>
                                            <div style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>
                                                {rec.patientName || 'Unknown Patient'}
                                            </div>
                                            <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px' }}>
                                                Appt #{rec.appointmentId} · {dateStr}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Diagnosis */}
                                    <div style={{
                                        background:'#f8fafc', borderRadius:'10px',
                                        padding:'10px 12px', marginBottom:'10px',
                                    }}>
                                        <div style={{ fontSize:'9px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'4px' }}>
                                            Diagnosis
                                        </div>
                                        <div style={{ fontSize:'12px', color:'#374151', fontWeight:600 }}>
                                            {rec.diagnosis || '—'}
                                        </div>
                                    </div>

                                    {/* Notes preview */}
                                    {rec.notes && (
                                        <div style={{
                                            fontSize:'11px', color:'#6b7280', lineHeight:1.6,
                                            marginBottom:'12px',
                                            overflow:'hidden', display:'-webkit-box',
                                            WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                                        }}>
                                            {rec.notes}
                                        </div>
                                    )}

                                    {/* Footer row */}
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto' }}>
                                        {rec.prescriptionId ? (
                                            <span style={{
                                                background:'#EFF6FF', color:'#185FA5',
                                                padding:'3px 9px', borderRadius:'20px',
                                                fontSize:'10px', fontWeight:600,
                                                display:'inline-flex', alignItems:'center', gap:'3px',
                                            }}>💊 Rx #{rec.prescriptionId}</span>
                                        ) : (
                                            <span style={{ fontSize:'10px', color:'#94a3b8' }}>No prescription</span>
                                        )}
                                        <span style={{ fontSize:'10px', color:'#94a3b8', fontWeight:500 }}>
                                            MR-{String(rec.id).padStart(4,'0')}
                                        </span>
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