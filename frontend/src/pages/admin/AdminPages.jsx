import { useEffect, useState } from 'react';
import api from '../../api/axios';

const bloodGroupLabels = { A_POSITIVE:'A+', A_NEGATIVE:'A−', B_POSITIVE:'B+', B_NEGATIVE:'B−', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB−', O_POSITIVE:'O+', O_NEGATIVE:'O−' };

const inp = { width:'100%', border:'1px solid #e2e8f0', borderRadius:'9px', padding:'9px 12px', fontSize:'12px', outline:'none', background:'#fafbfc', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box' };
const lbl = { fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block' };
const COLORS = [['#EFF6FF','#2563eb'],['#F5F3FF','#7c3aed'],['#FFF7ED','#c2410c'],['#F0FDF4','#15803d'],['#FEF2F2','#dc2626'],['#F0F9FF','#0369a1']];
const HERO = { background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'18px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, gap:12, flexWrap:'wrap' };

const BASE = `
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');

    /* ── Responsive table/card switching ── */
    .rsp-table { display:block; }
    .rsp-cards { display:none; }

    @media (max-width:768px) {
        .rsp-table { display:none!important; }
        .rsp-cards { display:flex!important; flex-direction:column; gap:10px; }
        .hero-pad   { padding:14px 16px!important; }
        .body-pad   { padding:14px 16px!important; }
        .filter-row { flex-wrap:wrap!important; gap:6px!important; }
        .filter-row button { font-size:10px!important; padding:5px 10px!important; }
        .summary-row{ flex-wrap:wrap!important; }
        .modal-inner{ padding:20px!important; width:calc(100vw - 32px)!important; max-width:100%!important; }
        .modal-grid { grid-template-columns:1fr!important; }
        .dept-grid  { grid-template-columns:1fr!important; }
    }
    @media (min-width:769px) and (max-width:1024px) {
        .dept-grid { grid-template-columns:repeat(2,1fr)!important; }
    }
`;

function safeDepts(departments) {
    if (!departments) return '—';
    const arr = [...departments].filter(d => typeof d === 'string' && !d.includes('@') && !d.includes('.'));
    return arr.length > 0 ? arr.join(', ') : '—';
}

function formatPhone(phone) {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return '+91 ' + digits.slice(2);
    if (digits.length === 10) return '+91 ' + digits;
    return phone;
}

// ── Universal Info Card (mobile) ──────────────────────────────────
function InfoCard({ children, onClick }) {
    return (
        <div onClick={onClick}
             style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf2', padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,.04)', cursor: onClick ? 'pointer' : 'default', transition:'background .12s' }}
             onMouseEnter={e => { if (onClick) e.currentTarget.style.background = '#f8faff'; }}
             onMouseLeave={e => { if (onClick) e.currentTarget.style.background = '#fff'; }}>
            {children}
        </div>
    );
}

function Badge({ bg, color, children }) {
    return <span style={{ background:bg, color, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, display:'inline-flex', alignItems:'center', gap:4 }}>{children}</span>;
}

// ══════════════════════════════════════════════════════
// PATIENTS
// ══════════════════════════════════════════════════════
export function AdminPatients() {
    const [patients, setPatients] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');

    useEffect(() => {
        api.get('/admin/patients', { params:{ page:0, size:200 } })
            .then(r => setPatients(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = patients.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE + `.prow:hover{background:#f8faff!important;}`}</style>

            <div className="hero-pad" style={HERO}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>👥 Patients</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{loading ? 'Loading...' : `${patients.length} patients registered`}</div>
                </div>
            </div>

            <div className="body-pad" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search patients..."
                       style={{ ...inp, maxWidth:'400px', boxShadow:'0 1px 3px rgba(0,0,0,.04)', marginBottom:'16px' }}/>

                {/* Desktop Table */}
                <div className="rsp-table" style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Patient','Email','Phone','Blood Group','Gender'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>
                    {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading patients...</div>
                        : filtered.length === 0 ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>{search ? `No results for "${search}"` : 'No patients yet'}</div>
                            : filtered.map((p, idx) => {
                                const [bg, tc] = COLORS[idx % COLORS.length];
                                const ini = p.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';
                                return (
                                    <div key={p.id} className="prow" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                            <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:bg, color:tc, fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ini}</div>
                                            <div>
                                                <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{p.name || '—'}</div>
                                                <div style={{ fontSize:'10px', color:'#94a3b8' }}>ID #{p.id}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize:'12px', color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.email || '—'}</div>
                                        <div style={{ fontSize:'12px', color:'#475569' }}>{formatPhone(p.phone) || p.phoneNumber || '—'}</div>
                                        <Badge bg="#fef2f2" color="#dc2626">🩸 {bloodGroupLabels[p.bloodGroup] || p.bloodGroup || '—'}</Badge>
                                        <Badge bg="#f0f9ff" color="#0369a1">{p.gender || '—'}</Badge>
                                    </div>
                                );
                            })}
                </div>

                {/* Mobile Cards */}
                <div className="rsp-cards">
                    {loading ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                        : filtered.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>No patients found.</div>
                            : filtered.map((p, idx) => {
                                const [bg, tc] = COLORS[idx % COLORS.length];
                                const ini = p.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';
                                return (
                                    <InfoCard key={p.id}>
                                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                                            <div style={{ width:42, height:42, borderRadius:12, background:bg, color:tc, fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ini}</div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{p.name || '—'}</div>
                                                <div style={{ fontSize:11, color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.email || '—'}</div>
                                            </div>
                                            <Badge bg="#fef2f2" color="#dc2626">🩸 {bloodGroupLabels[p.bloodGroup] || p.bloodGroup || '—'}</Badge>
                                        </div>
                                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                                            <span style={{ fontSize:11, color:'#475569' }}>📞 {formatPhone(p.phone) || '—'}</span>
                                            <span style={{ fontSize:11, color:'#94a3b8' }}>·</span>
                                            <Badge bg="#f0f9ff" color="#0369a1">{p.gender || '—'}</Badge>
                                            <span style={{ fontSize:10, color:'#94a3b8' }}>ID #{p.id}</span>
                                        </div>
                                    </InfoCard>
                                );
                            })}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════════════════
export function AdminAppointments() {
    const [appts,   setAppts]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter,  setFilter]  = useState('ALL');
    const [search,  setSearch]  = useState('');

    useEffect(() => {
        api.get('/admin/appointments', { params:{ page:0, size:200 } })
            .then(r => setAppts(r.data?.content || r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const SC = {
        BOOKED:    { bg:'#fef9c3', color:'#854d0e', dot:'#eab308' },
        CONFIRMED: { bg:'#dcfce7', color:'#14532d', dot:'#22c55e' },
        COMPLETED: { bg:'#f1f5f9', color:'#374151', dot:'#94a3b8' },
        CANCELLED: { bg:'#fee2e2', color:'#7f1d1d', dot:'#ef4444' },
    };

    const filtered = appts.filter(a => {
        const mF = filter === 'ALL' || a.status === filter;
        const mS = !search || a.patientName?.toLowerCase().includes(search.toLowerCase()) || a.doctorName?.toLowerCase().includes(search.toLowerCase());
        return mF && mS;
    });

    function fmtDr(name) { return name?.toLowerCase().startsWith('dr') ? name : `Dr. ${name || '—'}`; }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE + `.arow:hover{background:#f8faff!important;}`}</style>

            <div className="hero-pad" style={{ ...HERO, justifyContent:'flex-start' }}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>📅 All Appointments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{appts.length} total appointments</div>
                </div>
            </div>

            <div className="body-pad" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                <div className="filter-row" style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search..."
                           style={{ ...inp, maxWidth:'280px', flex:1, minWidth:'140px', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}/>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {['ALL','BOOKED','CONFIRMED','COMPLETED','CANCELLED'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 14px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer', border: filter===f ? 'none' : '1px solid #e2e8f0', background: filter===f ? '#2563eb' : '#fff', color: filter===f ? '#fff' : '#6b7280', whiteSpace:'nowrap' }}>
                                {f === 'ALL' ? `All (${appts.length})` : f.charAt(0)+f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="rsp-table" style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Patient','Doctor','Date & Time','Reason','Status'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>
                    {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                        : filtered.length === 0 ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No appointments found.</div>
                            : filtered.map(a => {
                                const sc = SC[a.status] || SC.BOOKED;
                                const dt = a.appointmentTime ? new Date(a.appointmentTime) : null;
                                return (
                                    <div key={a.id} className="arow" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{a.patientName || '—'}</div>
                                        <div style={{ fontSize:'12px', color:'#475569' }}>{fmtDr(a.doctorName)}</div>
                                        <div>
                                            {dt ? (<>
                                                <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                                                <div style={{ fontSize:'10px', color:'#2563eb' }}>🕐 {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                                            </>) : '—'}
                                        </div>
                                        <div style={{ fontSize:'11px', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.reason || 'General Consultation'}</div>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:sc.bg, color:sc.color, padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>
                                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:sc.dot }}/>{a.status}
                                </span>
                                    </div>
                                );
                            })}
                </div>

                {/* Mobile Cards */}
                <div className="rsp-cards">
                    {loading ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                        : filtered.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>No appointments found.</div>
                            : filtered.map(a => {
                                const sc = SC[a.status] || SC.BOOKED;
                                const dt = a.appointmentTime ? new Date(a.appointmentTime) : null;
                                return (
                                    <InfoCard key={a.id}>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                                            <div>
                                                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:2 }}>{a.patientName || '—'}</div>
                                                <div style={{ fontSize:11, color:'#64748b' }}>{fmtDr(a.doctorName)}</div>
                                            </div>
                                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:sc.bg, color:sc.color, padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, flexShrink:0 }}>
                                        <span style={{ width:5, height:5, borderRadius:'50%', background:sc.dot }}/>{a.status}
                                    </span>
                                        </div>
                                        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                                            {dt && <span style={{ fontSize:11, color:'#2563eb', fontWeight:600 }}>📅 {dt.toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>}
                                            <span style={{ fontSize:11, color:'#94a3b8' }}>{a.reason || 'General Consultation'}</span>
                                        </div>
                                    </InfoCard>
                                );
                            })}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════
// DEPARTMENTS
// ══════════════════════════════════════════════════════
export function AdminDepartments() {
    const [depts,   setDepts]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(false);
    const [form,    setForm]    = useState({ name:'' });
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    useEffect(() => {
        api.get('/public/departments').then(r => setDepts(r.data || [])).catch(() => {}).finally(() => setLoading(false));
    }, []);

    async function handleCreate() {
        if (!form.name.trim()) { setError('Department name is required'); return; }
        setSaving(true); setError('');
        try {
            await api.post('/admin/departments', form);
            setSuccess('Department created!');
            setModal(false);
            const r = await api.get('/public/departments');
            setDepts(r.data || []);
            setTimeout(() => setSuccess(''), 3000);
        } catch(e) { setError(e.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    }

    const bgC = ['#eff6ff','#f5f3ff','#fff7ed','#f0fdf4','#fef2f2','#f0f9ff'];
    const txC = ['#2563eb','#7c3aed','#c2410c','#15803d','#dc2626','#0369a1'];

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE}</style>

            <div className="hero-pad" style={HERO}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>🏥 Departments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{depts.length} departments</div>
                </div>
                <button onClick={() => { setModal(true); setForm({ name:'' }); setError(''); }}
                        style={{ padding:'9px 20px', borderRadius:'10px', border:'none', background:'#fff', color:'#2563eb', fontSize:'12px', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                    + Add Department
                </button>
            </div>

            <div className="body-pad" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>}
                {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading...</div> : (
                    <div className="dept-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', animation:'fadeUp .3s ease' }}>
                        {depts.map((d, idx) => (
                            <div key={d.id} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                                <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:bgC[idx%bgC.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'12px' }}>🏥</div>
                                <div style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'4px' }}>{d.name}</div>
                                <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'10px' }}>Head: {d.headDoctorName || '—'}</div>
                                {d.doctorNames && [...d.doctorNames].length > 0 && (
                                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                                        {[...d.doctorNames].slice(0,3).map(n => (
                                            <span key={n} style={{ background:bgC[idx%bgC.length], color:txC[idx%txC.length], padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:600 }}>Dr. {n}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'16px' }}>
                    <div className="modal-inner" style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'380px', maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
                        <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a', marginBottom:'16px', fontFamily:"'Lora',serif" }}>🏥 Add Department</div>
                        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'8px', padding:'10px', marginBottom:'12px' }}>⚠️ {error}</div>}
                        <label style={lbl}>Department Name *</label>
                        <input style={{ ...inp, marginBottom:'16px' }} placeholder="e.g. Cardiology" value={form.name} onChange={e => { setForm({ name:e.target.value }); setError(''); }}/>
                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={handleCreate} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                                {saving ? 'Creating...' : '✓ Create'}
                            </button>
                            <button onClick={() => setModal(false)} style={{ padding:'11px 20px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════
// MEDICINES
// ══════════════════════════════════════════════════════
export function AdminMedicines() {
    const [meds,       setMeds]       = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [modal,      setModal]      = useState(null);
    const [form,       setForm]       = useState({});
    const [saving,     setSaving]     = useState(false);
    const [success,    setSuccess]    = useState('');
    const [error,      setError]      = useState('');
    const [restock,    setRestock]    = useState(null);
    const [restockQty, setRestockQty] = useState(10);

    useEffect(() => { fetchMeds(); }, []);

    async function fetchMeds() {
        setLoading(true);
        try { const r = await api.get('/medicines'); setMeds(r.data || []); }
        catch {} finally { setLoading(false); }
    }

    async function handleSave() {
        setSaving(true); setError('');
        try {
            if (modal === 'add') await api.post('/medicines', form);
            else                  await api.put(`/medicines/${modal.id}`, form);
            setSuccess(modal === 'add' ? 'Medicine added!' : 'Updated!');
            setModal(null); fetchMeds();
            setTimeout(() => setSuccess(''), 3000);
        } catch(e) { setError(e.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    }

    async function handleRestock() {
        try {
            await api.patch(`/medicines/${restock.id}/restock`, null, { params:{ quantity:restockQty } });
            setSuccess(`Restocked by ${restockQty}!`);
            setRestock(null); fetchMeds();
            setTimeout(() => setSuccess(''), 3000);
        } catch(e) { setError(e.response?.data?.message || 'Restock failed'); }
    }

    async function handleDelete(id) {
        try { await api.delete(`/medicines/${id}`); fetchMeds(); }
        catch(e) { setError(e.response?.data?.message || 'Delete failed'); }
    }

    const filtered = meds.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()));

    const typeColors = {
        TABLET:{ bg:'#eff6ff',color:'#2563eb' }, CAPSULE:{ bg:'#f5f3ff',color:'#7c3aed' },
        SYRUP:{ bg:'#fff7ed',color:'#c2410c' }, INJECTION:{ bg:'#fef2f2',color:'#dc2626' },
        CREAM:{ bg:'#f0fdf4',color:'#15803d' }, DROPS:{ bg:'#f0f9ff',color:'#0369a1' },
        INHALER:{ bg:'#fef9c3',color:'#854d0e' },
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE + `.mrow:hover{background:#f8faff!important;}`}</style>

            <div className="hero-pad" style={HERO}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>💊 Medicines</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{meds.length} in inventory</div>
                </div>
                <button onClick={() => { setModal('add'); setForm({ name:'', type:'TABLET', price:'', stock:'', dosage:'', manufacturer:'' }); setError(''); }}
                        style={{ padding:'9px 20px', borderRadius:'10px', border:'none', background:'#fff', color:'#2563eb', fontSize:'12px', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                    + Add Medicine
                </button>
            </div>

            <div className="body-pad" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>}
                {error && !modal && !restock && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>⚠️ {error}</div>}

                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search medicines..."
                       style={{ ...inp, maxWidth:'380px', boxShadow:'0 1px 3px rgba(0,0,0,.04)', marginBottom:'16px' }}/>

                {/* Desktop Table */}
                <div className="rsp-table" style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.6fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Medicine','Type','Price','Stock','Status','Actions'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>
                    {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                        : filtered.length === 0 ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No medicines found.</div>
                            : filtered.map(m => {
                                const tc = typeColors[m.type] || { bg:'#f3f4f6', color:'#374151' };
                                return (
                                    <div key={m.id} className="mrow" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.6fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                                        <div>
                                            <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{m.name}</div>
                                            <div style={{ fontSize:'10px', color:'#94a3b8' }}>{m.manufacturer || '—'}</div>
                                        </div>
                                        <span style={{ background:tc.bg, color:tc.color, padding:'2px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>{m.type || '—'}</span>
                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#059669' }}>₹{m.price || '—'}</div>
                                        <div style={{ fontSize:'13px', fontWeight:700, color: m.stock<=5?'#dc2626':m.stock<=10?'#d97706':'#0f172a' }}>{m.stock}</div>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:m.lowStock?'#fef3c7':'#f0fdf4', color:m.lowStock?'#d97706':'#15803d', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>
                                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:m.lowStock?'#f59e0b':'#22c55e' }}/>{m.lowStock ? 'Low' : 'OK'}
                                </span>
                                        <div style={{ display:'flex', gap:'4px' }}>
                                            <button onClick={() => { setModal(m); setForm({...m}); setError(''); }} style={{ padding:'4px 8px', borderRadius:'6px', border:'none', background:'#eff6ff', color:'#2563eb', fontSize:'10px', fontWeight:600, cursor:'pointer' }}>✏️</button>
                                            <button onClick={() => { setRestock(m); setRestockQty(10); }} style={{ padding:'4px 8px', borderRadius:'6px', border:'none', background:'#f0fdf4', color:'#15803d', fontSize:'10px', fontWeight:600, cursor:'pointer' }}>📦</button>
                                            <button onClick={() => handleDelete(m.id)} style={{ padding:'4px 8px', borderRadius:'6px', border:'none', background:'#fef2f2', color:'#dc2626', fontSize:'10px', fontWeight:600, cursor:'pointer' }}>🗑️</button>
                                        </div>
                                    </div>
                                );
                            })}
                </div>

                {/* Mobile Cards */}
                <div className="rsp-cards">
                    {loading ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                        : filtered.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>No medicines found.</div>
                            : filtered.map(m => {
                                const tc = typeColors[m.type] || { bg:'#f3f4f6', color:'#374151' };
                                return (
                                    <InfoCard key={m.id}>
                                        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                                            <div style={{ width:40, height:40, borderRadius:10, background:tc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💊</div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:2 }}>{m.name}</div>
                                                <div style={{ fontSize:11, color:'#94a3b8' }}>{m.manufacturer || '—'}</div>
                                            </div>
                                            <span style={{ background:m.lowStock?'#fef3c7':'#f0fdf4', color:m.lowStock?'#d97706':'#15803d', padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>
                                        {m.lowStock ? '⚠ Low' : '✅ OK'}
                                    </span>
                                        </div>
                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
                                            <div style={{ background:'#f8fafc', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                                                <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Price</div>
                                                <div style={{ fontSize:13, fontWeight:700, color:'#059669' }}>₹{m.price||'—'}</div>
                                            </div>
                                            <div style={{ background:'#f8fafc', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                                                <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Stock</div>
                                                <div style={{ fontSize:13, fontWeight:700, color:m.stock<=5?'#dc2626':m.stock<=10?'#d97706':'#0f172a' }}>{m.stock}</div>
                                            </div>
                                            <div style={{ background:tc.bg, borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                                                <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Type</div>
                                                <div style={{ fontSize:11, fontWeight:700, color:tc.color }}>{m.type}</div>
                                            </div>
                                        </div>
                                        <div style={{ display:'flex', gap:8 }}>
                                            <button onClick={() => { setModal(m); setForm({...m}); setError(''); }} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#eff6ff', color:'#2563eb', fontSize:12, fontWeight:600, cursor:'pointer' }}>✏️ Edit</button>
                                            <button onClick={() => { setRestock(m); setRestockQty(10); }} style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:'#f0fdf4', color:'#15803d', fontSize:12, fontWeight:600, cursor:'pointer' }}>📦 Restock</button>
                                            <button onClick={() => handleDelete(m.id)} style={{ padding:'8px 12px', borderRadius:8, border:'none', background:'#fef2f2', color:'#dc2626', fontSize:12, fontWeight:600, cursor:'pointer' }}>🗑️</button>
                                        </div>
                                    </InfoCard>
                                );
                            })}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {modal !== null && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'16px', overflowY:'auto' }}>
                    <div className="modal-inner" style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'460px', maxWidth:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                            <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a', fontFamily:"'Lora',serif" }}>{modal === 'add' ? '💊 Add Medicine' : '✏️ Edit Medicine'}</div>
                            <button onClick={() => setModal(null)} style={{ width:'30px', height:'30px', borderRadius:'8px', border:'none', background:'#f1f5f9', color:'#64748b', fontSize:'16px', cursor:'pointer' }}>×</button>
                        </div>
                        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'8px', padding:'10px', marginBottom:'12px' }}>⚠️ {error}</div>}
                        <div className="modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                            {[['name','Name *','text','Paracetamol'],['price','Price (₹)','number','500'],['stock','Stock *','number','100'],['dosage','Dosage','text','500mg'],['manufacturer','Manufacturer','text','ABC Pharma']].map(([k,l,t,p]) => (
                                <div key={k}>
                                    <label style={lbl}>{l}</label>
                                    <input type={t} style={inp} placeholder={p} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]:e.target.value }))}/>
                                </div>
                            ))}
                            <div>
                                <label style={lbl}>Type</label>
                                <select style={inp} value={form.type || 'TABLET'} onChange={e => setForm(f => ({ ...f, type:e.target.value }))}>
                                    {['TABLET','CAPSULE','SYRUP','INJECTION','CREAM','DROPS','INHALER'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:'8px', marginTop:'20px' }}>
                            <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                                {saving ? 'Saving...' : modal === 'add' ? '✓ Add' : '✓ Save'}
                            </button>
                            <button onClick={() => setModal(null)} style={{ padding:'12px 20px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {restock && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'16px' }}>
                    <div className="modal-inner" style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'340px', maxWidth:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
                        <div style={{ fontSize:'36px', marginBottom:'10px' }}>📦</div>
                        <div style={{ fontSize:'16px', fontWeight:700, color:'#0f172a', marginBottom:'6px' }}>Restock {restock.name}</div>
                        <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'16px' }}>Current stock: <strong>{restock.stock}</strong></p>
                        <input type="number" min="1" value={restockQty} onChange={e => setRestockQty(Number(e.target.value))}
                               style={{ width:'100%', border:'1px solid #e2e8f0', borderRadius:'9px', padding:'10px', fontSize:'14px', fontWeight:600, textAlign:'center', outline:'none', marginBottom:'16px', boxSizing:'border-box' }}/>
                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={handleRestock} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'none', background:'#059669', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>✓ Restock</button>
                            <button onClick={() => setRestock(null)} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════
// BILLS
// ══════════════════════════════════════════════════════
export function AdminBills() {
    const [bills,   setBills]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter,  setFilter]  = useState('ALL');
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    useEffect(() => {
        api.get('/admin/bills', { params:{ page:0, size:200 } })
            .then(r => setBills(r.data?.content || r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    async function markPaid(id) {
        try {
            await api.patch(`/bills/${id}/mark-paid`);
            setSuccess('Bill marked as PAID!');
            setBills(prev => prev.map(b => b.id === id ? { ...b, status:'PAID' } : b));
            setTimeout(() => setSuccess(''), 3000);
        } catch(e) { setError(e.response?.data?.message || 'Failed'); setTimeout(() => setError(''), 3000); }
    }

    async function downloadPdf(billId) {
        try {
            const res = await api.get(`/bills/${billId}/download`, { responseType:'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
            const a = document.createElement('a'); a.href = url; a.download = `invoice-${billId}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
    }

    const filtered  = filter === 'ALL' ? bills : bills.filter(b => b.status === filter);
    const totalRev  = bills.filter(b => b.status === 'PAID').reduce((s, b) => s + (b.totalAmount || 0), 0);
    const unpaid    = bills.filter(b => b.status === 'UNPAID').length;
    function fmtDr(name) { return name?.toLowerCase().startsWith('dr') ? name : `Dr. ${name || '—'}`; }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE + `.brow:hover{background:#f8faff!important;}`}</style>

            <div className="hero-pad" style={{ ...HERO, justifyContent:'flex-start' }}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>💰 Bills & Payments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{bills.length} total bills</div>
                </div>
            </div>

            <div className="body-pad" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>}
                {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>⚠️ {error}</div>}

                {/* Summary */}
                <div className="summary-row" style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
                    {[
                        { label:'Total Revenue', value:`₹${totalRev.toLocaleString('en-IN')}`, color:'#059669', bg:'#f0fdf4' },
                        { label:'Unpaid Bills',  value:unpaid,     color:'#dc2626', bg:'#fef2f2' },
                        { label:'Total Bills',   value:bills.length, color:'#2563eb', bg:'#eff6ff' },
                    ].map(s => (
                        <div key={s.label} style={{ background:s.bg, borderRadius:'10px', padding:'8px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontSize:'18px', fontWeight:800, color:s.color }}>{s.value}</span>
                            <span style={{ fontSize:'11px', color:s.color, fontWeight:500, opacity:.8 }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="filter-row" style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
                    {['ALL','PAID','UNPAID'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 16px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer', border: filter===f ? 'none' : '1px solid #e2e8f0', background: filter===f ? '#2563eb' : '#fff', color: filter===f ? '#fff' : '#6b7280' }}>{f}</button>
                    ))}
                </div>

                {/* Desktop Table */}
                <div className="rsp-table" style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr 1.2fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Patient','Doctor','Fee','GST','Total','Status','Actions'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>
                    {loading ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading bills...</div>
                        : filtered.length === 0 ? <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No bills found.</div>
                            : filtered.map(b => (
                                <div key={b.id} className="brow" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr 1.2fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                                    <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{b.patientName || '—'}</div>
                                    <div style={{ fontSize:'12px', color:'#475569' }}>{fmtDr(b.doctorName)}</div>
                                    <div style={{ fontSize:'12px', color:'#374151' }}>₹{b.consultationFee || '—'}</div>
                                    <div style={{ fontSize:'12px', color:'#374151' }}>₹{b.gstAmount?.toFixed(0) || '—'}</div>
                                    <div style={{ fontSize:'13px', fontWeight:700, color:'#059669' }}>₹{b.totalAmount?.toFixed(0) || '—'}</div>
                                    <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:b.status==='PAID'?'#f0fdf4':'#fef3c7', color:b.status==='PAID'?'#15803d':'#92400e', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:700, width:'fit-content' }}>
                                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:b.status==='PAID'?'#22c55e':'#f59e0b' }}/>{b.status}
                            </span>
                                    <div style={{ display:'flex', gap:'4px' }}>
                                        {b.status === 'UNPAID'
                                            ? <button onClick={() => markPaid(b.id)} style={{ padding:'5px 10px', borderRadius:'7px', border:'none', background:'#059669', color:'#fff', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>✓ Paid</button>
                                            : <span style={{ fontSize:'10px', color:'#94a3b8', fontStyle:'italic' }}>Paid ✓</span>
                                        }
                                        <button onClick={() => downloadPdf(b.id)} style={{ padding:'5px 10px', borderRadius:'7px', border:'1px solid #e2e8f0', background:'#fff', color:'#2563eb', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>⬇ PDF</button>
                                    </div>
                                </div>
                            ))}
                </div>

                {/* Mobile Cards */}
                <div className="rsp-cards">
                    {loading ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                        : filtered.length === 0 ? <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>No bills found.</div>
                            : filtered.map(b => (
                                <InfoCard key={b.id}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:2 }}>{b.patientName || '—'}</div>
                                            <div style={{ fontSize:11, color:'#64748b' }}>{fmtDr(b.doctorName)}</div>
                                        </div>
                                        <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:b.status==='PAID'?'#f0fdf4':'#fef3c7', color:b.status==='PAID'?'#15803d':'#92400e', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, flexShrink:0 }}>
                                    <span style={{ width:5, height:5, borderRadius:'50%', background:b.status==='PAID'?'#22c55e':'#f59e0b' }}/>{b.status}
                                </span>
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                                        <div style={{ background:'#f8fafc', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                                            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Fee</div>
                                            <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>₹{b.consultationFee||'—'}</div>
                                        </div>
                                        <div style={{ background:'#f8fafc', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                                            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>GST</div>
                                            <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>₹{b.gstAmount?.toFixed(0)||'—'}</div>
                                        </div>
                                        <div style={{ background:'#f0fdf4', borderRadius:8, padding:'7px 10px', textAlign:'center' }}>
                                            <div style={{ fontSize:9, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Total</div>
                                            <div style={{ fontSize:13, fontWeight:700, color:'#059669' }}>₹{b.totalAmount?.toFixed(0)||'—'}</div>
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', gap:8 }}>
                                        {b.status === 'UNPAID'
                                            ? <button onClick={() => markPaid(b.id)} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#059669', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>✓ Mark Paid</button>
                                            : <div style={{ flex:1, textAlign:'center', padding:'9px', fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Paid ✓</div>
                                        }
                                        <button onClick={() => downloadPdf(b.id)} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#2563eb', fontSize:12, fontWeight:600, cursor:'pointer' }}>⬇ Download PDF</button>
                                    </div>
                                </InfoCard>
                            ))}
                </div>
            </div>
        </div>
    );
}