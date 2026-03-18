import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const bloodGroups = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'];
const bloodGroupLabels = { A_POSITIVE:'A+', A_NEGATIVE:'A−', B_POSITIVE:'B+', B_NEGATIVE:'B−', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB−', O_POSITIVE:'O+', O_NEGATIVE:'O−' };

export default function PatientProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [form,    setForm]    = useState({});
    const [editing, setEditing] = useState(false);
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [saved,   setSaved]   = useState(false);
    const [avatar,  setAvatar]  = useState(null);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const fileInputRef  = useRef();
    const avatarMenuRef = useRef();

    useEffect(() => { fetchProfile(); }, []);

    // Close dropdown on outside click
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
        try {
            const { data } = await api.get('/patient/profile');
            setProfile(data);
            setForm({
                name: data.name || '', fatherName: data.fatherName || '',
                gender: data.gender || '', birthDate: data.birthDate || '',
                bloodGroup: data.bloodGroup || '', address: data.address || '',
                city: data.city || '', state: data.state || '', pincode: data.pincode || '',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                height: data.height || '', weight: data.weight || '',
            });
            // Load avatar using email directly from response
            const saved = localStorage.getItem(`avatar_${data.email}`);
            setAvatar(saved || null);
        } catch {
            navigate('/patient/create-profile');
        } finally {
            setLoading(false);
        }
    }

    // Avatar key helper — profile state IS set by time user clicks
    function avatarKey() { return `avatar_${profile?.email}`; }

    function handleAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setErrors(ev => ({ ...ev, general: 'Image must be under 5MB' }));
            return;
        }
        const reader = new FileReader();
        reader.onload = ev => {
            const b64 = ev.target.result;
            setAvatar(b64);                         // state = truthy → Remove shows
            localStorage.setItem(avatarKey(), b64);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
        setShowAvatarMenu(false);
    }

    function handleRemoveAvatar() {
        setAvatar(null);                        // state = null → Remove hides
        localStorage.removeItem(avatarKey());
        setShowAvatarMenu(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    function validate() {
        const e = {};
        if (!form.name?.trim()) e.name = 'Name is required';
        if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) e.pincode = 'Invalid pincode';
        if (form.emergencyContactPhone && !/^[6-9][0-9]{9}$/.test(form.emergencyContactPhone)) e.emergencyContactPhone = 'Invalid phone';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        try {
            const { data } = await api.put('/patient/profile', {
                name: form.name, fatherName: form.fatherName,
                gender: form.gender || null, birthDate: form.birthDate || null,
                bloodGroup: form.bloodGroup || null, address: form.address,
                city: form.city, state: form.state, pincode: form.pincode,
                emergencyContactName: form.emergencyContactName,
                emergencyContactPhone: form.emergencyContactPhone,
                height: form.height ? parseFloat(form.height) : null,
                weight: form.weight ? parseFloat(form.weight) : null,
            });
            setProfile(data);
            setEditing(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setErrors(e => ({ ...e, general: err.response?.data?.message || 'Failed to save profile.' }));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                <div style={{ fontSize: '13px' }}>Loading your profile...</div>
            </div>
        </div>
    );

    const ini = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    const bmi = (form.height && form.weight && editing)
        ? (parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1)
        : (profile.height && profile.weight)
            ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
            : null;
    const bmiLabel = bmi
        ? bmi < 18.5 ? '⚠️ Underweight' : bmi < 25 ? '✅ Normal' : bmi < 30 ? '⚠️ Overweight' : '🔴 Obese'
        : null;

    const inp = { width: '100%', border: '1px solid #e5e7eb', borderRadius: '9px', padding: '9px 13px', fontSize: '13px', outline: 'none', background: '#fafafa', color: '#111', fontFamily: "'DM Sans',sans-serif", transition: 'border .15s', boxSizing: 'border-box' };
    const lbl = { fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px', display: 'block' };
    const val = { fontSize: '13px', fontWeight: 600, color: '#0f172a', padding: '2px 0' };

    function Field({ label, value, editKey, type = 'text', error, readOnly = false }) {
        return (
            <div>
                <label style={lbl}>{label}</label>
                {editing ? (
                    readOnly
                        ? <input style={{ ...inp, background: '#f0fdf4', border: '1px solid #bbf7d0', cursor: 'not-allowed' }} value={form[editKey] || value || ''} readOnly />
                        : <>
                            <input type={type} style={{ ...inp, borderColor: error ? '#fca5a5' : '#e5e7eb' }}
                                   value={form[editKey]} onChange={set(editKey)}
                                   onFocus={e => e.target.style.borderColor = '#1D9E75'}
                                   onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#e5e7eb'} />
                            {error && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px' }}>⚠ {error}</div>}
                        </>
                ) : (
                    <div style={val}>{value || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not set</span>}</div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', background: '#f0f4f8', fontFamily: "'DM Sans','Outfit',sans-serif", minHeight: '100%' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes pp-fadein { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
                .pp-avatar-wrap { cursor: pointer; position: relative; }
                .pp-avatar-overlay { opacity: 0; transition: opacity .2s; border-radius: 16px; }
                .pp-avatar-wrap:hover .pp-avatar-overlay { opacity: 1; }

                .pp-2col      { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .pp-hero-row  { display: flex; align-items: center; justify-content: space-between; }
                .pp-hero-left { display: flex; align-items: center; gap: 16px; }
                .pp-stats     { display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
                .pp-actions   { display: flex; gap: 8px; }

                @media (max-width: 768px) {
                    .pp-hero-row { flex-direction: column; align-items: flex-start !important; gap: 14px; }
                    .pp-actions  { width: 100%; }
                    .pp-actions button { flex: 1; }
                }
                @media (max-width: 600px) {
                    .pp-2col     { grid-template-columns: 1fr !important; }
                    .pp-stats > div { flex: 1; min-width: calc(50% - 6px); }
                    .pp-pad      { padding: 14px !important; }
                    .pp-hero-pad { padding: 18px 16px !important; }
                }
            `}</style>

            {/* HERO */}
            <div className="pp-hero-pad" style={{ background: 'linear-gradient(135deg,#0a4f3a,#1D9E75)', padding: '24px 28px', flexShrink: 0 }}>
                <div className="pp-hero-row">
                    <div className="pp-hero-left">

                        {/* AVATAR with change/remove dropdown */}
                        <div style={{ position: 'relative', flexShrink: 0 }} ref={avatarMenuRef}>
                            <div className="pp-avatar-wrap" onClick={() => setShowAvatarMenu(v => !v)}>
                                {avatar ? (
                                    <img src={avatar} alt="avatar" style={{ width: 60, height: 60, borderRadius: 16, objectFit: 'cover', border: '2px solid rgba(255,255,255,.35)', display: 'block' }} />
                                ) : (
                                    <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', border: '2px solid rgba(255,255,255,.25)' }}>
                                        {ini}
                                    </div>
                                )}
                                <div className="pp-avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                    <div style={{ fontSize: 14 }}>📷</div>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>Edit</div>
                                </div>
                            </div>

                            {/* DROPDOWN */}
                            {showAvatarMenu && (
                                <div style={{ position: 'absolute', top: 70, left: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.18)', border: '1px solid #e2e8f0', minWidth: 160, zIndex: 9999, animation: 'pp-fadein .15s ease' }}>
                                    <button
                                        onClick={() => { fileInputRef.current?.click(); setShowAvatarMenu(false); }}
                                        style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#0a4f3a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                        📷 Change Photo
                                    </button>
                                    {avatar !== null && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            style={{ width: '100%', padding: '11px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                            🗑️ Remove Photo
                                        </button>
                                    )}
                                </div>
                            )}

                            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                        </div>

                        <div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Patient Profile</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',serif" }}>{profile.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>{profile.email} · {profile.phone}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', marginTop: 3 }}>📷 Click photo to change or remove</div>
                        </div>
                    </div>

                    <div className="pp-actions">
                        {editing ? (
                            <>
                                <button onClick={() => { setEditing(false); setErrors({}); fetchProfile(); }}
                                        style={{ padding: '8px 18px', borderRadius: 9, border: '1px solid rgba(255,255,255,.3)', background: 'transparent', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                        style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: '#fff', color: '#0a4f3a', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
                                    {saving ? '⏳ Saving...' : '✓ Save'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setEditing(true)}
                                    style={{ padding: '8px 20px', borderRadius: 9, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick stats */}
                <div className="pp-stats">
                    {[
                        { label: 'Blood Group', value: profile.bloodGroup?.replace('_POSITIVE',' +').replace('_NEGATIVE',' −') || '—' },
                        { label: 'Height',      value: profile.height ? `${profile.height} cm` : '—' },
                        { label: 'Weight',      value: profile.weight ? `${profile.weight} kg` : '—' },
                        { label: 'BMI',         value: bmi ? `${bmi} · ${bmiLabel}` : '—' },
                    ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 10, padding: '8px 14px' }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }}>{s.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Toasts */}
            {saved && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ✅ Profile updated successfully!
                </div>
            )}
            {errors.general && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠️ {errors.general}
                </div>
            )}

            <div className="pp-pad" style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Personal Info */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf2', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>👤 Personal Information</div>
                    <div className="pp-2col">
                        <Field label="Full Name"     value={profile.name}       editKey="name"       error={errors.name} />
                        <Field label="Father's Name" value={profile.fatherName} editKey="fatherName" />
                        <div>
                            <label style={lbl}>Email <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>Account</span></label>
                            <div style={val}>{profile.email}</div>
                        </div>
                        <div>
                            <label style={lbl}>Phone <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>Account</span></label>
                            <div style={val}>{profile.phone}</div>
                        </div>
                        <div>
                            <label style={lbl}>Gender</label>
                            {editing ? (
                                <select style={inp} value={form.gender} onChange={set('gender')}
                                        onFocus={e => e.target.style.borderColor = '#1D9E75'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                                    <option value="">Select gender</option>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            ) : (
                                <div style={val}>{profile.gender || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not set</span>}</div>
                            )}
                        </div>
                        <div>
                            <label style={lbl}>Date of Birth</label>
                            {editing ? (
                                <input type="date" style={inp} value={form.birthDate} onChange={set('birthDate')}
                                       onFocus={e => e.target.style.borderColor = '#1D9E75'}
                                       onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            ) : (
                                <div style={val}>
                                    {profile.birthDate
                                        ? new Date(profile.birthDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not set</span>
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf2', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>📍 Address</div>
                    <div className="pp-2col">
                        <div style={{ gridColumn: '1 / -1' }}>
                            <Field label="Street Address" value={profile.address} editKey="address" />
                        </div>
                        <Field label="City"    value={profile.city}    editKey="city" />
                        <Field label="State"   value={profile.state}   editKey="state" />
                        <Field label="Pincode" value={profile.pincode} editKey="pincode" error={errors.pincode} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf2', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>🚨 Emergency Contact</div>
                    <div className="pp-2col">
                        <Field label="Contact Name"  value={profile.emergencyContactName}  editKey="emergencyContactName" />
                        <Field label="Contact Phone" value={profile.emergencyContactPhone} editKey="emergencyContactPhone" error={errors.emergencyContactPhone} />
                    </div>
                </div>

                {/* Health Info */}
                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf2', padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>🏥 Health Information</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Blood Group */}
                        <div>
                            <label style={lbl}>Blood Group</label>
                            {editing ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 4 }}>
                                    {bloodGroups.map(bg => (
                                        <button key={bg} type="button"
                                                onClick={() => setForm(f => ({ ...f, bloodGroup: bg }))}
                                                style={{ padding: '9px 6px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .15s', border: form.bloodGroup === bg ? '2px solid #0a4f3a' : '1px solid #e5e7eb', background: form.bloodGroup === bg ? '#E1F5EE' : '#fff', color: form.bloodGroup === bg ? '#0a4f3a' : '#374151' }}>
                                            {bloodGroupLabels[bg]}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', padding: '2px 0' }}>
                                    {profile.bloodGroup
                                        ? <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                                            {profile.bloodGroup.replace('_POSITIVE',' +').replace('_NEGATIVE',' −')}
                                          </span>
                                        : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not set</span>
                                    }
                                </div>
                            )}
                        </div>

                        {/* Height & Weight */}
                        <div className="pp-2col">
                            <div>
                                <label style={lbl}>Height (cm)</label>
                                {editing
                                    ? <input type="number" style={inp} value={form.height} onChange={set('height')} onFocus={e => e.target.style.borderColor = '#1D9E75'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    : <div style={val}>{profile.height ? `${profile.height} cm` : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not set</span>}</div>
                                }
                            </div>
                            <div>
                                <label style={lbl}>Weight (kg)</label>
                                {editing
                                    ? <input type="number" style={inp} value={form.weight} onChange={set('weight')} onFocus={e => e.target.style.borderColor = '#1D9E75'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    : <div style={val}>{profile.weight ? `${profile.weight} kg` : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Not set</span>}</div>
                                }
                            </div>
                        </div>

                        {/* BMI */}
                        {bmi && (
                            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: '#15803d', marginBottom: 2 }}>BMI (Body Mass Index)</div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0a4f3a' }}>{bmi}</div>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{bmiLabel}</div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}