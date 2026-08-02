import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AppointmentCalendar from '../../components/AppointmentCalendar';
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    AlertCircle, 
    Heart, 
    Camera, 
    Edit3, 
    Check, 
    X, 
    ShieldCheck, 
    Sparkles, 
    Activity
} from 'lucide-react';

const bloodGroups = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'];
const bloodGroupLabels = { A_POSITIVE:'A+', A_NEGATIVE:'A−', B_POSITIVE:'B+', B_NEGATIVE:'B−', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB−', O_POSITIVE:'O+', O_NEGATIVE:'O−' };

/* ── Shared Style Definitions ── */
const INP_STYLE = {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '9px 12px',
    fontSize: '13px',
    outline: 'none',
    background: '#ffffff',
    color: '#0f172a',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    transition: 'all 0.15s ease',
    boxSizing: 'border-box'
};

const LBL_STYLE = {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
    display: 'block'
};

const VAL_STYLE = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    padding: '2px 0',
    minHeight: '20px',
    display: 'flex',
    alignItems: 'center'
};

/* ── Generic Input Field ── */
function Field({ label, value, editKey, type = 'text', error, readOnly = false, editing, form, onChange }) {
    return (
        <div>
            <label style={LBL_STYLE}>{label}</label>
            {editing ? (
                readOnly ? (
                    <input 
                        style={{ ...INP_STYLE, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'not-allowed', color: '#64748b' }} 
                        value={form[editKey] || value || ''} 
                        readOnly 
                    />
                ) : (
                    <>
                        <input
                            type={type}
                            style={{
                                ...INP_STYLE,
                                borderColor: error ? '#fca5a5' : '#cbd5e1',
                                boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none'
                            }}
                            value={form[editKey] !== undefined ? form[editKey] : (value || '')}
                            onChange={e => onChange(editKey, e.target.value)}
                            onFocus={e => e.target.style.borderColor = '#0d9488'}
                            onBlur={e => e.target.style.borderColor = error ? '#fca5a5' : '#cbd5e1'}
                        />
                        {error && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px' }}>⚠ {error}</div>}
                    </>
                )
            ) : (
                <div style={VAL_STYLE}>
                    {value || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}
                </div>
            )}
        </div>
    );
}

/* ── Phone Field with +91 Prefix ── */
function PhoneField({ label, editKey, error, editing, form, onChange }) {
    const raw = (form[editKey] || '').replace(/^\+91\s?/, '');

    function handleChange(e) {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        onChange(editKey, digits ? `+91 ${digits}` : '');
    }

    const isValid = raw.length === 10 && /^[6-9]/.test(raw);
    const isTouched = raw.length > 0;
    const borderColor = error ? '#fca5a5' : (isTouched && !isValid ? '#f59e0b' : '#cbd5e1');

    return (
        <div>
            <label style={LBL_STYLE}>{label}</label>
            {editing ? (
                <>
                    <div style={{
                        display: 'flex',
                        borderRadius: '10px',
                        border: `1px solid ${borderColor}`,
                        background: '#ffffff',
                        overflow: 'hidden',
                        transition: 'border 0.15s'
                    }}>
                        <div style={{
                            padding: '9px 10px',
                            background: '#f0fdf4',
                            borderRight: '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#0f766e',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0
                        }}>
                            🇮🇳 +91
                        </div>
                        <input
                            type="tel"
                            inputMode="numeric"
                            placeholder="98765 43210"
                            maxLength={10}
                            value={raw}
                            onChange={handleChange}
                            style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                padding: '9px 10px',
                                fontSize: '13px',
                                background: 'transparent',
                                color: '#0f172a',
                                fontFamily: "'DM Sans', sans-serif"
                            }}
                        />
                    </div>
                    {error && <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '3px' }}>⚠ {error}</div>}
                </>
            ) : (
                <div style={VAL_STYLE}>
                    {form[editKey] ? (
                        <span style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>{form[editKey]}</span>
                    ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>
                    )}
                </div>
            )}
        </div>
    );
}

export default function PatientProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({});
    const [editing, setEditing] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatar, setAvatar] = useState(null);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const [insurance, setInsurance] = useState(null);
    const [insuranceLoading, setInsuranceLoading] = useState(true);

    const fileInputRef = useRef();
    const avatarMenuRef = useRef();

    useEffect(() => {
        fetchProfile();
        fetchInsurance();
    }, []);

    useEffect(() => {
        function handleClick(e) {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target))
                setShowAvatarMenu(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function fetchProfile() {
        try {
            const { data } = await api.get('/patient/profile');
            setProfile(data);
            setForm({
                name: data.name || '',
                fatherName: data.fatherName || '',
                gender: data.gender || '',
                birthDate: data.birthDate || '',
                bloodGroup: data.bloodGroup || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                pincode: data.pincode || '',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                height: data.height || '',
                weight: data.weight || '',
            });
            setAvatar(localStorage.getItem(`avatar_${data.email}`) || null);
        } catch {
            navigate('/patient/create-profile', { replace: true });
        } finally {
            setLoading(false);
        }
    }

    async function fetchInsurance() {
        try {
            const { data } = await api.get('/patient/insurance');
            setInsurance(data);
        } catch {
            setInsurance(null);
        } finally {
            setInsuranceLoading(false);
        }
    }

    function avatarKey() { return `avatar_${profile?.email}`; }

    function handleAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setErrors(ev => ({ ...ev, general: 'Image must be under 5MB' })); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const b64 = ev.target.result;
            setAvatar(b64);
            localStorage.setItem(avatarKey(), b64);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
        setShowAvatarMenu(false);
    }

    function handleRemoveAvatar() {
        setAvatar(null);
        localStorage.removeItem(avatarKey());
        setShowAvatarMenu(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }

    function validate() {
        const e = {};
        if (!form.name?.trim()) e.name = 'Name is required';
        if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) e.pincode = 'Invalid pincode';
        if (form.emergencyContactPhone) {
            const digits = form.emergencyContactPhone.replace(/^\+91\s?/, '').replace(/\D/g, '');
            if (digits.length !== 10 || !/^[6-9]/.test(digits))
                e.emergencyContactPhone = 'Enter a valid 10-digit Indian mobile number';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        try {
            const { data } = await api.put('/patient/profile', {
                name: form.name,
                fatherName: form.fatherName,
                gender: form.gender || null,
                birthDate: form.birthDate || null,
                bloodGroup: form.bloodGroup || null,
                address: form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
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
            setErrors(e => ({ ...e, general: err.response?.data?.message || 'Failed to save.' }));
        } finally {
            setSaving(false);
        }
    }

    if (loading || !profile) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>Loading profile...</div>
            </div>
        </div>
    );

    const ini = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';
    const bmi = (form.height && form.weight && editing)
        ? (parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1)
        : (profile.height && profile.weight)
            ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
            : null;

    const bmiLabel = bmi
        ? bmi < 18.5 ? '⚠️ Underweight' : bmi < 25 ? '✅ Normal' : bmi < 30 ? '⚠️ Overweight' : '🔴 Obese'
        : null;

    const isInsuranceActive = insurance?.validUntil ? new Date(insurance.validUntil) >= new Date() : false;
    const daysUntilExpiry = insurance?.validUntil
        ? Math.ceil((new Date(insurance.validUntil) - new Date()) / 86400000) : null;

    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f1f5f9',
            fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
            minHeight: '100%',
            color: '#0f172a'
        }}>
            <style>{`
                .profile-header-gradient {
                    background: linear-gradient(135deg, #0f172a 0%, #0f766e 60%, #0d9488 100%);
                }
                .dashboard-main-grid {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 20px;
                    align-items: start;
                }
                .card-widget {
                    background: #ffffff;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }
                @media (max-width: 1080px) {
                    .dashboard-main-grid { grid-template-columns: 1fr; }
                }
                @media (max-width: 640px) {
                    .grid-2col { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* ══════════════════════════════════════════════════════
                COMPACT HERO HEADER
            ══════════════════════════════════════════════════════ */}
            <div className="profile-header-gradient" style={{ padding: '24px 28px', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    
                    {/* User Info Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative' }} ref={avatarMenuRef}>
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt="Avatar"
                                    style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '18px',
                                        objectFit: 'cover',
                                        border: '3px solid rgba(255,255,255,0.3)',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '18px',
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '26px',
                                    fontWeight: 800,
                                    color: '#ffffff'
                                }}>
                                    {ini}
                                </div>
                            )}
                            <button
                                onClick={() => setShowAvatarMenu(v => !v)}
                                style={{
                                    position: 'absolute',
                                    bottom: '-6px',
                                    right: '-6px',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    background: '#ffffff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Camera size={13} color="#0f766e" />
                            </button>

                            {showAvatarMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '80px',
                                    left: 0,
                                    background: '#ffffff',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                                    border: '1px solid #e2e8f0',
                                    minWidth: '160px',
                                    zIndex: 99
                                }}>
                                    <button
                                        onClick={() => { fileInputRef.current?.click(); setShowAvatarMenu(false); }}
                                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#0f766e', cursor: 'pointer' }}
                                    >
                                        📷 Upload Photo
                                    </button>
                                    {avatar !== null && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#ef4444', cursor: 'pointer' }}
                                        >
                                            🗑️ Remove
                                        </button>
                                    )}
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                                    {profile.name}
                                </h2>
                                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                                    Verified Patient
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.85)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={13} /> {profile.email}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={13} /> {profile.phone}</span>
                            </div>
                        </div>
                    </div>

                    {/* Vitals Summary Pills & Edit Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: '10px', backdropFilter: 'blur(6px)' }}>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>Blood</div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{profile.bloodGroup?.replace('_POSITIVE', ' +').replace('_NEGATIVE', ' −') || '—'}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '6px 12px', borderRadius: '10px', backdropFilter: 'blur(6px)' }}>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>BMI</div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{bmi || '—'}</div>
                            </div>
                        </div>

                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    background: '#ffffff',
                                    border: 'none',
                                    color: '#0f766e',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                                }}
                            >
                                <Edit3 size={14} /> Edit Profile
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => { setEditing(false); setErrors({}); fetchProfile(); }}
                                    style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#ffffff', color: '#0f766e', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {saving ? 'Saving...' : '✓ Save'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toasts */}
            {saved && <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', padding: '8px 28px', fontWeight: 600 }}>✅ Profile saved successfully!</div>}
            {errors.general && <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', padding: '8px 28px', fontWeight: 600 }}>⚠️ {errors.general}</div>}

            {/* ══════════════════════════════════════════════════════
                MAIN 2-COLUMN DASHBOARD GRID
            ══════════════════════════════════════════════════════ */}
            <div style={{ padding: '20px 24px' }}>
                <div className="dashboard-main-grid">
                    
                    {/* LEFT COLUMN: Profile Details Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Personal Information */}
                        <div className="card-widget">
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={14} /> Personal Information
                            </div>
                            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Full Name" value={profile.name} editKey="name" error={errors.name} editing={editing} form={form} onChange={setField} />
                                <Field label="Father's Name" value={profile.fatherName} editKey="fatherName" editing={editing} form={form} onChange={setField} />
                                <div>
                                    <label style={LBL_STYLE}>Email <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>Account</span></label>
                                    <div style={VAL_STYLE}>{profile.email}</div>
                                </div>
                                <div>
                                    <label style={LBL_STYLE}>Phone <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '8px', fontSize: '9px', fontWeight: 700 }}>Account</span></label>
                                    <div style={VAL_STYLE}>{profile.phone}</div>
                                </div>
                                <div>
                                    <label style={LBL_STYLE}>Gender</label>
                                    {editing ? (
                                        <select
                                            style={INP_STYLE}
                                            value={form.gender || ''}
                                            onChange={e => setField('gender', e.target.value)}
                                        >
                                            <option value="">Select gender</option>
                                            <option>Male</option>
                                            <option>Female</option>
                                            <option>Other</option>
                                        </select>
                                    ) : (
                                        <div style={VAL_STYLE}>{profile.gender || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}</div>
                                    )}
                                </div>
                                <div>
                                    <label style={LBL_STYLE}>Date of Birth</label>
                                    {editing ? (
                                        <input
                                            type="date"
                                            style={INP_STYLE}
                                            value={form.birthDate || ''}
                                            onChange={e => setField('birthDate', e.target.value)}
                                        />
                                    ) : (
                                        <div style={VAL_STYLE}>
                                            {profile.birthDate
                                                ? new Date(profile.birthDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Residential Address */}
                        <div className="card-widget">
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} /> Residential Address
                            </div>
                            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Field label="Street Address" value={profile.address} editKey="address" editing={editing} form={form} onChange={setField} />
                                </div>
                                <Field label="City" value={profile.city} editKey="city" editing={editing} form={form} onChange={setField} />
                                <Field label="State" value={profile.state} editKey="state" editing={editing} form={form} onChange={setField} />
                                <Field label="Pincode" value={profile.pincode} editKey="pincode" editing={editing} form={form} onChange={setField} error={errors.pincode} />
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="card-widget">
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={14} /> Emergency Contact
                            </div>
                            <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <Field label="Contact Name" value={profile.emergencyContactName} editKey="emergencyContactName" editing={editing} form={form} onChange={setField} />
                                <PhoneField label="Contact Phone" editKey="emergencyContactPhone" error={errors.emergencyContactPhone} editing={editing} form={form} onChange={setField} />
                            </div>
                        </div>

                        {/* Health Information & Body Vitals */}
                        <div className="card-widget">
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Heart size={14} /> Health Information & Vitals
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={LBL_STYLE}>Blood Group</label>
                                    {editing ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
                                            {bloodGroups.map(bg => (
                                                <button
                                                    key={bg}
                                                    type="button"
                                                    onClick={() => setField('bloodGroup', bg)}
                                                    style={{
                                                        padding: '8px 4px',
                                                        borderRadius: '8px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        border: form.bloodGroup === bg ? '2px solid #0f766e' : '1px solid #cbd5e1',
                                                        background: form.bloodGroup === bg ? '#ccfbf1' : '#ffffff',
                                                        color: form.bloodGroup === bg ? '#0f766e' : '#334155'
                                                    }}
                                                >
                                                    {bloodGroupLabels[bg]}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={VAL_STYLE}>
                                            {profile.bloodGroup ? (
                                                <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '3px 12px', borderRadius: '14px', fontSize: '12px', fontWeight: 800 }}>
                                                    {profile.bloodGroup.replace('_POSITIVE', ' +').replace('_NEGATIVE', ' −')}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div>
                                        <label style={LBL_STYLE}>Height (cm)</label>
                                        {editing ? (
                                            <input
                                                type="number"
                                                style={INP_STYLE}
                                                value={form.height || ''}
                                                onChange={e => setField('height', e.target.value)}
                                            />
                                        ) : (
                                            <div style={VAL_STYLE}>{profile.height ? `${profile.height} cm` : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label style={LBL_STYLE}>Weight (kg)</label>
                                        {editing ? (
                                            <input
                                                type="number"
                                                style={INP_STYLE}
                                                value={form.weight || ''}
                                                onChange={e => setField('weight', e.target.value)}
                                            />
                                        ) : (
                                            <div style={VAL_STYLE}>{profile.weight ? `${profile.weight} kg` : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}</div>
                                        )}
                                    </div>
                                </div>

                                {bmi && (
                                    <div style={{
                                        background: '#f0fdf4',
                                        borderRadius: '10px',
                                        border: '1px solid #bbf7d0',
                                        padding: '10px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#166534' }}>BMI Score</div>
                                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f766e' }}>{bmi}</div>
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
                                            {bmiLabel}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Mini Calendar + Health Insurance Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Interactive Mini Calendar Component */}
                        <div>
                            <AppointmentCalendar compact={true} />
                        </div>

                        {/* Health Insurance Widget */}
                        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={14} /> Health Insurance
                            </div>

                            {insuranceLoading ? (
                                <div style={{ width: '100%', height: '120px', borderRadius: '12px', background: '#f1f5f9' }} />
                            ) : !insurance ? (
                                <button
                                    onClick={() => navigate('/patient/insurance')}
                                    style={{
                                        width: '100%',
                                        padding: '16px 14px',
                                        borderRadius: '14px',
                                        border: '2px dashed #cbd5e1',
                                        background: '#fafafa',
                                        color: '#475569',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <ShieldCheck size={24} color="#0d9488" />
                                    <div style={{ fontSize: '12px', fontWeight: 700 }}>No Insurance Linked</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>Add policy for instant claims</div>
                                </button>
                            ) : (
                                <div
                                    onClick={() => navigate('/patient/insurance')}
                                    style={{
                                        borderRadius: '14px',
                                        background: isInsuranceActive
                                            ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                                            : 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
                                        padding: '16px',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', opacity: 0.7, textTransform: 'uppercase', fontWeight: 700 }}>Policy Provider</div>
                                            <div style={{ fontSize: '14px', fontWeight: 800 }}>{insurance.provider}</div>
                                        </div>
                                        <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 800 }}>
                                            {isInsuranceActive ? '✓ ACTIVE' : 'EXPIRED'}
                                        </span>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '8px', opacity: 0.6, textTransform: 'uppercase' }}>Policy Number</div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}>{insurance.policyNumber}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}