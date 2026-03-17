import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DoctorPrescriptions() {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading,        setLoading]       = useState(true);
    const [search,         setSearch]        = useState('');

    useEffect(() => {
        api.get('/prescriptions/doctor')
            .then(r => setPrescriptions(r.data || []))
            .catch(() => setPrescriptions([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = prescriptions.filter(p =>
        !search ||
        p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        p.diagnosis?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                .prx-row:hover { background:#f0f7ff!important; cursor:pointer; }
                .search-inp:focus { border-color:#185FA5!important; outline:none; }
                .dl-btn:hover { background:#EFF6FF!important; }
            `}</style>

            {/* Hero */}
            <div style={{
                background:'linear-gradient(135deg,#0f3460 0%,#185FA5 100%)',
                padding:'20px 28px 24px', position:'relative', overflow:'hidden',
            }}>
                <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:'rgba(255,255,255,.05)' }}/>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
                    <div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'4px' }}>Patient Care</div>
                        <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>💊 Prescriptions</div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'3px' }}>
                            {loading ? 'Loading...' : `${prescriptions.length} prescriptions written`}
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
                           placeholder="🔍  Search patient or diagnosis..."
                           style={{
                               width:'100%', maxWidth:'420px', border:'1px solid #e2e8f0',
                               borderRadius:'10px', padding:'10px 14px', fontSize:'12px',
                               background:'#fff', boxSizing:'border-box', transition:'border .15s',
                               boxShadow:'0 1px 3px rgba(0,0,0,.04)',
                               fontFamily:"'DM Sans','Outfit',sans-serif",
                           }}
                    />
                </div>

                {/* Table */}
                <div style={{
                    background:'#fff', borderRadius:'16px',
                    border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)',
                    overflow:'hidden', animation:'fadeUp .3s ease',
                }}>
                    <div style={{
                        display:'grid', gridTemplateColumns:'2.2fr 2fr 1.1fr 1.3fr 1fr',
                        padding:'11px 20px', background:'#f8fafc',
                        borderBottom:'2px solid #f1f5f9',
                    }}>
                        {['Patient','Diagnosis','Medicines','Date','Download'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>
                            Loading prescriptions...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'70px 20px', textAlign:'center' }}>
                            <div style={{ fontSize:'44px', marginBottom:'12px' }}>💊</div>
                            <div style={{ fontSize:'15px', fontWeight:700, color:'#374151', marginBottom:'6px' }}>
                                {search ? `No results for "${search}"` : 'No prescriptions yet'}
                            </div>
                            <div style={{ fontSize:'12px', color:'#94a3b8' }}>
                                Prescriptions are created from appointment actions
                            </div>
                        </div>
                    ) : filtered.map((p, idx) => {
                        const ini = p.patientName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
                        const bgColors = ['#EFF6FF','#FDF4FF','#FFF7ED','#F0FDF4','#FEF2F2'];
                        const txColors = ['#185FA5','#7e22ce','#c2410c','#15803d','#dc2626'];
                        const medCount = p.medicines?.length ?? 0;
                        const dateStr = p.createdAt
                            ? new Date(p.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                            : '—';

                        async function downloadPdf(e) {
                            e.stopPropagation();
                            try {
                                const res = await api.get(`/prescriptions/${p.id}/download`, { responseType:'blob' });
                                const url = URL.createObjectURL(new Blob([res.data],{type:'application/pdf'}));
                                const a = document.createElement('a');
                                a.href = url; a.download = `prescription-${p.id}.pdf`; a.click();
                                URL.revokeObjectURL(url);
                            } catch { alert('Download failed'); }
                        }

                        return (
                            <div key={p.id || idx} className="prx-row" style={{
                                display:'grid', gridTemplateColumns:'2.2fr 2fr 1.1fr 1.3fr 1fr',
                                padding:'13px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center',
                            }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                    <div style={{
                                        width:'34px', height:'34px', borderRadius:'10px',
                                        background:bgColors[idx%bgColors.length],
                                        color:txColors[idx%txColors.length],
                                        fontSize:'11px', fontWeight:700,
                                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                                    }}>{ini}</div>
                                    <div>
                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{p.patientName || 'Unknown'}</div>
                                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>Rx #{p.id} · Appt #{p.appointmentId}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize:'12px', color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:'12px' }}>
                                    {p.diagnosis || '—'}
                                </div>
                                <div>
                                    <span style={{
                                        background: medCount > 0 ? '#EFF6FF' : '#f3f4f6',
                                        color: medCount > 0 ? '#185FA5' : '#6b7280',
                                        padding:'3px 10px', borderRadius:'20px',
                                        fontSize:'11px', fontWeight:700,
                                    }}>{medCount} {medCount===1?'med':'meds'}</span>
                                </div>
                                <div style={{ fontSize:'11px', color:'#6b7280', fontWeight:500 }}>{dateStr}</div>
                                <button className="dl-btn" onClick={downloadPdf} style={{
                                    padding:'6px 13px', borderRadius:'8px',
                                    border:'1px solid #e2e8f0', background:'#fff',
                                    color:'#185FA5', fontSize:'11px', fontWeight:600,
                                    cursor:'pointer', transition:'background .12s',
                                }}>⬇ PDF</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}