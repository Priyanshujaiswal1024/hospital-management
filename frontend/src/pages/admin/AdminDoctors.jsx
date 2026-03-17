import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminDoctors() {
    const [doctors,  setDoctors]  = useState([]);
    const [depts,    setDepts]    = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [modal,    setModal]    = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form,     setForm]     = useState({});
    const [saving,   setSaving]   = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');

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
        setForm({ username:'', password:'', name:'', email:'', specialization:'',
            consultationFee:'', experienceYears:'', departmentId:'', phoneNumber:'', bio:'' });
        setModal('add');
        setError('');
    }

    function openEdit(doc) {
        setForm({ ...doc, password:'' });
        setModal(doc);
        setError('');
    }

    async function handleSave() {
        setSaving(true); setError('');
        try {
            if (modal === 'add') {
                await api.post('/admin/doctors', form);
                setSuccess('Doctor created successfully!');
            } else {
                await api.put(`/admin/doctors/${modal.id}`, form);
                setSuccess('Doctor updated successfully!');
            }
            setModal(null);
            fetchAll();
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Operation failed');
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

    // ✅ Helper — safe name (no double Dr.)
    function safeName(name) {
        if (!name) return '—';
        return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
    }

    // ✅ Helper — safe departments (filter entity toString)
    function safeDepts(departments) {
        if (!departments) return '—';
        const arr = [...departments].filter(
            d => typeof d === 'string' && !d.includes('@') && !d.includes('.')
        );
        return arr.length > 0 ? arr.join(', ') : '—';
    }

    const filtered = doctors.filter(d =>
        !search || d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase())
    );

    const inp = {
        width:'100%', border:'1px solid #e2e8f0', borderRadius:'9px',
        padding:'9px 12px', fontSize:'12px', outline:'none',
        background:'#fafbfc', fontFamily:"'DM Sans',sans-serif", boxSizing:'border-box',
    };
    const lbl = {
        fontSize:'11px', fontWeight:600, color:'#374151',
        marginBottom:'4px', display:'block',
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%',
            background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
                @keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
                @import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
                .drow:hover{background:#f8faff!important;}
                .inp-f:focus{border-color:#2563eb!important;}
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

                <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                           placeholder="🔍  Search by name, specialization, email..."
                           style={{ ...inp, maxWidth:'400px',
                               boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}/>
                </div>

                {/* Table */}
                <div style={{ background:'#fff', borderRadius:'16px',
                    border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)',
                    overflow:'hidden', animation:'fadeUp .3s ease' }}>

                    {/* Header */}
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
                                {/* Doctor */}
                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                    {doc.profileImageUrl ? (
                                        <img src={doc.profileImageUrl} alt=""
                                             style={{ width:'34px', height:'34px',
                                                 borderRadius:'10px', objectFit:'cover',
                                                 flexShrink:0 }}/>
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
                                        {/* ✅ No double Dr. */}
                                        <div style={{ fontSize:'12px', fontWeight:600,
                                            color:'#0f172a' }}>
                                            {safeName(doc.name)}
                                        </div>
                                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                            {doc.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Specialization */}
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {doc.specialization || '—'}
                                </div>

                                {/* Fee */}
                                <div style={{ fontSize:'12px', fontWeight:600,
                                    color:'#059669' }}>
                                    ₹{doc.consultationFee || '—'}
                                </div>

                                {/* Exp */}
                                <div style={{ fontSize:'12px', color:'#475569' }}>
                                    {doc.experienceYears ? `${doc.experienceYears} yrs` : '—'}
                                </div>

                                {/* ✅ Department — no entity toString */}
                                <div style={{ fontSize:'11px', color:'#374151' }}>
                                    {safeDepts(doc.departments)}
                                </div>

                                {/* Actions */}
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
                    zIndex:1000, backdropFilter:'blur(4px)' }}>
                    <div style={{ background:'#fff', borderRadius:'20px', padding:'28px',
                        width:'540px', maxHeight:'90vh', overflowY:'auto',
                        boxShadow:'0 20px 60px rgba(0,0,0,.2)',
                        animation:'modalIn .2s ease' }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                            alignItems:'center', marginBottom:'20px' }}>
                            <div style={{ fontSize:'18px', fontWeight:700, color:'#0f172a',
                                fontFamily:"'Lora',serif" }}>
                                {modal === 'add' ? '➕ Add New Doctor'
                                    : `✏️ Edit ${safeName(modal.name)}`}
                            </div>
                            <button onClick={() => setModal(null)} style={{
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

                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                            gap:'12px' }}>
                            {[
                                { key:'name',            label:'Full Name *',       type:'text',     placeholder:'Priya Mehta'          },
                                { key:'email',           label:'Email *',           type:'email',    placeholder:'doctor@hospital.com'  },
                                { key:'username',        label:'Username (Login) *',type:'email',    placeholder:'login@hospital.com'   },
                                { key:'password',        label: modal==='add' ? 'Password *' : 'New Password (leave blank)', type:'password', placeholder:'••••••••' },
                                { key:'specialization',  label:'Specialization',    type:'text',     placeholder:'Cardiology'           },
                                { key:'consultationFee', label:'Consultation Fee',  type:'number',   placeholder:'500'                  },
                                { key:'experienceYears', label:'Experience (yrs)',  type:'number',   placeholder:'5'                    },
                                { key:'phoneNumber',     label:'Phone Number',      type:'text',     placeholder:'9876543210'           },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={lbl}>{f.label}</label>
                                    <input className="inp-f" type={f.type} style={inp}
                                           placeholder={f.placeholder}
                                           value={form[f.key] || ''}
                                           onChange={e => setForm(p => ({
                                               ...p, [f.key]: e.target.value
                                           }))}/>
                                </div>
                            ))}

                            <div>
                                <label style={lbl}>Department</label>
                                <select className="inp-f" style={inp}
                                        value={form.departmentId || ''}
                                        onChange={e => setForm(p => ({
                                            ...p, departmentId: e.target.value
                                        }))}>
                                    <option value="">Select department...</option>
                                    {depts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={lbl}>Profile Image URL</label>
                                <input className="inp-f" style={inp}
                                       placeholder="https://..."
                                       value={form.profileImageUrl || ''}
                                       onChange={e => setForm(p => ({
                                           ...p, profileImageUrl: e.target.value
                                       }))}/>
                            </div>

                            <div style={{ gridColumn:'1 / -1' }}>
                                <label style={lbl}>Bio</label>
                                <textarea className="inp-f"
                                          style={{ ...inp, resize:'none',
                                              minHeight:'72px', lineHeight:1.6 }}
                                          placeholder="Short description..."
                                          value={form.bio || ''}
                                          onChange={e => setForm(p => ({
                                              ...p, bio: e.target.value
                                          }))}/>
                            </div>
                        </div>

                        <div style={{ display:'flex', gap:'8px', marginTop:'20px' }}>
                            <button onClick={handleSave} disabled={saving} style={{
                                flex:1, padding:'12px', borderRadius:'10px', border:'none',
                                background: saving ? '#9ca3af'
                                    : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                                color:'#fff', fontSize:'13px', fontWeight:700,
                                cursor: saving ? 'not-allowed' : 'pointer' }}>
                                {saving ? 'Saving...'
                                    : modal==='add' ? '✓ Create Doctor' : '✓ Save Changes'}
                            </button>
                            <button onClick={() => setModal(null)} style={{
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
                        <div style={{ fontSize:'16px', fontWeight:700, color:'#0f172a',
                            marginBottom:'8px' }}>
                            Delete {safeName(deleting.name)}?
                        </div>
                        <p style={{ fontSize:'12px', color:'#6b7280',
                            marginBottom:'20px', lineHeight:1.7 }}>
                            This will permanently delete the doctor. Cannot be undone.
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