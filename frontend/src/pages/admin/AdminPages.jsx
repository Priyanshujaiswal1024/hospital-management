import { useEffect, useState } from 'react';
import api from '../../api/axios';

// ✅ Blood group labels
const bloodGroupLabels = {
    A_POSITIVE:'A+', A_NEGATIVE:'A−', B_POSITIVE:'B+', B_NEGATIVE:'B−',
    AB_POSITIVE:'AB+', AB_NEGATIVE:'AB−', O_POSITIVE:'O+', O_NEGATIVE:'O−',
};

const inp = {
    width:'100%', border:'1px solid #e2e8f0', borderRadius:'9px',
    padding:'9px 12px', fontSize:'12px', outline:'none',
    background:'#fafbfc', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
};
const lbl = { fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block' };
const COLORS = [['#EFF6FF','#2563eb'],['#F5F3FF','#7c3aed'],['#FFF7ED','#c2410c'],['#F0FDF4','#15803d'],['#FEF2F2','#dc2626'],['#F0F9FF','#0369a1']];
const HERO_STYLE = { background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'18px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 };
const BASE_STYLES = `
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
`;

// ✅ Safe departments helper
function safeDepts(departments) {
    if (!departments) return '—';
    const arr = [...departments].filter(
        d => typeof d === 'string' && !d.includes('@') && !d.includes('.')
    );
    return arr.length > 0 ? arr.join(', ') : '—';
}

// ── AdminPatients ─────────────────────────────────────────────────────────
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
    // ✅ Helper function add karo top mein:
    function formatPhone(phone) {
        if (!phone) return '—';
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        // If starts with 91 and 12 digits — remove 91
        if (digits.length === 12 && digits.startsWith('91')) {
            return '+91 ' + digits.slice(2);
        }
        // If 10 digits — add +91
        if (digits.length === 10) {
            return '+91 ' + digits;
        }
        return phone; // return as-is if unknown format
    }

    const filtered = patients.filter(p =>
        !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE_STYLES + `.prow:hover{background:#f8faff!important;}`}</style>

            <div style={HERO_STYLE}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>👥 Patients</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>
                        {loading ? 'Loading...' : `${patients.length} patients registered`}
                    </div>
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="🔍  Search patients..."
                       style={{ ...inp, maxWidth:'400px', boxShadow:'0 1px 3px rgba(0,0,0,.04)', marginBottom:'16px' }}/>

                <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>

                    {/* Header */}
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Patient','Email','Phone','Blood Group','Gender'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading patients...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>
                            <div style={{ fontSize:'40px', marginBottom:'10px' }}>👥</div>
                            {search ? `No results for "${search}"` : 'No patients yet'}
                        </div>
                    ) : filtered.map((p, idx) => {
                        const [bg, tc] = COLORS[idx % COLORS.length];
                        const ini = p.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';
                        return (
                            <div key={p.id} className="prow" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>

                                {/* Patient */}
                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                    <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:bg, color:tc, fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ini}</div>
                                    <div>
                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{p.name || '—'}</div>
                                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>ID #{p.id}</div>
                                    </div>
                                </div>

                                {/* ✅ Email */}
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {p.email || '—'}
                                </div>

                                {/* Phone */}
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {formatPhone(p.phone) || p.phoneNumber || '—'}
                                </div>

                                {/* ✅ Blood Group — human readable */}
                                <span style={{ background:'#fef2f2', color:'#dc2626', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:700, width:'fit-content' }}>
                                    🩸 {bloodGroupLabels[p.bloodGroup] || p.bloodGroup || '—'}
                                </span>

                                {/* Gender */}
                                <span style={{ background:'#f0f9ff', color:'#0369a1', padding:'3px 9px', borderRadius:'20px', fontSize:'11px', fontWeight:600, width:'fit-content' }}>
                                    {p.gender || '—'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── AdminAppointments ─────────────────────────────────────────────────────
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
        const mS = !search ||
            a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
            a.doctorName?.toLowerCase().includes(search.toLowerCase());
        return mF && mS;
    });

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE_STYLES + `.arow:hover{background:#f8faff!important;}`}</style>

            <div style={{ ...HERO_STYLE, justifyContent:'flex-start' }}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>📅 All Appointments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{appts.length} total appointments</div>
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="🔍  Search..."
                           style={{ ...inp, maxWidth:'280px', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}/>
                    {['ALL','BOOKED','CONFIRMED','COMPLETED','CANCELLED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding:'6px 16px', borderRadius:'20px', fontSize:'11px',
                            fontWeight:600, cursor:'pointer',
                            border: filter===f ? 'none' : '1px solid #e2e8f0',
                            background: filter===f ? '#2563eb' : '#fff',
                            color: filter===f ? '#fff' : '#6b7280',
                        }}>
                            {f === 'ALL' ? `All (${appts.length})` : f.charAt(0)+f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Patient','Doctor','Date & Time','Reason','Status'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No appointments found.</div>
                    ) : filtered.map(a => {
                        const sc = SC[a.status] || SC.BOOKED;
                        const dt = a.appointmentTime ? new Date(a.appointmentTime) : null;
                        return (
                            <div key={a.id} className="arow" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr 1fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                                <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{a.patientName || '—'}</div>
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {a.doctorName?.toLowerCase().startsWith('dr') ? a.doctorName : `Dr. ${a.doctorName || '—'}`}
                                </div>
                                <div>
                                    {dt ? (
                                        <>
                                            <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>
                                                {dt.toLocaleDateString('en-IN',{ day:'numeric', month:'short', year:'numeric' })}
                                            </div>
                                            <div style={{ fontSize:'10px', color:'#2563eb' }}>
                                                🕐 {dt.toLocaleTimeString('en-IN',{ hour:'2-digit', minute:'2-digit' })}
                                            </div>
                                        </>
                                    ) : '—'}
                                </div>
                                <div style={{ fontSize:'11px', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {a.reason || 'General Consultation'}
                                </div>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:sc.bg, color:sc.color, padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>
                                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:sc.dot }}/>{a.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── AdminDepartments ──────────────────────────────────────────────────────
export function AdminDepartments() {
    const [depts,   setDepts]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(false);
    const [form,    setForm]    = useState({ name:'' });
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');

    useEffect(() => {
        api.get('/public/departments')
            .then(r => setDepts(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    async function handleCreate() {
        setSaving(true); setError('');
        try {
            await api.post('/admin/departments', form);
            setSuccess('Department created!');
            setModal(false);
            const r = await api.get('/public/departments');
            setDepts(r.data || []);
            setTimeout(() => setSuccess(''), 3000);
        } catch(e) {
            setError(e.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
    }

    const bgC = ['#eff6ff','#f5f3ff','#fff7ed','#f0fdf4','#fef2f2','#f0f9ff'];
    const txC = ['#2563eb','#7c3aed','#c2410c','#15803d','#dc2626','#0369a1'];

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE_STYLES}</style>

            <div style={HERO_STYLE}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>🏥 Departments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{depts.length} departments</div>
                </div>
                <button onClick={() => { setModal(true); setForm({ name:'' }); setError(''); }}
                        style={{ padding:'9px 20px', borderRadius:'10px', border:'none', background:'#fff', color:'#2563eb', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                    + Add Department
                </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>
                )}

                {loading ? (
                    <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', animation:'fadeUp .3s ease' }}>
                        {depts.map((d, idx) => (
                            <div key={d.id} style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                                <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:bgC[idx%bgC.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'12px' }}>🏥</div>
                                <div style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'4px' }}>{d.name}</div>
                                <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'10px' }}>
                                    Head: {d.headDoctorName || '—'}
                                </div>
                                {d.doctorNames && [...d.doctorNames].length > 0 && (
                                    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                                        {[...d.doctorNames].slice(0,3).map(n => (
                                            <span key={n} style={{ background:bgC[idx%bgC.length], color:txC[idx%txC.length], padding:'2px 8px', borderRadius:'20px', fontSize:'10px', fontWeight:600 }}>
                                                Dr. {n}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
                    <div style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'380px', boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
                        <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a', marginBottom:'16px', fontFamily:"'Lora',serif" }}>🏥 Add Department</div>
                        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'8px', padding:'10px', marginBottom:'12px' }}>⚠️ {error}</div>}
                        <label style={lbl}>Department Name *</label>
                        <input style={{ ...inp, marginBottom:'16px' }} placeholder="e.g. Cardiology"
                               value={form.name} onChange={e => setForm({ name:e.target.value })}/>
                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={handleCreate} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                                {saving ? 'Creating...' : '✓ Create'}
                            </button>
                            <button onClick={() => setModal(false)} style={{ padding:'11px 20px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', cursor:'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── AdminMedicines ────────────────────────────────────────────────────────
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
            else await api.put(`/medicines/${modal.id}`, form);
            setSuccess(modal === 'add' ? 'Medicine added!' : 'Updated!');
            setModal(null); fetchMeds();
            setTimeout(() => setSuccess(''), 3000);
        } catch(e) {
            setError(e.response?.data?.message || 'Failed');
        } finally { setSaving(false); }
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

    const filtered = meds.filter(m =>
        !search || m.name?.toLowerCase().includes(search.toLowerCase())
    );

    const typeColors = {
        TABLET:    { bg:'#eff6ff', color:'#2563eb' },
        CAPSULE:   { bg:'#f5f3ff', color:'#7c3aed' },
        SYRUP:     { bg:'#fff7ed', color:'#c2410c' },
        INJECTION: { bg:'#fef2f2', color:'#dc2626' },
        CREAM:     { bg:'#f0fdf4', color:'#15803d' },
        DROPS:     { bg:'#f0f9ff', color:'#0369a1' },
        INHALER:   { bg:'#fef9c3', color:'#854d0e' },
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE_STYLES + `.mrow:hover{background:#f8faff!important;}`}</style>

            <div style={HERO_STYLE}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>💊 Medicines</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{meds.length} in inventory</div>
                </div>
                <button onClick={() => { setModal('add'); setForm({ name:'', type:'TABLET', price:'', stock:'', dosage:'', manufacturer:'' }); setError(''); }}
                        style={{ padding:'9px 20px', borderRadius:'10px', border:'none', background:'#fff', color:'#2563eb', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
                    + Add Medicine
                </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>}
                {error && !modal && !restock && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>⚠️ {error}</div>}

                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="🔍  Search medicines..."
                       style={{ ...inp, maxWidth:'380px', boxShadow:'0 1px 3px rgba(0,0,0,.04)', marginBottom:'16px' }}/>

                <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.6fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Medicine','Type','Price','Stock','Status','Actions'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No medicines found.</div>
                    ) : filtered.map(m => {
                        const tc = typeColors[m.type] || { bg:'#f3f4f6', color:'#374151' };
                        return (
                            <div key={m.id} className="mrow" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1.6fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                                <div>
                                    <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{m.name}</div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8' }}>{m.manufacturer || '—'}</div>
                                </div>
                                <span style={{ background:tc.bg, color:tc.color, padding:'2px 8px', borderRadius:'6px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>
                                    {m.type || '—'}
                                </span>
                                <div style={{ fontSize:'12px', fontWeight:600, color:'#059669' }}>₹{m.price || '—'}</div>
                                <div style={{ fontSize:'13px', fontWeight:700, color: m.stock<=5?'#dc2626':m.stock<=10?'#d97706':'#0f172a' }}>{m.stock}</div>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:m.lowStock?'#fef3c7':'#f0fdf4', color:m.lowStock?'#d97706':'#15803d', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>
                                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:m.lowStock?'#f59e0b':'#22c55e' }}/>
                                    {m.lowStock ? 'Low' : 'OK'}
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
            </div>

            {/* Add/Edit Modal */}
            {modal !== null && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
                    <div style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'460px', boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                            <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a', fontFamily:"'Lora',serif" }}>
                                {modal === 'add' ? '💊 Add Medicine' : '✏️ Edit Medicine'}
                            </div>
                            <button onClick={() => setModal(null)} style={{ width:'30px', height:'30px', borderRadius:'8px', border:'none', background:'#f1f5f9', color:'#64748b', fontSize:'16px', cursor:'pointer' }}>×</button>
                        </div>
                        {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'8px', padding:'10px', marginBottom:'12px' }}>⚠️ {error}</div>}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                            {[
                                ['name','Name *','text','Paracetamol'],
                                ['price','Price (₹)','number','500'],
                                ['stock','Stock *','number','100'],
                                ['dosage','Dosage','text','500mg'],
                                ['manufacturer','Manufacturer','text','ABC Pharma'],
                            ].map(([k,l,t,p]) => (
                                <div key={k}>
                                    <label style={lbl}>{l}</label>
                                    <input type={t} style={inp} placeholder={p}
                                           value={form[k] || ''}
                                           onChange={e => setForm(f => ({ ...f, [k]:e.target.value }))}/>
                                </div>
                            ))}
                            <div>
                                <label style={lbl}>Type</label>
                                <select style={inp} value={form.type || 'TABLET'}
                                        onChange={e => setForm(f => ({ ...f, type:e.target.value }))}>
                                    {['TABLET','CAPSULE','SYRUP','INJECTION','CREAM','DROPS','INHALER'].map(t => (
                                        <option key={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ display:'flex', gap:'8px', marginTop:'20px' }}>
                            <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
                                {saving ? 'Saving...' : modal==='add' ? '✓ Add' : '✓ Save'}
                            </button>
                            <button onClick={() => setModal(null)} style={{ padding:'12px 20px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', cursor:'pointer' }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restock Modal */}
            {restock && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}>
                    <div style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'340px', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,.2)', animation:'modalIn .2s ease' }}>
                        <div style={{ fontSize:'36px', marginBottom:'10px' }}>📦</div>
                        <div style={{ fontSize:'16px', fontWeight:700, color:'#0f172a', marginBottom:'6px' }}>Restock {restock.name}</div>
                        <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'16px' }}>Current stock: <strong>{restock.stock}</strong></p>
                        <input type="number" min="1" value={restockQty}
                               onChange={e => setRestockQty(Number(e.target.value))}
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

// ── AdminBills ────────────────────────────────────────────────────────────
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
        } catch(e) {
            setError(e.response?.data?.message || 'Failed');
            setTimeout(() => setError(''), 3000);
        }
    }

    async function downloadPdf(billId) {
        try {
            const res = await api.get(`/bills/${billId}/download`, { responseType:'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type:'application/pdf' }));
            const a = document.createElement('a');
            a.href = url; a.download = `invoice-${billId}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
    }

    const filtered = filter === 'ALL' ? bills : bills.filter(b => b.status === filter);
    const totalRev = bills.filter(b => b.status === 'PAID').reduce((s, b) => s + (b.totalAmount || 0), 0);
    const unpaid   = bills.filter(b => b.status === 'UNPAID').length;

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{BASE_STYLES + `.brow:hover{background:#f8faff!important;}`}</style>

            <div style={{ ...HERO_STYLE, justifyContent:'flex-start' }}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Management</div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>💰 Bills & Payments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{bills.length} total bills</div>
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>}
                {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>⚠️ {error}</div>}

                {/* Summary chips */}
                <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
                    {[
                        { label:'Total Revenue', value:`₹${totalRev.toLocaleString('en-IN')}`, color:'#059669', bg:'#f0fdf4' },
                        { label:'Unpaid Bills',  value:unpaid,                                   color:'#dc2626', bg:'#fef2f2' },
                        { label:'Total Bills',   value:bills.length,                             color:'#2563eb', bg:'#eff6ff' },
                    ].map(s => (
                        <div key={s.label} style={{ background:s.bg, borderRadius:'10px', padding:'8px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontSize:'18px', fontWeight:800, color:s.color }}>{s.value}</span>
                            <span style={{ fontSize:'11px', color:s.color, fontWeight:500, opacity:.8 }}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
                    {['ALL','PAID','UNPAID'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding:'6px 16px', borderRadius:'20px', fontSize:'11px',
                            fontWeight:600, cursor:'pointer',
                            border: filter===f ? 'none' : '1px solid #e2e8f0',
                            background: filter===f ? '#2563eb' : '#fff',
                            color: filter===f ? '#fff' : '#6b7280',
                        }}>{f}</button>
                    ))}
                </div>

                <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr 1.2fr', padding:'10px 20px', background:'#f8fafc', borderBottom:'2px solid #f1f5f9' }}>
                        {['Patient','Doctor','Fee','GST','Total','Status','Actions'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>Loading bills...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>No bills found.</div>
                    ) : filtered.map(b => (
                        <div key={b.id} className="brow" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 1fr 1fr 1.2fr', padding:'12px 20px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}>
                            <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{b.patientName || '—'}</div>
                            <div style={{ fontSize:'12px', color:'#475569' }}>
                                {b.doctorName?.toLowerCase().startsWith('dr') ? b.doctorName : `Dr. ${b.doctorName || '—'}`}
                            </div>
                            <div style={{ fontSize:'12px', color:'#374151' }}>₹{b.consultationFee || '—'}</div>
                            <div style={{ fontSize:'12px', color:'#374151' }}>₹{b.gstAmount?.toFixed(0) || '—'}</div>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'#059669' }}>₹{b.totalAmount?.toFixed(0) || '—'}</div>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:b.status==='PAID'?'#f0fdf4':'#fef3c7', color:b.status==='PAID'?'#15803d':'#92400e', padding:'3px 9px', borderRadius:'20px', fontSize:'10px', fontWeight:700, width:'fit-content' }}>
                                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:b.status==='PAID'?'#22c55e':'#f59e0b' }}/>
                                {b.status}
                            </span>
                            <div style={{ display:'flex', gap:'4px' }}>
                                {b.status === 'UNPAID' ? (
                                    <button onClick={() => markPaid(b.id)} style={{ padding:'5px 10px', borderRadius:'7px', border:'none', background:'#059669', color:'#fff', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>✓ Paid</button>
                                ) : (
                                    <span style={{ fontSize:'10px', color:'#94a3b8', fontStyle:'italic' }}>Paid ✓</span>
                                )}
                                <button onClick={() => downloadPdf(b.id)} style={{ padding:'5px 10px', borderRadius:'7px', border:'1px solid #e2e8f0', background:'#fff', color:'#2563eb', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>⬇ PDF</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}