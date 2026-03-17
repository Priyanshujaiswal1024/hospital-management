import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function DoctorProfile() {
    const [doctor,  setDoctor]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState('');
    const [form,    setForm]    = useState({ phoneNumber: '', bio: '' });

    useEffect(() => { fetchProfile(); }, []);

    async function fetchProfile() {
        setLoading(true);
        try {
            const { data } = await api.get('/doctors/profile');
            setDoctor(data);
            setForm({ phoneNumber: data.phoneNumber || '', bio: data.bio || '' });
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

    const inp = {
        width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px',
        padding: '10px 14px', fontSize: '12px', outline: 'none',
        background: '#f8faff', fontFamily: 'Outfit, sans-serif',
        boxSizing: 'border-box', transition: 'border .2s',
    };
    const lbl = {
        fontSize: '10px', fontWeight: 700, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '.06em',
        marginBottom: '5px', display: 'block',
    };

    if (loading) return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px',
        }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid #e5e7eb', borderTopColor: '#1e40af',
                animation: 'spin 1s linear infinite',
            }}/>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>Loading profile...</div>
        </div>
    );

    const initials = doctor?.name
        ?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'DR';

    const stats = [
        { icon: '🏥', label: 'Department',   value: doctor?.departments?.join(', ') || '—' },
        { icon: '⏳', label: 'Experience',   value: doctor?.experienceYears ? `${doctor.experienceYears} yrs` : '—' },
        { icon: '💰', label: 'Consult Fee',  value: doctor?.consultationFee ? `₹${doctor.consultationFee}` : '—' },
        { icon: '🩺', label: 'Specialization', value: doctor?.specialization || '—' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* topbar */}
            <div style={{
                background: '#fff', borderBottom: '1px solid #f0f0f0',
                padding: '12px 20px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>
                        My Profile
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                        View and manage your profile
                    </div>
                </div>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        style={{
                            padding: '8px 16px', borderRadius: '9px', border: 'none',
                            background: '#1e40af', color: '#fff', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#1e40af'}
                    >
                        ✏️ Edit Profile
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => { setEditing(false); setError(''); }}
                            style={{
                                padding: '8px 16px', borderRadius: '9px',
                                border: '1px solid #e5e7eb', background: '#fff',
                                color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >Cancel</button>
                        <button
                            onClick={handleSave} disabled={saving}
                            style={{
                                padding: '8px 16px', borderRadius: '9px', border: 'none',
                                background: saving ? '#9ca3af' : '#1e40af',
                                color: '#fff', fontSize: '12px', fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                            }}
                        >
                            {saving ? (
                                <>
                                    <div style={{
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        border: '2px solid rgba(255,255,255,.3)',
                                        borderTopColor: '#fff',
                                        animation: 'spin 1s linear infinite',
                                    }}/>
                                    Saving...
                                </>
                            ) : '✓ Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

                {/* alerts */}
                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca',
                        color: '#dc2626', fontSize: '12px', borderRadius: '10px',
                        padding: '10px 14px', marginBottom: '14px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>⚠️ {error}</div>
                )}
                {success && (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        color: '#166534', fontSize: '12px', borderRadius: '10px',
                        padding: '10px 14px', marginBottom: '14px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                    }}>✅ {success}</div>
                )}

                {/* ── HERO BANNER ── */}
                <div style={{
                    background: 'linear-gradient(135deg,#1e3a8a,#1e40af,#2563eb)',
                    borderRadius: '16px', padding: '24px 28px',
                    color: '#fff', marginBottom: '16px',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* decorative circles */}
                    <div style={{
                        position: 'absolute', right: '-30px', top: '-30px',
                        width: '150px', height: '150px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.06)',
                    }}/>
                    <div style={{
                        position: 'absolute', right: '80px', bottom: '-40px',
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.04)',
                    }}/>
                    <div style={{
                        position: 'absolute', left: '-20px', bottom: '-20px',
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.04)',
                    }}/>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* avatar */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            {doctor?.profileImageUrl ? (
                                <img
                                    src={doctor.profileImageUrl} alt="profile"
                                    style={{
                                        width: '76px', height: '76px', borderRadius: '18px',
                                        objectFit: 'cover',
                                        border: '3px solid rgba(255,255,255,.3)',
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '76px', height: '76px', borderRadius: '18px',
                                    background: 'rgba(255,255,255,.15)',
                                    backdropFilter: 'blur(4px)',
                                    color: '#fff', fontSize: '26px', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '3px solid rgba(255,255,255,.25)',
                                }}>
                                    {initials}
                                </div>
                            )}
                            {/* online dot */}
                            <div style={{
                                position: 'absolute', bottom: '2px', right: '2px',
                                width: '14px', height: '14px', borderRadius: '50%',
                                background: '#4ade80', border: '2px solid #1e40af',
                            }}/>
                        </div>

                        {/* name + info */}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '22px', fontWeight: 800,
                                fontFamily: "'Playfair Display', serif",
                                marginBottom: '2px',
                            }}>
                                Dr. {doctor?.name}
                            </div>
                            <div style={{ fontSize: '12px', opacity: .8, marginBottom: '2px' }}>
                                {doctor?.specialization}
                            </div>
                            <div style={{ fontSize: '11px', opacity: .6, marginBottom: '10px' }}>
                                📧 {doctor?.email}
                                {doctor?.phoneNumber && ` · 📞 ${doctor.phoneNumber}`}
                            </div>

                            {/* tags */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {doctor?.departments?.map(dep => (
                                    <span key={dep} style={{
                                        background: 'rgba(255,255,255,.15)',
                                        border: '1px solid rgba(255,255,255,.2)',
                                        padding: '3px 10px', borderRadius: '20px',
                                        fontSize: '10px', fontWeight: 600,
                                    }}>🏥 {dep}</span>
                                ))}
                                {doctor?.experienceYears && (
                                    <span style={{
                                        background: 'rgba(255,255,255,.15)',
                                        border: '1px solid rgba(255,255,255,.2)',
                                        padding: '3px 10px', borderRadius: '20px',
                                        fontSize: '10px', fontWeight: 600,
                                    }}>⏳ {doctor.experienceYears} yrs</span>
                                )}
                                <span style={{
                                    background: 'rgba(74,222,128,.2)',
                                    border: '1px solid rgba(74,222,128,.3)',
                                    padding: '3px 10px', borderRadius: '20px',
                                    fontSize: '10px', fontWeight: 600,
                                }}>● Active</span>
                            </div>
                        </div>

                        {/* fee card */}
                        <div style={{
                            background: 'rgba(255,255,255,.12)',
                            border: '1px solid rgba(255,255,255,.2)',
                            borderRadius: '14px', padding: '14px 20px',
                            textAlign: 'center', flexShrink: 0,
                        }}>
                            <div style={{ fontSize: '10px', opacity: .7, marginBottom: '4px' }}>
                                Consultation Fee
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 800 }}>
                                ₹{doctor?.consultationFee}
                            </div>
                            <div style={{ fontSize: '10px', opacity: .6, marginTop: '2px' }}>
                                per visit
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── STAT CARDS ── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    gap: '10px', marginBottom: '16px',
                }}>
                    {stats.map(s => (
                        <div key={s.label} style={{
                            background: '#fff', border: '1px solid #f0f0f0',
                            borderRadius: '12px', padding: '14px',
                            transition: 'all .15s',
                        }}
                             onMouseEnter={e => {
                                 e.currentTarget.style.borderColor = '#bfdbfe';
                                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,64,175,.06)';
                                 e.currentTarget.style.transform = 'translateY(-2px)';
                             }}
                             onMouseLeave={e => {
                                 e.currentTarget.style.borderColor = '#f0f0f0';
                                 e.currentTarget.style.boxShadow = 'none';
                                 e.currentTarget.style.transform = 'none';
                             }}
                        >
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                            <div style={{
                                fontSize: '13px', fontWeight: 700, color: '#111',
                                marginBottom: '2px', whiteSpace: 'nowrap',
                                overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>{s.value}</div>
                            <div style={{ fontSize: '10px', color: '#9ca3af' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── MAIN GRID ── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
                }}>

                    {/* professional info — READ ONLY */}
                    <div style={{
                        background: '#fff', border: '1px solid #f0f0f0',
                        borderRadius: '12px', padding: '18px', overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', marginBottom: '16px',
                        }}>
                            <div style={{
                                fontSize: '11px', fontWeight: 700, color: '#374151',
                                textTransform: 'uppercase', letterSpacing: '.07em',
                            }}>
                                📋 Professional Info
                            </div>
                            <span style={{
                                background: '#f3f4f6', color: '#6b7280',
                                fontSize: '9px', fontWeight: 600,
                                padding: '3px 8px', borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                            }}>
                                🔒 Admin Managed
                            </span>
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
                        }}>
                            {[
                                { label: 'Full Name',        value: doctor?.name,           icon: '👤' },
                                { label: 'Specialization',   value: doctor?.specialization, icon: '🩺' },
                                { label: 'Experience',       value: doctor?.experienceYears ? `${doctor.experienceYears} years` : '—', icon: '⏳' },
                                { label: 'Consult Fee',      value: doctor?.consultationFee ? `₹${doctor.consultationFee}` : '—', icon: '💰' },
                                { label: 'Department',       value: doctor?.departments?.join(', ') || '—', icon: '🏥' },
                                { label: 'Email',            value: doctor?.email,          icon: '📧' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: '#f9fafb', borderRadius: '9px',
                                    padding: '10px 12px',
                                }}>
                                    <label style={lbl}>{item.icon} {item.label}</label>
                                    <div style={{
                                        fontSize: '12px', fontWeight: 600, color: '#374151',
                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {item.value || '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* editable contact info */}
                        <div style={{
                            background: '#fff',
                            border: editing ? '1.5px solid #3b82f6' : '1px solid #f0f0f0',
                            borderRadius: '12px', padding: '18px',
                            transition: 'border .2s, box-shadow .2s',
                            boxShadow: editing ? '0 0 0 3px rgba(59,130,246,.08)' : 'none',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between', marginBottom: '16px',
                            }}>
                                <div style={{
                                    fontSize: '11px', fontWeight: 700, color: '#374151',
                                    textTransform: 'uppercase', letterSpacing: '.07em',
                                }}>
                                    📞 Contact Info
                                </div>
                                {editing ? (
                                    <span style={{
                                        background: '#eff6ff', color: '#1e40af',
                                        fontSize: '9px', fontWeight: 700,
                                        padding: '3px 8px', borderRadius: '6px',
                                        border: '1px solid #bfdbfe',
                                        animation: 'pulse 2s infinite',
                                    }}>✏️ Editing</span>
                                ) : (
                                    <span style={{
                                        background: '#f0fdf4', color: '#166534',
                                        fontSize: '9px', fontWeight: 600,
                                        padding: '3px 8px', borderRadius: '6px',
                                        border: '1px solid #bbf7d0',
                                    }}>✅ Editable</span>
                                )}
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={lbl}>📞 Phone Number</label>
                                {editing ? (
                                    <input
                                        style={inp}
                                        placeholder="+91 98765 43210"
                                        value={form.phoneNumber}
                                        onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                ) : (
                                    <div style={{
                                        background: '#f9fafb', borderRadius: '9px',
                                        padding: '10px 12px', fontSize: '13px',
                                        fontWeight: 600, color: '#374151',
                                    }}>
                                        {doctor?.phoneNumber || (
                                            <span style={{ color: '#9ca3af', fontWeight: 400 }}>
                                                Not added yet
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={lbl}>📝 Bio / About</label>
                                {editing ? (
                                    <textarea
                                        style={{
                                            ...inp, resize: 'vertical',
                                            minHeight: '90px', lineHeight: 1.6,
                                        }}
                                        placeholder="Write a short description about yourself, your expertise and approach to patient care..."
                                        value={form.bio}
                                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                        onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                ) : (
                                    <div style={{
                                        background: '#f9fafb', borderRadius: '9px',
                                        padding: '12px', fontSize: '12px',
                                        color: doctor?.bio ? '#374151' : '#9ca3af',
                                        lineHeight: 1.7, minHeight: '60px',
                                        fontStyle: doctor?.bio ? 'normal' : 'italic',
                                    }}>
                                        {doctor?.bio || 'No bio added yet. Click Edit Profile to add your bio.'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* admin note */}
                        <div style={{
                            background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                            border: '1px solid #bfdbfe',
                            borderRadius: '12px', padding: '14px 16px',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                            }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: '#1e40af', color: '#fff',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '14px',
                                    flexShrink: 0,
                                }}>ℹ️</div>
                                <div>
                                    <div style={{
                                        fontSize: '11px', fontWeight: 700,
                                        color: '#1e40af', marginBottom: '4px',
                                    }}>
                                        Admin Managed Fields
                                    </div>
                                    <div style={{
                                        fontSize: '11px', color: '#1e40af',
                                        opacity: .8, lineHeight: 1.6,
                                    }}>
                                        Your name, specialization, consultation fee and department
                                        are managed by hospital administration.
                                        Contact admin to update those details.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* quick stats */}
                        <div style={{
                            background: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
                            borderRadius: '12px', padding: '14px 16px',
                            color: '#fff',
                        }}>
                            <div style={{
                                fontSize: '10px', fontWeight: 700, opacity: .6,
                                textTransform: 'uppercase', letterSpacing: '.07em',
                                marginBottom: '12px',
                            }}>
                                Quick Summary
                            </div>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                            }}>
                                {[
                                    { label: 'Doctor ID',  value: `#${doctor?.id || '—'}` },
                                    { label: 'Status',      value: '🟢 Active' },
                                    { label: 'Fee',         value: `₹${doctor?.consultationFee || '—'}` },
                                    { label: 'Exp',         value: `${doctor?.experienceYears || '—'} yrs` },
                                ].map(item => (
                                    <div key={item.label}>
                                        <div style={{ fontSize: '9px', opacity: .5, marginBottom: '2px' }}>
                                            {item.label}
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>
                                            {item.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%,100% { opacity:1; } 50% { opacity:.6; }
                }
            `}</style>
        </div>
    );
}