import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthContext';

// ── Validation ────────────────────────────────────────────────────
function validateAdminForm(form) {
    const errs = {};

    // Email
    if (!form.email.trim())
        errs.email = 'Email is required';
    else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(form.email.trim()))
        errs.email = 'Enter a valid email address';

    // Password
    if (!form.password)
        errs.password = 'Password is required';
    else if (form.password.length < 6)
        errs.password = 'Password must be at least 6 characters';
    else if (form.password.length > 128)
        errs.password = 'Password is too long';
    else if (/^\s+|\s+$/.test(form.password))
        errs.password = 'Password cannot start or end with spaces';

    // Full Name (optional but validate if provided)
    if (form.fullName.trim()) {
        if (form.fullName.trim().length < 2)
            errs.fullName = 'Name must be at least 2 characters';
        else if (form.fullName.trim().length > 60)
            errs.fullName = 'Name must be under 60 characters';
        else if (/\d/.test(form.fullName))
            errs.fullName = 'Name cannot contain numbers';
        else if (!/^[a-zA-Z\s.'\-]+$/.test(form.fullName.trim()))
            errs.fullName = 'Name contains invalid characters';
    }

    // Phone — Indian 10-digit mobile (optional but validate if provided)
    if (form.phone.trim()) {
        const digits = form.phone.replace(/[\s\-+()]/g, '');
        if (!/^\d+$/.test(digits))
            errs.phone = 'Phone must contain only digits';
        else if (digits.length !== 10)
            errs.phone = 'Phone must be exactly 10 digits';
        else if (!/^[6-9]/.test(digits))
            errs.phone = 'Enter a valid Indian mobile number (starts with 6–9)';
    }

    return errs;
}

// ── Eye Icon ──────────────────────────────────────────────────────
function EyeIcon({ open }) {
    return open ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

// ── Password strength ─────────────────────────────────────────────
function pwdStrength(p) {
    if (!p) return null;
    let s = 0;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    if (s <= 1) return { label:'Weak',   color:'#ef4444', w:'25%' };
    if (s === 2) return { label:'Fair',   color:'#f59e0b', w:'55%' };
    if (s === 3) return { label:'Good',   color:'#22c55e', w:'75%' };
    return               { label:'Strong 🔒', color:'#2563eb', w:'100%' };
}

export default function AdminProfile() {
    const { user }   = useAuth();
    const [profile,  setProfile]  = useState(null);
    const [admins,   setAdmins]   = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [modal,    setModal]    = useState(false);
    const [form,     setForm]     = useState({ email:'', password:'', fullName:'', phone:'' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');
    const [showPass, setShowPass] = useState(false);
    const [touched,  setTouched]  = useState({});

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const [p, a] = await Promise.all([
                api.get('/admin/profile'),
                api.get('/admin/all'),
            ]);
            setProfile(p.data);
            setAdmins(a.data || []);
        } catch {}
        finally { setLoading(false); }
    }

    function openModal() {
        setModal(true);
        setError('');
        setFieldErrors({});
        setTouched({});
        setShowPass(false);
        setForm({ email:'', password:'', fullName:'', phone:'' });
    }

    function closeModal() {
        setModal(false);
        setError('');
        setFieldErrors({});
        setTouched({});
    }

    // Update field + live-validate if already touched
    function update(key, val) {
        const next = { ...form, [key]: val };
        setForm(next);
        if (touched[key]) {
            const errs = validateAdminForm(next);
            if (errs[key]) setFieldErrors(p => ({ ...p, [key]: errs[key] }));
            else           setFieldErrors(p => { const n = {...p}; delete n[key]; return n; });
        }
    }

    function blur(key) {
        setTouched(t => ({ ...t, [key]: true }));
        const errs = validateAdminForm(form);
        if (errs[key]) setFieldErrors(p => ({ ...p, [key]: errs[key] }));
        else           setFieldErrors(p => { const n = {...p}; delete n[key]; return n; });
    }

    async function handleCreate() {
        // Touch all fields
        setTouched({ email:true, password:true, fullName:true, phone:true });
        const errs = validateAdminForm(form);
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true); setError('');
        try {
            await api.post('/admin/create-admin', {
                ...form,
                phone: form.phone.replace(/[\s\-+()]/g, ''),
            });
            setSuccess('Admin created successfully!');
            closeModal();
            fetchAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            const msg = e.response?.data?.message || '';
            const lower = msg.toLowerCase();
            if (lower.includes('email') || lower.includes('exists') || lower.includes('duplicate'))
                setFieldErrors({ email: 'An account with this email already exists.' });
            else if (lower.includes('phone'))
                setFieldErrors({ phone: 'This phone number is already registered.' });
            else
                setError(msg || 'Failed to create admin. Please try again.');
        } finally { setSaving(false); }
    }

    const inp = (hasErr) => ({
        width:'100%', border:`1.5px solid ${hasErr ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius:'9px', padding:'10px 12px', fontSize:'13px', outline:'none',
        background: hasErr ? '#fff5f5' : '#f8fafc',
        fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
        transition:'border-color .15s, box-shadow .15s', color:'#0f172a',
    });

    const lbl = { fontSize:'11px', fontWeight:700, color:'#64748b', marginBottom:'5px', display:'block', textTransform:'uppercase', letterSpacing:'.05em' };

    function FieldErr({ k }) {
        return fieldErrors[k]
            ? <div style={{ fontSize:'10px', color:'#ef4444', fontWeight:600, marginTop:'4px' }}>⚠ {fieldErrors[k]}</div>
            : null;
    }

    const str = pwdStrength(form.password);
    const initials = profile?.email?.slice(0, 2).toUpperCase() || 'AD';

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                @keyframes modalIn { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes spin    { to{transform:rotate(360deg)} }
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');

                .arow:hover   { background:#f8faff!important; }
                .inp-focus:focus { border-color:#2563eb!important; box-shadow:0 0 0 3px rgba(37,99,235,.1)!important; outline:none; }
                .inp-focus.err:focus { border-color:#ef4444!important; box-shadow:0 0 0 3px rgba(239,68,68,.1)!important; }

                /* ── Responsive grid ── */
                .ap-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
                .ap-hero  { padding:18px 28px; }
                .ap-body  { padding:20px 28px; }
                .modal-box { width:440px; padding:28px; }

                @media (max-width:900px) {
                    .ap-grid { grid-template-columns:1fr!important; }
                }
                @media (max-width:600px) {
                    .ap-hero { padding:14px 16px!important; }
                    .ap-body { padding:14px 16px!important; }
                    .modal-box { width:calc(100vw - 32px)!important; padding:20px!important; max-width:100%!important; }
                    .detail-grid { grid-template-columns:1fr!important; }
                }
            `}</style>

            {/* Hero */}
            <div className="ap-hero" style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', flexShrink:0 }}>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>System</div>
                <div style={{ fontSize:'20px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif" }}>👤 Admin Profile</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>{admins.length} administrator(s) registered</div>
            </div>

            <div className="ap-body" style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>

                {success && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>
                )}

                <div className="ap-grid" style={{ animation:'fadeUp .3s ease' }}>

                    {/* ── My Profile Card ── */}
                    <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>

                        {/* Card Hero */}
                        <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', padding:'24px', position:'relative', overflow:'hidden' }}>
                            <div style={{ position:'absolute', right:'-20px', top:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,.07)', pointerEvents:'none' }}/>
                            <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
                                <div style={{ width:'56px', height:'56px', borderRadius:'14px', background:'rgba(255,255,255,.2)', color:'#fff', fontSize:'20px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid rgba(255,255,255,.3)', flexShrink:0 }}>
                                    {initials}
                                </div>
                                <div style={{ minWidth:0 }}>
                                    <div style={{ fontSize:'16px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{profile?.fullName || 'Admin'}</div>
                                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.email}</div>
                                    <div style={{ marginTop:'6px' }}>
                                        <span style={{ background:'rgba(255,255,255,.2)', padding:'2px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:600, color:'#fff' }}>🔐 ADMIN</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details */}
                        <div style={{ padding:'20px' }}>
                            <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px' }}>Profile Details</div>

                            {loading ? (
                                <div style={{ color:'#94a3b8', fontSize:'12px', textAlign:'center', padding:'20px' }}>Loading...</div>
                            ) : (
                                <div className="detail-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                    {[
                                        { label:'Email',    value: profile?.email,    icon:'📧' },
                                        { label:'Phone',    value: profile?.phone ? `+91 ${profile.phone.replace(/^91/,'')}` : null, icon:'📞' },
                                        { label:'Full Name',value: profile?.fullName,  icon:'👤' },
                                        { label:'Role',     value: 'Administrator',    icon:'🔐' },
                                    ].map(item => (
                                        <div key={item.label} style={{ background:'#f8fafc', borderRadius:'9px', padding:'10px 12px', border:'1px solid #f1f5f9' }}>
                                            <div style={{ fontSize:'9px', color:'#94a3b8', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'.06em', display:'flex', alignItems:'center', gap:4 }}>
                                                <span>{item.icon}</span> {item.label}
                                            </div>
                                            <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {item.value || '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop:'14px', background:'#f8fafc', borderRadius:'9px', padding:'10px 12px', fontSize:'11px', color:'#64748b', lineHeight:1.6, border:'1px solid #f1f5f9' }}>
                                💡 To update your profile, contact the system administrator or update directly in settings.
                            </div>
                        </div>
                    </div>

                    {/* ── All Admins ── */}
                    <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden', display:'flex', flexDirection:'column' }}>

                        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                            <div>
                                <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'2px' }}>All Admins</div>
                                <div style={{ fontSize:'11px', color:'#94a3b8' }}>{admins.length} administrator(s)</div>
                            </div>
                            <button onClick={openModal}
                                    style={{ padding:'8px 16px', borderRadius:'9px', border:'none', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}>
                                + Add Admin
                            </button>
                        </div>

                        <div style={{ flex:1, overflowY:'auto', maxHeight:'380px' }}>
                            {loading ? (
                                <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8', fontSize:'12px' }}>Loading...</div>
                            ) : admins.length === 0 ? (
                                <div style={{ padding:'40px', textAlign:'center', color:'#94a3b8', fontSize:'12px' }}>No admins found</div>
                            ) : admins.map((a, idx) => {
                                const colors = [['#eff6ff','#2563eb'],['#f5f3ff','#7c3aed'],['#fff7ed','#c2410c'],['#f0fdf4','#15803d']];
                                const [bg, tc] = colors[idx % colors.length];
                                const ini  = (a.fullName || a.email)?.slice(0, 2).toUpperCase() || 'AD';
                                const isMe = a.email === profile?.email;
                                return (
                                    <div key={a.id} className="arow"
                                         style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 20px', borderBottom:'1px solid #f8fafc', transition:'background .12s' }}>
                                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:bg, color:tc, fontSize:'12px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ini}</div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a', display:'flex', alignItems:'center', gap:'6px' }}>
                                                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.fullName || 'Admin'}</span>
                                                {isMe && <span style={{ background:'#eff6ff', color:'#2563eb', fontSize:'9px', fontWeight:700, padding:'1px 6px', borderRadius:'4px', flexShrink:0 }}>YOU</span>}
                                            </div>
                                            <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.email}</div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'4px', flexShrink:0 }}>
                                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
                                            <span style={{ fontSize:'10px', color:'#94a3b8' }}>Active</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Info note */}
                <div style={{ marginTop:'16px', background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'12px', padding:'14px 16px', fontSize:'11px', color:'#1e40af', lineHeight:1.7 }}>
                    <div style={{ fontWeight:700, marginBottom:'3px' }}>ℹ️ Admin Account Info</div>
                    Admin accounts have full system access — manage doctors, patients, appointments, medicines and billing. Create new admin accounts only for trusted users.
                </div>
            </div>

            {/* ── Create Admin Modal ── */}
            {modal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)', padding:'16px', overflowY:'auto' }}>
                    <div className="modal-box" style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'440px', maxWidth:'100%', boxShadow:'0 24px 80px rgba(0,0,0,.25)', animation:'modalIn .25s ease', position:'relative' }}>

                        {/* Header */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                            <div>
                                <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a', fontFamily:"'Lora',serif" }}>🔐 Create New Admin</div>
                                <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>Fill all required fields carefully</div>
                            </div>
                            <button onClick={closeModal}
                                    style={{ width:'30px', height:'30px', borderRadius:'8px', border:'none', background:'#f1f5f9', color:'#64748b', fontSize:'16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
                        </div>

                        {error && (
                            <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 12px', marginBottom:'14px', lineHeight:1.5 }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

                            {/* Email */}
                            <div>
                                <label style={lbl}>Email Address *</label>
                                <input
                                    className={`inp-focus${fieldErrors.email ? ' err' : ''}`}
                                    type="email" placeholder="admin@hospital.com"
                                    value={form.email} autoComplete="off"
                                    style={inp(!!fieldErrors.email)}
                                    onChange={e => update('email', e.target.value)}
                                    onBlur={() => blur('email')}
                                />
                                <FieldErr k="email"/>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={lbl}>Password *</label>
                                <div style={{ position:'relative' }}>
                                    <input
                                        className={`inp-focus${fieldErrors.password ? ' err' : ''}`}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        value={form.password} autoComplete="new-password"
                                        style={{ ...inp(!!fieldErrors.password), paddingRight:'40px' }}
                                        onChange={e => update('password', e.target.value)}
                                        onBlur={() => blur('password')}
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                            style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex', alignItems:'center', padding:'3px', borderRadius:'4px', transition:'color .15s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
                                        <EyeIcon open={showPass}/>
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {str && !fieldErrors.password && (
                                    <div style={{ marginTop:'6px' }}>
                                        <div style={{ height:'3px', background:'#f1f5f9', borderRadius:'99px', overflow:'hidden' }}>
                                            <div style={{ height:'100%', width:str.w, background:str.color, borderRadius:'99px', transition:'width .3s, background .3s' }}/>
                                        </div>
                                        <span style={{ fontSize:'10px', color:str.color, fontWeight:700, marginTop:'3px', display:'block' }}>{str.label}</span>
                                    </div>
                                )}
                                <FieldErr k="password"/>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label style={lbl}>Full Name <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
                                <input
                                    className={`inp-focus${fieldErrors.fullName ? ' err' : ''}`}
                                    type="text" placeholder="Admin User"
                                    value={form.fullName} autoComplete="off"
                                    style={inp(!!fieldErrors.fullName)}
                                    onChange={e => update('fullName', e.target.value)}
                                    onBlur={() => blur('fullName')}
                                />
                                <FieldErr k="fullName"/>
                            </div>

                            {/* Phone */}
                            <div>
                                <label style={lbl}>
                                    Phone Number <span style={{ color:'#94a3b8', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional · 10 digits)</span>
                                </label>
                                <div style={{ position:'relative' }}>
                                    <div style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'#64748b', fontWeight:600, pointerEvents:'none' }}>+91</div>
                                    <input
                                        className={`inp-focus${fieldErrors.phone ? ' err' : ''}`}
                                        type="tel" placeholder="9876543210"
                                        value={form.phone} maxLength={10} autoComplete="off"
                                        style={{ ...inp(!!fieldErrors.phone), paddingLeft:'40px' }}
                                        onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                                        onBlur={() => blur('phone')}
                                    />
                                </div>
                                {/* Phone progress indicator */}
                                {form.phone && !fieldErrors.phone && (
                                    <div style={{ fontSize:'10px', marginTop:'4px', fontWeight:600, color: form.phone.length === 10 && /^[6-9]/.test(form.phone) ? '#059669' : '#f59e0b' }}>
                                        {form.phone.length === 10 && /^[6-9]/.test(form.phone) ? '✓ Valid number' : `${form.phone.length}/10 digits`}
                                    </div>
                                )}
                                <FieldErr k="phone"/>
                            </div>
                        </div>

                        {/* Warning */}
                        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'9px', padding:'10px 12px', fontSize:'11px', color:'#92400e', marginTop:'16px', marginBottom:'16px', lineHeight:1.6, display:'flex', gap:8, alignItems:'flex-start' }}>
                            <span style={{ flexShrink:0, fontSize:14 }}>⚠️</span>
                            <span>Admin accounts have <strong>full system access</strong>. Create only for trusted users.</span>
                        </div>

                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={handleCreate} disabled={saving}
                                    style={{ flex:1, padding:'12px', borderRadius:'10px', border:'none', background: saving ? '#9ca3af' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:'13px', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity .2s' }}>
                                {saving ? (
                                    <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/> Creating...</>
                                ) : '✓ Create Admin'}
                            </button>
                            <button onClick={closeModal}
                                    style={{ padding:'12px 20px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}