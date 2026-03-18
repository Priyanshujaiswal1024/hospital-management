import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';

export default function DoctorProfile() {
    const [doctor,  setDoctor]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState('');
    const [form,    setForm]    = useState({ phoneNumber: '', bio: '' });
    const [avatar,  setAvatar]  = useState(null);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const fileInputRef  = useRef();
    const avatarMenuRef = useRef();

    useEffect(() => { fetchProfile(); }, []);

    useEffect(() => {
        function handleClick(e) {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
                setShowAvatarMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function fetchProfile() {
        setLoading(true);
        try {
            const { data } = await api.get('/doctors/profile');
            setDoctor(data);
            setForm({ phoneNumber: data.phoneNumber || '', bio: data.bio || '' });

            // Check correct key first, then scan ALL avatar_ keys as fallback
            const correctKey = `avatar_${data.email}`;
            let saved = localStorage.getItem(correctKey);
            if (!saved) {
                // Fallback: find any avatar_ key (handles old mismatched keys)
                const oldKey = Object.keys(localStorage).find(k => k.startsWith('avatar_'));
                if (oldKey) {
                    saved = localStorage.getItem(oldKey);
                    // Migrate to correct key
                    if (saved) {
                        localStorage.setItem(correctKey, saved);
                        localStorage.removeItem(oldKey);
                    }
                }
            }
            setAvatar(saved || null);
        } catch {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true); setError(''); setSuccess('');
        try {
            const { data } = await api.patch('/doctors/profile', form);
            setDoctor(data);
            setEditing(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    // avatar key — doctor state IS set by time user clicks
    function avatarKey() { return `avatar_${doctor?.email}`; }

    function handleAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const b64 = ev.target.result;
            setAvatar(b64);                         // state = truthy → Remove shows
            localStorage.setItem(avatarKey(), b64);
            setSuccess('Profile picture updated!');
            setTimeout(() => setSuccess(''), 2500);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
        setShowAvatarMenu(false);
    }

    function handleRemoveAvatar() {
        setAvatar(null);                        // state = null → Remove hides
        localStorage.removeItem(avatarKey());
        setShowAvatarMenu(false);
        setSuccess('Profile picture removed.');
        setTimeout(() => setSuccess(''), 2500);
    }

    const initials = doctor?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';

    const inp = {
        width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px',
        padding: '10px 14px', fontSize: '13px', outline: 'none',
        background: '#f8faff', fontFamily: "'DM Sans', sans-serif",
        boxSizing: 'border-box', transition: 'border .2s',
    };
    const lbl = {
        fontSize: '10px', fontWeight: 700, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '.06em',
        marginBottom: '5px', display: 'block',
    };

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '300px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#185FA5', animation: 'dp-spin 1s linear infinite' }} />
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>Loading profile...</div>
            <style>{`@keyframes dp-spin { to { transform:rotate(360deg); } }`}</style>
        </div>
    );

    const stats = [
        { icon: '🏥', label: 'Department',     value: doctor?.departments?.join(', ') || '—' },
        { icon: '⏳', label: 'Experience',     value: doctor?.experienceYears ? `${doctor.experienceYears} yrs` : '—' },
        { icon: '💰', label: 'Consult Fee',    value: doctor?.consultationFee ? `₹${doctor.consultationFee}` : '—' },
        { icon: '🩺', label: 'Specialization', value: doctor?.specialization || '—' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes dp-spin   { to { transform: rotate(360deg); } }
                @keyframes dp-pulse  { 0%,100%{opacity:1} 50%{opacity:.6} }
                @keyframes dp-fadein { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
                .dp-avatar-wrap { cursor: pointer; position: relative; }
                .dp-avatar-overlay { opacity: 0; transition: opacity .2s; border-radius: 18px; }
                .dp-avatar-wrap:hover .dp-avatar-overlay { opacity: 1; }
                .dp-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
                .dp-main-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
                .dp-prof-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
                .dp-quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .dp-hero-inner { display: flex; align-items: center; gap: 20px; }
                .dp-fee-card   { flex-shrink: 0; }
                @media (max-width: 1024px) {
                    .dp-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .dp-main-grid  { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .dp-hero-inner { flex-direction: column; align-items: flex-start !important; }
                    .dp-fee-card   { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px !important; }
                    .dp-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
                    .dp-prof-grid  { grid-template-columns: 1fr !important; }
                    .dp-pad        { padding: 12px 14px !important; }
                }
            `}</style>

            {/* TOPBAR */}
            <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, gap: '10px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>My Profile</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>View and manage your profile</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!editing ? (
                        <button onClick={() => setEditing(true)}
                                style={{ padding: '8px 16px', borderRadius: '9px', border: 'none', background: '#185FA5', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
                                onMouseLeave={e => e.currentTarget.style.background = '#185FA5'}>
                            ✏️ Edit Profile
                        </button>
                    ) : (
                        <>
                            <button onClick={() => { setEditing(false); setError(''); }}
                                    style={{ padding: '8px 14px', borderRadius: '9px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                    style={{ padding: '8px 14px', borderRadius: '9px', border: 'none', background: saving ? '#9ca3af' : '#185FA5', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {saving ? <><div style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'dp-spin 1s linear infinite' }} />Saving...</> : '✓ Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="dp-pad" style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

                {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>⚠️ {error}</div>}
                {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>✅ {success}</div>}

                {/* HERO */}
                <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#185FA5,#2563eb)', borderRadius: '16px', padding: '24px 28px', color: '#fff', marginBottom: '16px', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />

                    <div className="dp-hero-inner" style={{ position: 'relative' }}>

                        {/* AVATAR */}
                        <div style={{ position: 'relative', flexShrink: 0 }} ref={avatarMenuRef}>
                            <div className="dp-avatar-wrap" onClick={() => setShowAvatarMenu(v => !v)}>
                                {avatar ? (
                                    <img src={avatar} alt="profile" style={{ width: '76px', height: '76px', borderRadius: '18px', objectFit: 'cover', border: '3px solid rgba(255,255,255,.3)', display: 'block' }} />
                                ) : (
                                    <div style={{ width: '76px', height: '76px', borderRadius: '18px', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: '26px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,.25)' }}>
                                        {initials}
                                    </div>
                                )}
                                <div className="dp-avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                    <div style={{ fontSize: '16px' }}>📷</div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#fff' }}>Edit</div>
                                </div>
                            </div>

                            {/* DROPDOWN */}
                            {showAvatarMenu && (
                                <div style={{ position: 'absolute', top: '88px', left: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,.18)', border: '1px solid #e2e8f0', minWidth: '160px', zIndex: 9999, animation: 'dp-fadein .15s ease' }}>
                                    <button
                                        onClick={() => { fileInputRef.current?.click(); setShowAvatarMenu(false); }}
                                        style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#185FA5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        📷 Change Photo
                                    </button>
                                    {/* Remove button — only shows when avatar state is not null */}
                                    {avatar !== null && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            🗑️ Remove Photo
                                        </button>
                                    )}
                                </div>
                            )}

                            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                            <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: '#4ade80', border: '2px solid #1e40af' }} />
                        </div>

                        {/* INFO */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: "'Playfair Display', serif", marginBottom: '2px' }}>Dr. {doctor?.name}</div>
                            <div style={{ fontSize: '12px', opacity: .8, marginBottom: '2px' }}>{doctor?.specialization}</div>
                            <div style={{ fontSize: '11px', opacity: .6, marginBottom: '10px', wordBreak: 'break-all' }}>
                                📧 {doctor?.email}{doctor?.phoneNumber && ` · 📞 ${doctor.phoneNumber}`}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {doctor?.departments?.map(dep => (
                                    <span key={dep} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>🏥 {dep}</span>
                                ))}
                                {doctor?.experienceYears && (
                                    <span style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>⏳ {doctor.experienceYears} yrs</span>
                                )}
                                <span style={{ background: 'rgba(74,222,128,.2)', border: '1px solid rgba(74,222,128,.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 600 }}>● Active</span>
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '10px', color: 'rgba(255,255,255,.45)' }}>📷 Click photo to change or remove</div>
                        </div>

                        {/* FEE CARD */}
                        <div className="dp-fee-card" style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '14px', padding: '14px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', opacity: .7, marginBottom: '4px' }}>Consultation Fee</div>
                            <div style={{ fontSize: '28px', fontWeight: 800 }}>₹{doctor?.consultationFee}</div>
                            <div style={{ fontSize: '10px', opacity: .6, marginTop: '2px' }}>per visit</div>
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="dp-stats-grid">
                    {stats.map(s => (
                        <div key={s.label}
                             style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '14px', transition: 'all .15s' }}
                             onMouseEnter={e => { e.currentTarget.style.borderColor = '#bfdbfe'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,95,165,.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                             onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.value}</div>
                            <div style={{ fontSize: '10px', color: '#9ca3af' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* MAIN GRID */}
                <div className="dp-main-grid">

                    {/* Professional Info */}
                    <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.07em' }}>📋 Professional Info</div>
                            <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '9px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>🔒 Admin Managed</span>
                        </div>
                        <div className="dp-prof-grid">
                            {[
                                { label: 'Full Name',      value: doctor?.name,           icon: '👤' },
                                { label: 'Specialization', value: doctor?.specialization, icon: '🩺' },
                                { label: 'Experience',     value: doctor?.experienceYears ? `${doctor.experienceYears} years` : '—', icon: '⏳' },
                                { label: 'Consult Fee',    value: doctor?.consultationFee ? `₹${doctor.consultationFee}` : '—', icon: '💰' },
                                { label: 'Department',     value: doctor?.departments?.join(', ') || '—', icon: '🏥' },
                                { label: 'Email',          value: doctor?.email, icon: '📧' },
                            ].map(item => (
                                <div key={item.label} style={{ background: '#f9fafb', borderRadius: '9px', padding: '10px 12px' }}>
                                    <label style={lbl}>{item.icon} {item.label}</label>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value || '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right col */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Contact — editable */}
                        <div style={{ background: '#fff', border: editing ? '1.5px solid #3b82f6' : '1px solid #f0f0f0', borderRadius: '12px', padding: '18px', transition: 'border .2s', boxShadow: editing ? '0 0 0 3px rgba(59,130,246,.08)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.07em' }}>📞 Contact Info</div>
                                {editing
                                    ? <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: '9px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', border: '1px solid #bfdbfe', animation: 'dp-pulse 2s infinite' }}>✏️ Editing</span>
                                    : <span style={{ background: '#f0fdf4', color: '#166534', fontSize: '9px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>✅ Editable</span>
                                }
                            </div>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={lbl}>📞 Phone Number</label>
                                {editing ? (
                                    <input style={inp} placeholder="+91 98765 43210" value={form.phoneNumber}
                                           onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                                           onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                ) : (
                                    <div style={{ background: '#f9fafb', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                        {doctor?.phoneNumber || <span style={{ color: '#9ca3af', fontWeight: 400 }}>Not added yet</span>}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={lbl}>📝 Bio / About</label>
                                {editing ? (
                                    <textarea style={{ ...inp, resize: 'vertical', minHeight: '90px', lineHeight: 1.6 }}
                                              placeholder="Write a short description about yourself..."
                                              value={form.bio}
                                              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                              onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                              onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                ) : (
                                    <div style={{ background: '#f9fafb', borderRadius: '9px', padding: '12px', fontSize: '12px', color: doctor?.bio ? '#374151' : '#9ca3af', lineHeight: 1.7, minHeight: '60px', fontStyle: doctor?.bio ? 'normal' : 'italic' }}>
                                        {doctor?.bio || 'No bio added yet. Click Edit Profile to add your bio.'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin note */}
                        <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#185FA5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>ℹ️</div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>Admin Managed Fields</div>
                                    <div style={{ fontSize: '11px', color: '#1e40af', opacity: .8, lineHeight: 1.6 }}>Your name, specialization, consultation fee and department are managed by hospital administration.</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick summary */}
                        <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e3a8a)', borderRadius: '12px', padding: '14px 16px', color: '#fff' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, opacity: .6, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px' }}>Quick Summary</div>
                            <div className="dp-quick-grid">
                                {[
                                    { label: 'Doctor ID', value: `#${doctor?.id || '—'}` },
                                    { label: 'Status',    value: '🟢 Active' },
                                    { label: 'Fee',       value: `₹${doctor?.consultationFee || '—'}` },
                                    { label: 'Exp',       value: `${doctor?.experienceYears || '—'} yrs` },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div style={{ fontSize: '9px', opacity: .5, marginBottom: '2px' }}>{item.label}</div>
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}