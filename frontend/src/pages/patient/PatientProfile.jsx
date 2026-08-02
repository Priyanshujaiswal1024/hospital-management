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
    Calendar as CalendarIcon, 
    Sparkles, 
    Activity,
    Award
} from 'lucide-react';

const bloodGroups = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'];
const bloodGroupLabels = { A_POSITIVE:'A+', A_NEGATIVE:'A−', B_POSITIVE:'B+', B_NEGATIVE:'B−', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB−', O_POSITIVE:'O+', O_NEGATIVE:'O−' };

/* ── Shared Style Definitions ── */
const INP_STYLE = {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    background: '#ffffff',
    color: '#0f172a',
    fontFamily: "'DM Sans', 'Inter', sans-serif",
    transition: 'all 0.15s ease',
    boxSizing: 'border-box'
};

const LBL_STYLE = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
    display: 'block'
};

const VAL_STYLE = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    padding: '4px 0',
    minHeight: '22px',
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
                        {error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>⚠ {error}</div>}
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
                            padding: '10px 12px',
                            background: '#f0fdf4',
                            borderRight: '1px solid #cbd5e1',
                            fontSize: '13px',
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
                                padding: '10px 12px',
                                fontSize: '13px',
                                background: 'transparent',
                                color: '#0f172a',
                                fontFamily: "'DM Sans', sans-serif"
                            }}
                        />
                        {isTouched && (
                            <div style={{ padding: '10px', display: 'flex', alignItems: 'center', fontSize: '13px', flexShrink: 0 }}>
                                {isValid ? '✅' : '❌'}
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '4px', color: error ? '#ef4444' : (isTouched && !isValid ? '#d97706' : '#94a3b8') }}>
                        {error
                            ? `⚠ ${error}`
                            : isTouched && raw.length < 10
                                ? `⚠ ${10 - raw.length} more digit${10 - raw.length !== 1 ? 's' : ''} needed`
                                : isTouched && !/^[6-9]/.test(raw)
                                    ? '⚠ Must start with 6, 7, 8 or 9'
                                    : isValid
                                        ? '✓ Valid Indian mobile number'
                                        : 'Enter 10-digit Indian mobile number'
                        }
                    </div>
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
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'calendar'

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
        if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) e.pincode = 'Invalid 6-digit pincode';
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
            setErrors(e => ({ ...e, general: err.response?.data?.message || 'Failed to save profile changes.' }));
        } finally {
            setSaving(false);
        }
    }

    if (loading || !profile) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'spin 1.5s infinite linear' }}>⏳</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading profile information...</div>
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
    const expiringSoon = isInsuranceActive && daysUntilExpiry !== null && daysUntilExpiry <= 30;

    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#f8fafc',
            fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
            minHeight: '100%',
            color: '#0f172a'
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
                
                .profile-hero {
                    background: linear-gradient(135deg, #0f172a 0%, #0f766e 60%, #0d9488 100%);
                    position: relative;
                    overflow: hidden;
                }
                .hero-grid {
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 28px;
                    align-items: start;
                }
                .card-shadow {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
                }
                .nav-tab-btn {
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                    border: none;
                }
                .nav-tab-btn.active {
                    background: #ffffff;
                    color: #0f766e;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
                }
                .nav-tab-btn.inactive {
                    background: transparent;
                    color: #64748b;
                }
                .nav-tab-btn.inactive:hover {
                    background: rgba(255,255,255,0.6);
                    color: #0f172a;
                }
                @media (max-width: 1024px) {
                    .hero-grid { grid-template-columns: 1fr; }
                }
                @media (max-width: 640px) {
                    .pp-2col { grid-template-columns: 1fr !important; }
                    .hero-pad { padding: 20px 16px !important; }
                }
            `}</style>

            {/* ══════════════════════════════════════════════════════
                HERO SECTION
            ══════════════════════════════════════════════════════ */}
            <div className="profile-hero hero-pad" style={{ padding: '32px 36px 36px' }}>
                {/* Decorative background shapes */}
                <div style={{ position: 'absolute', top: '-100px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

                <div className="hero-grid">
                    {/* Left Profile Summary */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', marginBottom: '24px' }}>
                            {/* Avatar Uploader */}
                            <div style={{ position: 'relative', flexShrink: 0 }} ref={avatarMenuRef}>
                                {avatar ? (
                                    <img
                                        src={avatar}
                                        alt="Avatar"
                                        style={{
                                            width: '96px',
                                            height: '96px',
                                            borderRadius: '24px',
                                            objectFit: 'cover',
                                            border: '3.5px solid rgba(255,255,255,0.3)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                                            display: 'block'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '96px',
                                        height: '96px',
                                        borderRadius: '24px',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))',
                                        border: '3.5px solid rgba(255,255,255,0.3)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '34px',
                                        fontWeight: 800,
                                        color: '#ffffff',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif"
                                    }}>
                                        {ini}
                                    </div>
                                )}

                                <button
                                    onClick={() => setShowAvatarMenu(v => !v)}
                                    style={{
                                        position: 'absolute',
                                        bottom: '-8px',
                                        right: '-8px',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '10px',
                                        background: '#ffffff',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 2,
                                        transition: 'transform 0.15s ease'
                                    }}
                                    title="Change photo"
                                >
                                    <Camera size={16} color="#0f766e" />
                                </button>

                                {showAvatarMenu && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '110px',
                                        left: 0,
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
                                        border: '1px solid #e2e8f0',
                                        minWidth: '180px',
                                        zIndex: 99,
                                        overflow: 'hidden'
                                    }}>
                                        <button
                                            onClick={() => { fileInputRef.current?.click(); setShowAvatarMenu(false); }}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                background: 'none',
                                                border: 'none',
                                                borderBottom: '1px solid #f1f5f9',
                                                textAlign: 'left',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#0f766e',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <Camera size={14} /> Upload New Photo
                                        </button>
                                        {avatar !== null && (
                                            <button
                                                onClick={handleRemoveAvatar}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px 16px',
                                                    background: 'none',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                            >
                                                <X size={14} /> Remove Photo
                                            </button>
                                        )}
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                            </div>

                            {/* Main Info */}
                            <div style={{ paddingTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.18)',
                                        color: '#ffffff',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Sparkles size={10} /> Patient Account
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h1 style={{
                                        fontSize: '28px',
                                        fontWeight: 800,
                                        color: '#ffffff',
                                        margin: 0,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        letterSpacing: '-0.02em'
                                    }}>
                                        {profile.name}
                                    </h1>
                                    {!editing && (
                                        <button
                                            onClick={() => setEditing(true)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                background: 'rgba(255,255,255,0.15)',
                                                border: '1px solid rgba(255,255,255,0.25)',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                        >
                                            <Edit3 size={13} /> Edit Profile
                                        </button>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Mail size={14} style={{ opacity: 0.7 }} /> {profile.email}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Phone size={14} style={{ opacity: 0.7 }} /> {profile.phone}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Health Stats Row */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Blood Group', value: profile.bloodGroup?.replace('_POSITIVE', ' +').replace('_NEGATIVE', ' −') || '—', color: '#f43f5e' },
                                { label: 'Height', value: profile.height ? `${profile.height} cm` : '—', color: '#3b82f6' },
                                { label: 'Weight', value: profile.weight ? `${profile.weight} kg` : '—', color: '#10b981' },
                                { label: 'BMI', value: bmi ? `${bmi} · ${bmiLabel}` : '—', color: '#8b5cf6' },
                            ].map(s => (
                                <div
                                    key={s.label}
                                    style={{
                                        background: 'rgba(255,255,255,0.12)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.18)',
                                        borderRadius: '14px',
                                        padding: '10px 18px',
                                        minWidth: '100px'
                                    }}
                                >
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '3px' }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                                        {s.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Insurance Card Widget */}
                    <div>
                        {insuranceLoading ? (
                            <div style={{ width: '100%', height: '170px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }} />
                        ) : !insurance ? (
                            <button
                                onClick={() => navigate('/patient/insurance')}
                                style={{
                                    width: '100%',
                                    padding: '24px 20px',
                                    borderRadius: '20px',
                                    border: '2px dashed rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(10px)',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            >
                                <ShieldCheck size={32} color="#5eead4" />
                                <div style={{ fontSize: '14px', fontWeight: 800 }}>No Health Insurance Added</div>
                                <div style={{ fontSize: '11px', opacity: 0.7, textAlign: 'center' }}>Link your policy for quick claim processing</div>
                                <div style={{ marginTop: '4px', padding: '6px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 700 }}>
                                    + Add Insurance Policy
                                </div>
                            </button>
                        ) : (
                            <div
                                onClick={() => navigate('/patient/insurance')}
                                style={{
                                    width: '100%',
                                    borderRadius: '20px',
                                    background: isInsuranceActive
                                        ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
                                        : 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
                                    boxShadow: isInsuranceActive
                                        ? '0 12px 30px rgba(13, 148, 136, 0.4)'
                                        : '0 12px 30px rgba(220, 38, 38, 0.4)',
                                    padding: '22px 24px',
                                    color: '#ffffff',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '170px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Health Insurance</div>
                                        <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: '2px' }}>{insurance.provider}</div>
                                    </div>
                                    <span style={{
                                        background: isInsuranceActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        letterSpacing: '0.05em'
                                    }}>
                                        {isInsuranceActive ? '✓ ACTIVE' : 'EXPIRED'}
                                    </span>
                                </div>

                                <div style={{ margin: '14px 0 8px' }}>
                                    <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Policy Number</div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.06em' }}>{insurance.policyNumber}</div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>Valid Until</div>
                                        <div style={{ fontSize: '12px', fontWeight: 700 }}>
                                            {new Date(insurance.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    {isInsuranceActive && daysUntilExpiry !== null && (
                                        <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>
                                            {expiringSoon && '⚠️ '}{daysUntilExpiry} days left
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Header Save/Cancel Actions when editing */}
                        {editing && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => { setEditing(false); setErrors({}); fetchProfile(); }}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        background: 'transparent',
                                        color: '#ffffff',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#ffffff',
                                        color: '#0f766e',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    {saving ? 'Saving...' : '✓ Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toasts / Notifications */}
            {saved && (
                <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', padding: '12px 36px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <Check size={16} /> Profile updated successfully!
                </div>
            )}
            {errors.general && (
                <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#dc2626', fontSize: '13px', padding: '12px 36px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <AlertCircle size={16} /> {errors.general}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                MAIN CONTENT BODY WITH NAVIGATION TABS
            ══════════════════════════════════════════════════════ */}
            <div style={{ flex: 1, padding: '24px 36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Navigation Tabs Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#e2e8f0',
                    padding: '4px',
                    borderRadius: '14px',
                    width: 'fit-content'
                }}>
                    <button
                        className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : 'inactive'}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={16} /> Profile Details
                    </button>
                    <button
                        className={`nav-tab-btn ${activeTab === 'calendar' ? 'active' : 'inactive'}`}
                        onClick={() => setActiveTab('calendar')}
                    >
                        <CalendarIcon size={16} /> Appointments Calendar
                    </button>
                </div>

                {/* TAB 1: PROFILE DETAILS */}
                {activeTab === 'profile' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Personal Information Card */}
                        <div className="card-shadow" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <User size={16} /> Personal Information
                            </div>
                            <div className="pp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <Field label="Full Name" value={profile.name} editKey="name" error={errors.name} editing={editing} form={form} onChange={setField} />
                                <Field label="Father's Name" value={profile.fatherName} editKey="fatherName" editing={editing} form={form} onChange={setField} />

                                <div>
                                    <label style={LBL_STYLE}>Email <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 800 }}>Verified</span></label>
                                    <div style={VAL_STYLE}>{profile.email}</div>
                                </div>
                                <div>
                                    <label style={LBL_STYLE}>Phone <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontSize: '9px', fontWeight: 800 }}>Account</span></label>
                                    <div style={VAL_STYLE}>{profile.phone}</div>
                                </div>

                                <div>
                                    <label style={LBL_STYLE}>Gender</label>
                                    {editing ? (
                                        <select
                                            style={INP_STYLE}
                                            value={form.gender || ''}
                                            onChange={e => setField('gender', e.target.value)}
                                            onFocus={e => e.target.style.borderColor = '#0d9488'}
                                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
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
                                            onFocus={e => e.target.style.borderColor = '#0d9488'}
                                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
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

                        {/* Address Card */}
                        <div className="card-shadow" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <MapPin size={16} /> Residential Address
                            </div>
                            <div className="pp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <Field label="Street Address" value={profile.address} editKey="address" editing={editing} form={form} onChange={setField} />
                                </div>
                                <Field label="City" value={profile.city} editKey="city" editing={editing} form={form} onChange={setField} />
                                <Field label="State" value={profile.state} editKey="state" editing={editing} form={form} onChange={setField} />
                                <Field label="Pincode" value={profile.pincode} editKey="pincode" editing={editing} form={form} onChange={setField} error={errors.pincode} />
                            </div>
                        </div>

                        {/* Emergency Contact Card */}
                        <div className="card-shadow" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} /> Emergency Contact
                            </div>
                            <div className="pp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <Field label="Contact Name" value={profile.emergencyContactName} editKey="emergencyContactName" editing={editing} form={form} onChange={setField} />
                                <PhoneField label="Contact Phone" editKey="emergencyContactPhone" error={errors.emergencyContactPhone} editing={editing} form={form} onChange={setField} />
                            </div>
                        </div>

                        {/* Health Information & Body Metrics Card */}
                        <div className="card-shadow" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #e2e8f0', padding: '24px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Heart size={16} /> Health Information & Vitals
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={LBL_STYLE}>Blood Group</label>
                                    {editing ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                                            {bloodGroups.map(bg => (
                                                <button
                                                    key={bg}
                                                    type="button"
                                                    onClick={() => setField('bloodGroup', bg)}
                                                    style={{
                                                        padding: '10px 8px',
                                                        borderRadius: '10px',
                                                        fontSize: '13px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
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
                                                <span style={{ background: '#ffe4e6', color: '#e11d48', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 800 }}>
                                                    {profile.bloodGroup.replace('_POSITIVE', ' +').replace('_NEGATIVE', ' −')}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="pp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={LBL_STYLE}>Height (cm)</label>
                                        {editing ? (
                                            <input
                                                type="number"
                                                style={INP_STYLE}
                                                value={form.height || ''}
                                                onChange={e => setField('height', e.target.value)}
                                                onFocus={e => e.target.style.borderColor = '#0d9488'}
                                                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
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
                                                onFocus={e => e.target.style.borderColor = '#0d9488'}
                                                onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                                            />
                                        ) : (
                                            <div style={VAL_STYLE}>{profile.weight ? `${profile.weight} kg` : <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Not set</span>}</div>
                                        )}
                                    </div>
                                </div>

                                {bmi && (
                                    <div style={{
                                        background: '#f0fdf4',
                                        borderRadius: '12px',
                                        border: '1px solid #bbf7d0',
                                        padding: '14px 18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', marginBottom: '2px' }}>BMI (Body Mass Index)</div>
                                            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f766e' }}>{bmi}</div>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803d' }}>
                                            {bmiLabel}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: APPOINTMENTS CALENDAR */}
                {activeTab === 'calendar' && (
                    <div>
                        <AppointmentCalendar />
                    </div>
                )}
            </div>
        </div>
    );
}