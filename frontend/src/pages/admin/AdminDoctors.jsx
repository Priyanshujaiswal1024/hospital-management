import { useEffect, useState } from 'react';
import api from '../../api/axios';

const DEPARTMENTS = []; // loaded from API

const inp = {
    width:'100%', border:'1px solid #e2e8f0', borderRadius:'9px',
    padding:'9px 12px', fontSize:'12px', outline:'none',
    background:'#fafbfc', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
};
const lbl = {
    fontSize:'11px', fontWeight:600, color:'#374151',
    marginBottom:'4px', display:'block',
};
const errStyle = {
    fontSize:'10px', color:'#ef4444', marginTop:'3px', display:'block',
};

function validate(form, isAdd) {
    const e = {};
    if (!form.name?.trim())         e.name = 'Full name is required';
    if (!form.email?.trim())        e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = 'Enter a valid email address';
    if (isAdd && !form.password)    e.password = 'Password is required';
    else if (form.password && form.password.length < 6)
        e.password = 'Password must be at least 6 characters';
    if (form.consultationFee && isNaN(Number(form.consultationFee)))
        e.consultationFee = 'Must be a valid number';
    if (form.consultationFee && Number(form.consultationFee) < 0)
        e.consultationFee = 'Fee cannot be negative';
    if (form.experienceYears && isNaN(Number(form.experienceYears)))
        e.experienceYears = 'Must be a valid number';
    if (form.phoneNumber && !/^[6-9]\d{9}$/.test(form.phoneNumber.replace(/[\s\-+]/g,'')))
        e.phoneNumber = 'Enter a valid 10-digit mobile number';
    return e;
}

export default function AdminDoctors() {
    const [doctors,    setDoctors]    = useState([]);
    const [depts,      setDepts]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [modal,      setModal]      = useState(null);
    const [deleting,   setDeleting]   = useState(null);
    const [form,       setForm]       = useState({});
    const [fieldErrors,setFieldErrors]= useState({});
    const [saving,     setSaving]     = useState(false);
    const [error,      setError]      = useState('');
    const [success,    setSuccess]    = useState('');

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const [d, de] = await Promise.all([
                api.get('/admin/doctors', { params:{ page:0, size:100 } }),
                api.get('/public/departments'),
            ]);
            setDoctors(d.data || []);
            setDepts(de.data || []);
        } catch {}
        finally { setLoading(false); }
    }

    function openAdd() {
        setForm({
            name:'', email:'', password:'',
            specialization:'', consultationFee:'',
            experienceYears:'', departmentId:'',
            phoneNumber:'', profileImageUrl:'', bio:'',
        });
        setFieldErrors({});
        setModal('add');
        setError('');
    }

    function openEdit(doc) {
        setForm({ ...doc, password:'' });
        setFieldErrors({});
        setModal(doc);
        setError('');
    }

    // Auto-copy email → username when email changes
    function handleEmailChange(val) {
        setForm(p => ({ ...p, email: val, username: val }));
        setFieldErrors(e => { const n={...e}; delete n.email; return n; });
    }

    async function handleSave() {
        const isAdd = modal === 'add';
        const errs = validate(form, isAdd);
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }
        setSaving(true); setError(''); setFieldErrors({});
        try {
            const payload = {
                ...form,
                username: form.email, // email = username
                consultationFee: form.consultationFee ? Number(form.consultationFee) : null,
                experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
            };
            if (!isAdd && !form.password) delete payload.password;

            if (isAdd) {
                await api.post('/admin/doctors', payload);
                setSuccess('Doctor created successfully!');
            } else {
                await api.put(`/admin/doctors/${modal.id}`, payload);
                setSuccess('Doctor updated successfully!');
            }
            setModal(null);
            fetchAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Operation failed. Please try again.');
        } finally { setSaving(false); }
    }

    async function handleDelete(id) {
        try {
            await api.delete(`/admin/doctors/${id}`);
            setSuccess('Doctor deleted!');
            setDeleting(null);
            fetchAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Delete failed');
        }
    }

    function safeName(name) {
        if (!name) return '—';
        return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
    }

    function safeDepts(departments) {
        if (!departments) return '—';
        const arr = [...departments].filter(
            d => typeof d === 'string' && !d.includes('@') && !d.includes('.')
        );
        return arr.length > 0 ? arr.join(', ') : '—';
    }

    const filtered = doctors.filter(d =>
        !search ||
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase())
    );

    function FieldErr({ k }) {
        return fieldErrors[k]
            ? <span style={errStyle}>⚠ {fieldErrors[k]}</span>
            : null;
    }

    function inpStyle(key) {
        return {
            ...inp,
            border: fieldErrors[key] ? '1px solid #fca5a5' : '1px solid #e2e8f0',
            background: fieldErrors[key] ? '#fff5f5' : '#fafbfc',
        };
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%',
            background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .drow:hover{background:#f8faff!important;}
                .inp-f:focus{border-color:#2563eb!important;outline:none;}
            `}</style>

            {/* Hero */}
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)',
                padding:'18px 28px', display:'flex', alignItems:'center',
                justifyContent:'space-between', flexShrink:0 }}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600,
                        letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>
                        Management
                    </div>
                    <div style={{ fontSize:'20px', fontWeight:700, color:'#fff',
                        fontFamily:"'Lora',serif" }}>🩺 Doctors</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>
                        {loading ? 'Loading...' : `${doctors.length} doctors registered`}
                    </div>
                </div>
                <button onClick={openAdd} style={{ padding:'9px 20px', borderRadius:'10px',
                    border:'none', background:'#fff', color:'#2563eb',
                    fontSize:'12px', fontWeight:700, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:'6px' }}>
                    + Add Doctor
                </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>
                {success && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0',
                        color:'#166534', fontSize:'12px', borderRadius:'9px',
                        padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>
                )}
                {error && !modal && (
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca',
                        color:'#dc2626', fontSize:'12px', borderRadius:'9px',
                        padding:'10px 14px', marginBottom:'14px' }}>⚠️ {error}</div>
                )}

                <input value={search} onChange={e => setSearch(e.target.value)}
                       placeholder="🔍  Search by name, specialization, email..."
                       style={{ ...inp, maxWidth:'400px', marginBottom:'16px',
                           boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}/>

                {/* Table */}
                <div style={{ background:'#fff', borderRadius:'16px',
                    border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)',
                    overflow:'hidden', animation:'fadeUp .3s ease' }}>
                    <div style={{ display:'grid',
                        gridTemplateColumns:'2.5fr 1.5fr 1fr 1fr 1fr 1.2fr',
                        padding:'10px 20px', background:'#f8fafc',
                        borderBottom:'2px solid #f1f5f9' }}>
                        {['Doctor','Specialization','Fee','Exp','Department','Actions'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700,
                                color:'#94a3b8', textTransform:'uppercase',
                                letterSpacing:'.07em' }}>{h}</div>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8' }}>
                            Loading doctors...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'60px 20px', textAlign:'center' }}>
                            <div style={{ fontSize:'40px', marginBottom:'10px' }}>🩺</div>
                            <div style={{ fontSize:'14px', fontWeight:700, color:'#374151' }}>
                                {search ? `No results for "${search}"` : 'No doctors yet'}
                            </div>
                        </div>
                    ) : filtered.map((doc, idx) => {
                        const colors = [
                            ['#EFF6FF','#2563eb'],['#F5F3FF','#7c3aed'],
                            ['#FFF7ED','#c2410c'],['#F0FDF4','#15803d'],
                            ['#FEF2F2','#dc2626'],
                        ];
                        const [bg, tc] = colors[idx % colors.length];
                        const ini = doc.name?.split(' ')
                            .map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';

                        return (
                            <div key={doc.id} className="drow" style={{
                                display:'grid',
                                gridTemplateColumns:'2.5fr 1.5fr 1fr 1fr 1fr 1.2fr',
                                padding:'12px 20px', borderBottom:'1px solid #f8fafc',
                                alignItems:'center', transition:'background .12s',
                            }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                    {doc.profileImageUrl ? (
                                        <img src={doc.profileImageUrl} alt=""
                                             style={{ width:'34px', height:'34px',
                                                 borderRadius:'10px', objectFit:'cover', flexShrink:0 }}/>
                                    ) : (
                                        <div style={{ width:'34px', height:'34px',
                                            borderRadius:'10px', background:bg, color:tc,
                                            fontSize:'11px', fontWeight:700,
                                            display:'flex', alignItems:'center',
                                            justifyContent:'center', flexShrink:0 }}>
                                            {ini}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>
                                            {safeName(doc.name)}
                                        </div>
                                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                            {doc.email}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {doc.specialization || '—'}
                                </div>
                                <div style={{ fontSize:'12px', fontWeight:600, color:'#059669' }}>
                                    {doc.consultationFee ? `₹${doc.consultationFee}` : '—'}
                                </div>
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {doc.experienceYears ? `${doc.experienceYears} yrs` : '—'}
                                </div>
                                <div style={{ fontSize:'11px', color:'#374151' }}>
                                    {safeDepts(doc.departments)}
                                </div>
                                <div style={{ display:'flex', gap:'5px' }}>
                                    <button onClick={() => openEdit(doc)} style={{
                                        padding:'5px 10px', borderRadius:'7px', border:'none',
                                        background:'#eff6ff', color:'#2563eb',
                                        fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => setDeleting(doc)} style={{
                                        padding:'5px 10px', borderRadius:'7px', border:'none',
                                        background:'#fef2f2', color:'#dc2626',
                                        fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ADD/EDIT MODAL */}
            {modal !== null && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    zIndex:1000, backdropFilter:'blur(4px)', padding:'20px' }}>
                    <div style={{ background:'#fff', borderRadius:'20px', padding:'28px',
                        width:'560px', maxHeight:'90vh', overflowY:'auto',
                        boxShadow:'0 20px 60px rgba(0,0,0,.2)',
                        animation:'modalIn .2s ease' }}>

                        <div style={{ display:'flex', justifyContent:'space-between',
                            alignItems:'center', marginBottom:'20px' }}>
                            <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a',
                                fontFamily:"'Lora',serif" }}>
                                {modal === 'add' ? '➕ Add New Doctor'
                                    : `✏️ Edit ${safeName(modal.name)}`}
                            </div>
                            <button onClick={() => { setModal(null); setFieldErrors({}); }} style={{
                                width:'30px', height:'30px', borderRadius:'8px',
                                border:'none', background:'#f1f5f9', color:'#64748b',
                                fontSize:'16px', cursor:'pointer', display:'flex',
                                alignItems:'center', justifyContent:'center' }}>×</button>
                        </div>

                        {error && (
                            <div style={{ background:'#fef2f2', border:'1px solid #fecaca',
                                color:'#dc2626', fontSize:'12px', borderRadius:'8px',
                                padding:'10px', marginBottom:'14px' }}>⚠️ {error}</div>
                        )}

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>

                            {/* Full Name */}
                            <div>
                                <label style={lbl}>Full Name *</label>
                                <input className="inp-f" style={inpStyle('name')}
                                       placeholder="Priya Mehta"
                                       value={form.name || ''}
                                       onChange={e => {
                                           setForm(p => ({ ...p, name: e.target.value }));
                                           setFieldErrors(er => { const n={...er}; delete n.name; return n; });
                                       }}/>
                                <FieldErr k="name" />
                            </div>

                            {/* Email — auto-copies to username */}
                            <div>
                                <label style={lbl}>
                                    Email *
                                    <span style={{ marginLeft:'6px', background:'#eff6ff', color:'#2563eb', padding:'1px 7px', borderRadius:'10px', fontSize:'9px', fontWeight:700 }}>
                                        also used as login
                                    </span>
                                </label>
                                <input className="inp-f" type="email" style={inpStyle('email')}
                                       placeholder="doctor@hospital.com"
                                       value={form.email || ''}
                                       onChange={e => handleEmailChange(e.target.value)}/>
                                <FieldErr k="email" />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={lbl}>
                                    {modal === 'add' ? 'Password *' : 'New Password'}
                                </label>
                                <input className="inp-f" type="password" style={inpStyle('password')}
                                       placeholder={modal === 'add' ? '••••••••' : 'Leave blank to keep current'}
                                       value={form.password || ''}
                                       onChange={e => {
                                           setForm(p => ({ ...p, password: e.target.value }));
                                           setFieldErrors(er => { const n={...er}; delete n.password; return n; });
                                       }}/>
                                <FieldErr k="password" />
                            </div>

                            {/* Phone */}
                            <div>
                                <label style={lbl}>Phone Number</label>
                                <input className="inp-f" type="tel" style={inpStyle('phoneNumber')}
                                       placeholder="9876543210"
                                       value={form.phoneNumber || ''}
                                       onChange={e => {
                                           setForm(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g,'') }));
                                           setFieldErrors(er => { const n={...er}; delete n.phoneNumber; return n; });
                                       }}
                                       maxLength={10}/>
                                <FieldErr k="phoneNumber" />
                            </div>

                            {/* Specialization — free text */}
                            <div>
                                <label style={lbl}>Specialization</label>
                                <input className="inp-f" style={inp}
                                       placeholder="e.g. Interventional Cardiology"
                                       value={form.specialization || ''}
                                       onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}/>
                                <span style={{ fontSize:'10px', color:'#94a3b8', marginTop:'2px', display:'block' }}>
                                    Doctor's specific area of expertise
                                </span>
                            </div>

                            {/* Department — dropdown from API */}
                            <div>
                                <label style={lbl}>Department</label>
                                <select className="inp-f" style={inp}
                                        value={form.departmentId || ''}
                                        onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                                    <option value="">Select department...</option>
                                    {depts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <span style={{ fontSize:'10px', color:'#94a3b8', marginTop:'2px', display:'block' }}>
                                    Hospital unit the doctor belongs to
                                </span>
                            </div>

                            {/* Consultation Fee */}
                            <div>
                                <label style={lbl}>Consultation Fee (₹)</label>
                                <input className="inp-f" type="number" style={inpStyle('consultationFee')}
                                       placeholder="500" min="0"
                                       value={form.consultationFee || ''}
                                       onChange={e => {
                                           setForm(p => ({ ...p, consultationFee: e.target.value }));
                                           setFieldErrors(er => { const n={...er}; delete n.consultationFee; return n; });
                                       }}/>
                                <FieldErr k="consultationFee" />
                            </div>

                            {/* Experience */}
                            <div>
                                <label style={lbl}>Experience (years)</label>
                                <input className="inp-f" type="number" style={inpStyle('experienceYears')}
                                       placeholder="5" min="0" max="60"
                                       value={form.experienceYears || ''}
                                       onChange={e => {
                                           setForm(p => ({ ...p, experienceYears: e.target.value }));
                                           setFieldErrors(er => { const n={...er}; delete n.experienceYears; return n; });
                                       }}/>
                                <FieldErr k="experienceYears" />
                            </div>

                            {/* Profile Image URL */}
                            <div style={{ gridColumn:'1 / -1' }}>
                                <label style={lbl}>Profile Image URL (optional)</label>
                                <input className="inp-f" style={inp}
                                       placeholder="https://example.com/photo.jpg"
                                       value={form.profileImageUrl || ''}
                                       onChange={e => setForm(p => ({ ...p, profileImageUrl: e.target.value }))}/>
                            </div>

                            {/* Bio */}
                            <div style={{ gridColumn:'1 / -1' }}>
                                <label style={lbl}>Bio (optional)</label>
                                <textarea className="inp-f"
                                          style={{ ...inp, resize:'none', minHeight:'72px', lineHeight:1.6 }}
                                          placeholder="Short description about the doctor's expertise and approach..."
                                          value={form.bio || ''}
                                          onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}/>
                            </div>
                        </div>

                        {/* Info note */}
                        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe',
                            borderRadius:'9px', padding:'10px 12px',
                            fontSize:'11px', color:'#1e40af',
                            marginTop:'12px', lineHeight:1.6 }}>
                            ℹ️ The email address will be used as the doctor's login username.
                            Share the email and password with the doctor securely.
                        </div>

                        <div style={{ display:'flex', gap:'8px', marginTop:'16px' }}>
                            <button onClick={handleSave} disabled={saving} style={{
                                flex:1, padding:'12px', borderRadius:'10px', border:'none',
                                background: saving ? '#9ca3af'
                                    : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                                color:'#fff', fontSize:'13px', fontWeight:700,
                                cursor: saving ? 'not-allowed' : 'pointer' }}>
                                {saving ? 'Saving...'
                                    : modal==='add' ? '✓ Create Doctor' : '✓ Save Changes'}
                            </button>
                            <button onClick={() => { setModal(null); setFieldErrors({}); }} style={{
                                padding:'12px 20px', borderRadius:'10px',
                                border:'1px solid #e2e8f0', background:'#fff',
                                color:'#374151', fontSize:'13px', fontWeight:600,
                                cursor:'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            {deleting && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    zIndex:1000, backdropFilter:'blur(4px)' }}>
                    <div style={{ background:'#fff', borderRadius:'16px', padding:'28px',
                        maxWidth:'380px', width:'100%', textAlign:'center',
                        boxShadow:'0 20px 60px rgba(0,0,0,.2)',
                        animation:'modalIn .2s ease' }}>
                        <div style={{ fontSize:'40px', marginBottom:'12px' }}>🗑️</div>
                        <div style={{ fontSize:'16px', fontWeight:700, color:'#0f172a', marginBottom:'8px' }}>
                            Delete {safeName(deleting.name)}?
                        </div>
                        <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'20px', lineHeight:1.7 }}>
                            This will permanently delete the doctor and all their data. This cannot be undone.
                        </p>
                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={() => handleDelete(deleting.id)} style={{
                                flex:1, padding:'11px', borderRadius:'10px', border:'none',
                                background:'#dc2626', color:'#fff',
                                fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                                Yes, Delete
                            </button>
                            <button onClick={() => setDeleting(null)} style={{
                                flex:1, padding:'11px', borderRadius:'10px',
                                border:'1px solid #e2e8f0', background:'#fff',
                                color:'#374151', fontSize:'13px', fontWeight:600,
                                cursor:'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}