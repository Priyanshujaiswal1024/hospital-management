import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../auth/AuthContext';

export default function AdminProfile() {
    const { user } = useAuth();
    const [profile,  setProfile]  = useState(null);
    const [admins,   setAdmins]   = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [creating, setCreating] = useState(false);
    const [modal,    setModal]    = useState(false);
    const [form,     setForm]     = useState({ email:'', password:'', fullName:'', phone:'' });
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');

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

    async function handleCreate() {
        if (!form.email || !form.password) {
            setError('Email and password required'); return;
        }
        setSaving(true); setError('');
        try {
            await api.post('/admin/create-admin', form);
            setSuccess('Admin created successfully!');
            setModal(false);
            setForm({ email:'', password:'', fullName:'', phone:'' });
            fetchAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to create admin');
        } finally { setSaving(false); }
    }

    const inp = {
        width:'100%', border:'1px solid #e2e8f0', borderRadius:'9px',
        padding:'9px 12px', fontSize:'12px', outline:'none',
        background:'#fafbfc', fontFamily:"'DM Sans',sans-serif",
        boxSizing:'border-box',
    };
    const lbl = {
        fontSize:'11px', fontWeight:600, color:'#374151',
        marginBottom:'4px', display:'block',
    };

    const initials = profile?.email?.slice(0,2).toUpperCase() || 'AD';

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%',
            background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .arow:hover{background:#f8faff!important;}
            `}</style>

            {/* Hero */}
            <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)',
                padding:'18px 28px', flexShrink:0 }}>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)',
                    fontWeight:600, letterSpacing:'.08em',
                    textTransform:'uppercase', marginBottom:'3px' }}>System</div>
                <div style={{ fontSize:'20px', fontWeight:700, color:'#fff',
                    fontFamily:"'Lora',serif" }}>👤 Admin Profile</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)',
                    marginTop:'2px' }}>{admins.length} admin(s) registered</div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 28px' }}>

                {success && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0',
                        color:'#166534', fontSize:'12px', borderRadius:'9px',
                        padding:'10px 14px', marginBottom:'14px' }}>✅ {success}</div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                    gap:'16px', animation:'fadeUp .3s ease' }}>

                    {/* My Profile Card */}
                    <div style={{ background:'#fff', borderRadius:'16px',
                        border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>

                        {/* Card Hero */}
                        <div style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)',
                            padding:'24px', position:'relative', overflow:'hidden' }}>
                            <div style={{ position:'absolute', right:'-20px', top:'-20px',
                                width:'100px', height:'100px', borderRadius:'50%',
                                background:'rgba(255,255,255,.07)' }}/>

                            <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                                <div style={{ width:'56px', height:'56px',
                                    borderRadius:'14px',
                                    background:'rgba(255,255,255,.2)',
                                    color:'#fff', fontSize:'20px', fontWeight:800,
                                    display:'flex', alignItems:'center',
                                    justifyContent:'center',
                                    border:'2px solid rgba(255,255,255,.3)' }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{ fontSize:'16px', fontWeight:700,
                                        color:'#fff', marginBottom:'2px' }}>
                                        {profile?.fullName || 'Admin'}
                                    </div>
                                    <div style={{ fontSize:'11px',
                                        color:'rgba(255,255,255,.7)' }}>
                                        {profile?.email}
                                    </div>
                                    <div style={{ marginTop:'6px' }}>
                                        <span style={{ background:'rgba(255,255,255,.2)',
                                            padding:'2px 10px', borderRadius:'20px',
                                            fontSize:'10px', fontWeight:600,
                                            color:'#fff' }}>
                                            🔐 ADMIN
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div style={{ padding:'20px' }}>
                            <div style={{ fontSize:'10px', fontWeight:700,
                                color:'#94a3b8', textTransform:'uppercase',
                                letterSpacing:'.07em', marginBottom:'14px' }}>
                                Profile Details
                            </div>

                            {loading ? (
                                <div style={{ color:'#94a3b8', fontSize:'12px' }}>
                                    Loading...
                                </div>
                            ) : (
                                <div style={{ display:'grid',
                                    gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                                    {[
                                        { label:'Email',    value: profile?.email    },
                                        { label:'Phone',    value: profile?.phone    },
                                        { label:'Full Name',value: profile?.fullName },
                                        { label:'Role',     value: 'Administrator'   },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            background:'#f8fafc', borderRadius:'9px',
                                            padding:'10px 12px' }}>
                                            <div style={{ fontSize:'10px',
                                                color:'#94a3b8', marginBottom:'3px',
                                                textTransform:'uppercase',
                                                letterSpacing:'.05em' }}>
                                                {item.label}
                                            </div>
                                            <div style={{ fontSize:'12px',
                                                fontWeight:600, color:'#0f172a' }}>
                                                {item.value || '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Admins */}
                    <div style={{ background:'#fff', borderRadius:'16px',
                        border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>

                        <div style={{ padding:'16px 20px',
                            borderBottom:'1px solid #f1f5f9',
                            display:'flex', justifyContent:'space-between',
                            alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:'14px', fontWeight:700,
                                    color:'#0f172a', marginBottom:'2px' }}>
                                    All Admins
                                </div>
                                <div style={{ fontSize:'11px', color:'#94a3b8' }}>
                                    {admins.length} administrator(s)
                                </div>
                            </div>
                            <button
                                onClick={() => { setModal(true); setError(''); }}
                                style={{ padding:'8px 16px', borderRadius:'9px',
                                    border:'none',
                                    background:'linear-gradient(135deg,#2563eb,#1d4ed8)',
                                    color:'#fff', fontSize:'12px', fontWeight:700,
                                    cursor:'pointer',
                                    display:'flex', alignItems:'center', gap:'6px' }}>
                                + Add Admin
                            </button>
                        </div>

                        <div style={{ overflowY:'auto', maxHeight:'400px' }}>
                            {loading ? (
                                <div style={{ padding:'40px', textAlign:'center',
                                    color:'#94a3b8', fontSize:'12px' }}>
                                    Loading...
                                </div>
                            ) : admins.length === 0 ? (
                                <div style={{ padding:'40px', textAlign:'center',
                                    color:'#94a3b8', fontSize:'12px' }}>
                                    No admins found
                                </div>
                            ) : admins.map((a, idx) => {
                                const colors = [
                                    ['#eff6ff','#2563eb'],['#f5f3ff','#7c3aed'],
                                    ['#fff7ed','#c2410c'],['#f0fdf4','#15803d'],
                                ];
                                const [bg, tc] = colors[idx % colors.length];
                                const ini = (a.fullName || a.email)
                                    ?.slice(0,2).toUpperCase() || 'AD';
                                const isMe = a.email === profile?.email;

                                return (
                                    <div key={a.id} className="arow" style={{
                                        display:'flex', alignItems:'center',
                                        gap:'12px', padding:'12px 20px',
                                        borderBottom:'1px solid #f8fafc',
                                        transition:'background .12s' }}>

                                        <div style={{ width:'36px', height:'36px',
                                            borderRadius:'10px', background:bg,
                                            color:tc, fontSize:'12px', fontWeight:700,
                                            display:'flex', alignItems:'center',
                                            justifyContent:'center', flexShrink:0 }}>
                                            {ini}
                                        </div>

                                        <div style={{ flex:1, minWidth:0 }}>
                                            <div style={{ fontSize:'12px',
                                                fontWeight:600, color:'#0f172a',
                                                display:'flex', alignItems:'center',
                                                gap:'6px' }}>
                                                {a.fullName || 'Admin'}
                                                {isMe && (
                                                    <span style={{ background:'#eff6ff',
                                                        color:'#2563eb', fontSize:'9px',
                                                        fontWeight:700, padding:'1px 6px',
                                                        borderRadius:'4px' }}>YOU</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize:'10px',
                                                color:'#94a3b8', marginTop:'1px' }}>
                                                {a.email}
                                            </div>
                                        </div>

                                        <div style={{ display:'flex',
                                            alignItems:'center', gap:'4px' }}>
                                            <span style={{ width:'6px', height:'6px',
                                                borderRadius:'50%',
                                                background:'#22c55e',
                                                display:'inline-block' }}/>
                                            <span style={{ fontSize:'10px',
                                                color:'#94a3b8' }}>Active</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Info note */}
                <div style={{ marginTop:'16px', background:'#eff6ff',
                    border:'1px solid #bfdbfe', borderRadius:'12px',
                    padding:'14px 16px', fontSize:'11px', color:'#1e40af',
                    lineHeight:1.7 }}>
                    <div style={{ fontWeight:700, marginBottom:'3px' }}>
                        ℹ️ Admin Account Info
                    </div>
                    To update your name, phone or password — contact the system
                    administrator or update directly in the database.
                    Admin accounts are managed separately from patient/doctor accounts.
                </div>
            </div>

            {/* Create Admin Modal */}
            {modal && (
                <div style={{ position:'fixed', inset:0,
                    background:'rgba(0,0,0,.5)',
                    display:'flex', alignItems:'center',
                    justifyContent:'center', zIndex:1000,
                    backdropFilter:'blur(4px)' }}>
                    <div style={{ background:'#fff', borderRadius:'20px',
                        padding:'28px', width:'440px',
                        boxShadow:'0 20px 60px rgba(0,0,0,.2)',
                        animation:'modalIn .2s ease' }}>

                        <div style={{ display:'flex', justifyContent:'space-between',
                            alignItems:'center', marginBottom:'20px' }}>
                            <div style={{ fontSize:'18px', fontWeight:700,
                                color:'#0f172a', fontFamily:"'Lora',serif" }}>
                                🔐 Create New Admin
                            </div>
                            <button onClick={() => { setModal(false); setError(''); }}
                                    style={{ width:'30px', height:'30px',
                                        borderRadius:'8px', border:'none',
                                        background:'#f1f5f9', color:'#64748b',
                                        fontSize:'16px', cursor:'pointer',
                                        display:'flex', alignItems:'center',
                                        justifyContent:'center' }}>×</button>
                        </div>

                        {error && (
                            <div style={{ background:'#fef2f2',
                                border:'1px solid #fecaca', color:'#dc2626',
                                fontSize:'12px', borderRadius:'8px',
                                padding:'10px', marginBottom:'14px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ display:'flex', flexDirection:'column',
                            gap:'12px' }}>
                            <div>
                                <label style={lbl}>Email *</label>
                                <input style={inp} type="email"
                                       placeholder="admin@hospital.com"
                                       value={form.email}
                                       onChange={e => setForm(f => ({
                                           ...f, email: e.target.value
                                       }))}/>
                            </div>
                            <div>
                                <label style={lbl}>Password *</label>
                                <input style={inp} type="password"
                                       placeholder="••••••••"
                                       value={form.password}
                                       onChange={e => setForm(f => ({
                                           ...f, password: e.target.value
                                       }))}/>
                            </div>
                            <div>
                                <label style={lbl}>Full Name</label>
                                <input style={inp} type="text"
                                       placeholder="Admin Name"
                                       value={form.fullName}
                                       onChange={e => setForm(f => ({
                                           ...f, fullName: e.target.value
                                       }))}/>
                            </div>
                            <div>
                                <label style={lbl}>Phone</label>
                                <input style={inp} type="text"
                                       placeholder="9876543210"
                                       value={form.phone}
                                       onChange={e => setForm(f => ({
                                           ...f, phone: e.target.value
                                       }))}/>
                            </div>
                        </div>

                        {/* Warning */}
                        <div style={{ background:'#fffbeb',
                            border:'1px solid #fde68a',
                            borderRadius:'9px', padding:'10px 12px',
                            fontSize:'11px', color:'#92400e',
                            marginTop:'14px', marginBottom:'14px' }}>
                            ⚠️ Admin accounts have full system access.
                            Create only for trusted users.
                        </div>

                        <div style={{ display:'flex', gap:'8px' }}>
                            <button onClick={handleCreate} disabled={saving}
                                    style={{ flex:1, padding:'12px',
                                        borderRadius:'10px', border:'none',
                                        background: saving ? '#9ca3af'
                                            : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                                        color:'#fff', fontSize:'13px',
                                        fontWeight:700,
                                        cursor: saving ? 'not-allowed' : 'pointer' }}>
                                {saving ? 'Creating...' : '✓ Create Admin'}
                            </button>
                            <button onClick={() => { setModal(false); setError(''); }}
                                    style={{ padding:'12px 20px',
                                        borderRadius:'10px',
                                        border:'1px solid #e2e8f0',
                                        background:'#fff', color:'#374151',
                                        fontSize:'13px', cursor:'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}