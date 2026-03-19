import { useEffect, useState } from 'react';
import { downloadPdf } from '../../utils/downloadPdf';
import api from '../../api/axios';

export default function Prescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [downloading,   setDownloading]   = useState(null);
    const [search,        setSearch]        = useState('');

    useEffect(() => { fetchPrescriptions(); }, []);

    async function fetchPrescriptions() {
        try {
            const res = await api.get('/patient/prescriptions');
            setPrescriptions(res.data || []);
        } catch { setPrescriptions([]); }
        finally  { setLoading(false); }
    }

    async function handleDownload(id) {
        try {
            setDownloading(id);
            await downloadPdf(`/prescriptions/${id}/download`, `prescription-${id}.pdf`);
        } catch (err) { console.log('Download error:', err); }
        finally { setDownloading(null); }
    }

    const filtered = prescriptions.filter(rx =>
        !search ||
        rx.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
        rx.medicines?.some(m => m.medicineName?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes rx-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

                /* Desktop table */
                .rx-table-wrap { display:block; }
                .rx-cards-wrap  { display:none; }

                /* Responsive */
                @media(max-width:768px) {
                    .rx-table-wrap { display:none !important; }
                    .rx-cards-wrap  { display:flex !important; flex-direction:column; gap:12px; }
                }
                @media(max-width:480px) {
                    .rx-hero-pad { padding:16px !important; }
                    .rx-body-pad { padding:14px !important; }
                    .rx-search   { max-width:100% !important; }
                }

                .rx-row { transition:background .15s; }
                .rx-row:hover { background:#f0fdf4 !important; }
                .rx-dl-btn:hover { background:#f0fdf4 !important; border-color:#1D9E75 !important; color:#0a4f3a !important; }
                .rx-card-item { background:#fff; border:1px solid #e8edf2; border-radius:14px; padding:16px; box-shadow:0 1px 6px rgba(0,0,0,.05); animation:rx-fadein .3s ease; transition:box-shadow .2s; }
                .rx-card-item:hover { box-shadow:0 4px 16px rgba(10,79,58,.1); }
            `}</style>

            {/* ── HERO ── */}
            <div className="rx-hero-pad" style={{
                background:'linear-gradient(135deg,#062e22 0%,#0a4f3a 45%,#1D9E75 100%)',
                padding:'20px 28px 22px', flexShrink:0, position:'relative', overflow:'hidden',
            }}>
                <div style={{ position:'absolute', top:-50, right:-40, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }}/>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.45)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:5 }}>Patient Portal</div>
                <div style={{ fontSize:20, fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif", marginBottom:4 }}>
                    💊 My Prescriptions
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.55)' }}>
                    {loading ? 'Loading...' : `${prescriptions.length} prescription${prescriptions.length !== 1 ? 's' : ''} from your doctors`}
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="rx-body-pad" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>

                {/* Search */}
                <input
                    className="rx-search"
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍  Search by doctor or medicine..."
                    style={{ width:'100%', maxWidth:400, border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 14px', fontSize:12, background:'#fff', outline:'none', fontFamily:"'DM Sans',sans-serif", marginBottom:16, boxSizing:'border-box', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}
                />

                {loading ? (
                    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8edf2', padding:'60px 20px', textAlign:'center', color:'#94a3b8' }}>
                        <div style={{ fontSize:28, marginBottom:10 }}>⏳</div>
                        <div style={{ fontSize:13 }}>Loading prescriptions...</div>
                    </div>

                ) : filtered.length === 0 ? (
                    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8edf2', padding:'70px 20px', textAlign:'center' }}>
                        <div style={{ fontSize:44, marginBottom:12 }}>💊</div>
                        <div style={{ fontSize:15, fontWeight:700, color:'#374151', marginBottom:6 }}>
                            {search ? `No results for "${search}"` : 'No prescriptions yet'}
                        </div>
                        <div style={{ fontSize:12, color:'#94a3b8' }}>Your doctor's prescriptions will appear here</div>
                    </div>

                ) : (
                    <>
                        {/* ── DESKTOP TABLE ── */}
                        <div className="rx-table-wrap" style={{ background:'#fff', borderRadius:16, border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>
                            {/* Table header */}
                            <div style={{ display:'grid', gridTemplateColumns:'2fr 1.4fr 1.2fr 1fr 1fr 0.8fr 0.9fr', padding:'11px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                                {['Medicine','Doctor','Frequency','Duration','Date','Status','Download'].map(h => (
                                    <div key={h} style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                                ))}
                            </div>

                            {filtered.map((rx, idx) => {
                                const dateStr = rx.createdAt
                                    ? new Date(rx.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                                    : '—';
                                const medNames  = rx.medicines?.map(m => m.medicineName).filter(Boolean) || [];
                                const freqs     = rx.medicines?.map(m => m.frequency || '—')             || [];
                                const durations = rx.medicines?.map(m => m.durationDays ? `${m.durationDays}d` : '—') || [];

                                return (
                                    <div key={rx.id} className="rx-row"
                                         style={{ display:'grid', gridTemplateColumns:'2fr 1.4fr 1.2fr 1fr 1fr 0.8fr 0.9fr', padding:'13px 20px', borderBottom: idx < filtered.length-1 ? '1px solid #f8fafc' : 'none', alignItems:'center' }}>

                                        {/* Medicine */}
                                        <div>
                                            {medNames.length > 0
                                                ? medNames.map((name,i) => (
                                                    <div key={i} style={{ fontSize:12, fontWeight:600, color:'#0f172a', marginBottom:i<medNames.length-1?3:0 }}>
                                                        {name}
                                                    </div>
                                                ))
                                                : <span style={{ color:'#cbd5e1', fontSize:12 }}>—</span>}
                                        </div>

                                        {/* Doctor */}
                                        <div style={{ fontSize:12, fontWeight:500, color:'#374151' }}>
                                            {rx.doctorName || '—'}
                                        </div>

                                        {/* Frequency */}
                                        <div>
                                            {freqs.length > 0
                                                ? freqs.map((f,i) => <div key={i} style={{ fontSize:11, color:'#6b7280', marginBottom:i<freqs.length-1?3:0 }}>{f}</div>)
                                                : <span style={{ color:'#cbd5e1', fontSize:11 }}>—</span>}
                                        </div>

                                        {/* Duration */}
                                        <div>
                                            {durations.length > 0
                                                ? durations.map((d,i) => <div key={i} style={{ fontSize:11, color:'#6b7280', marginBottom:i<durations.length-1?3:0 }}>{d}</div>)
                                                : <span style={{ color:'#cbd5e1', fontSize:11 }}>—</span>}
                                        </div>

                                        {/* Date */}
                                        <div style={{ fontSize:11, color:'#6b7280' }}>{dateStr}</div>

                                        {/* Status */}
                                        <div>
                                            <span style={{
                                                background: rx.active ? '#dcfce7' : '#f3f4f6',
                                                color:      rx.active ? '#15803d' : '#6b7280',
                                                padding:'3px 10px', borderRadius:20,
                                                fontSize:10, fontWeight:700,
                                            }}>
                                                {rx.active ? '✓ Active' : 'Done'}
                                            </span>
                                        </div>

                                        {/* Download */}
                                        <button className="rx-dl-btn"
                                                onClick={() => handleDownload(rx.id)}
                                                disabled={downloading === rx.id}
                                                style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap' }}>
                                            {downloading === rx.id ? '⏳' : '⬇ PDF'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── MOBILE CARDS ── */}
                        <div className="rx-cards-wrap">
                            {filtered.map((rx) => {
                                const dateStr = rx.createdAt
                                    ? new Date(rx.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})
                                    : '—';

                                return (
                                    <div key={rx.id} className="rx-card-item">

                                        {/* Top row: doctor + status + download */}
                                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                                            <div>
                                                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>Doctor</div>
                                                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{rx.doctorName || '—'}</div>
                                                <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>{dateStr}</div>
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                                                <span style={{
                                                    background: rx.active ? '#dcfce7' : '#f3f4f6',
                                                    color:      rx.active ? '#15803d' : '#6b7280',
                                                    padding:'3px 10px', borderRadius:20,
                                                    fontSize:10, fontWeight:700,
                                                }}>
                                                    {rx.active ? '✓ Active' : 'Done'}
                                                </span>
                                                <button
                                                    onClick={() => handleDownload(rx.id)}
                                                    disabled={downloading === rx.id}
                                                    style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#0a4f3a', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                                                    {downloading === rx.id ? '⏳' : '⬇ PDF'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div style={{ borderTop:'1px solid #f1f5f9', marginBottom:12 }}/>

                                        {/* Medicines list */}
                                        {rx.medicines?.length > 0 ? (
                                            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                                                {rx.medicines.map((m, i) => (
                                                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, background:'#f8fafc', borderRadius:10, padding:'10px 12px' }}>
                                                        <div>
                                                            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>Medicine</div>
                                                            <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{m.medicineName || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>Frequency</div>
                                                            <div style={{ fontSize:11, color:'#374151', fontWeight:500 }}>{m.frequency || '—'}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>Duration</div>
                                                            <div style={{ fontSize:11, color:'#374151', fontWeight:500 }}>{m.durationDays ? `${m.durationDays} days` : '—'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>No medicines listed</div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}