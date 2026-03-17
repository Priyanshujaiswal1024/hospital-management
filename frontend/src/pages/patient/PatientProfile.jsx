import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../../api/axios';

const bloodGroupLabels = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A−', B_POSITIVE: 'B+', B_NEGATIVE: 'B−',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB−', O_POSITIVE: 'O+', O_NEGATIVE: 'O−',
};

export default function PatientProfile() {
    const navigate = useNavigate();
    const [profile,   setProfile]   = useState(null);
    const [insurance, setInsurance] = useState(null); // ✅ new
    const [loading,   setLoading]   = useState(true);
    const [editing,   setEditing]   = useState(false);
    const [saving,    setSaving]    = useState(false);
    const [error,     setError]     = useState('');
    const [success,   setSuccess]   = useState('');
    const [form,      setForm]      = useState({});

    useEffect(() => { fetchProfile(); fetchInsurance(); }, []);

    async function fetchProfile() {
        setLoading(true);
        try {
            const { data } = await api.get('/patient/profile');
            setProfile(data);
            setForm({
                phone:                 data.phone                 || '',
                address:               data.address               || '',
                city:                  data.city                  || '',
                state:                 data.state                 || '',
                pincode:               data.pincode               || '',
                emergencyContactName:  data.emergencyContactName  || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                height:                data.height                || '',
                weight:                data.weight                || '',
            });
        } catch (err) {
            const status = err.response?.status;
            if (status === 404 || status === 400 || status === 500) {
                navigate('/patient/create-profile');
            }
        } finally {
            setLoading(false);
        }
    }

    // ✅ Insurance fetch
    async function fetchInsurance() {
        try {
            const { data } = await api.get('/patient/insurance');
            setInsurance(data);
        } catch {
            setInsurance(null);
        }
    }

    async function handleSave() {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const { data } = await api.put('/patient/profile', {
                phone:                 form.phone,
                address:               form.address,
                city:                  form.city,
                state:                 form.state,
                pincode:               form.pincode,
                emergencyContactName:  form.emergencyContactName,
                emergencyContactPhone: form.emergencyContactPhone,
                height:  form.height ? parseFloat(form.height) : null,
                weight:  form.weight ? parseFloat(form.weight) : null,
            });
            setProfile(data);
            setEditing(false);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    const inp = {
        width: '100%', border: '1px solid #e5e7eb', borderRadius: '9px',
        padding: '9px 12px', fontSize: '12px', outline: 'none',
        background: '#fafafa', color: '#111', fontFamily: 'Outfit, sans-serif',
    };
    const lbl = {
        fontSize: '10px', fontWeight: 600, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '.05em',
        marginBottom: '3px', display: 'block',
    };
    const val = { fontSize: '13px', fontWeight: 500, color: '#111' };

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>
            Loading profile...
        </div>
    );

    const bmi = profile?.height && profile?.weight
        ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
        : null;

    const bmiLabel = bmi
        ? bmi < 18.5 ? '⚠️ Underweight'
            : bmi < 25 ? '✅ Normal'
                : bmi < 30 ? '⚠️ Overweight'
                    : '🔴 Obese'
        : null;

    // ✅ Insurance active check
    const isInsuranceActive = insurance?.validUntil
        ? new Date(insurance.validUntil) >= new Date()
        : false;

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
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>My Profile</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                        View and manage your personal information
                    </div>
                </div>
                {!editing ? (
                    <button onClick={() => setEditing(true)} style={{
                        padding: '7px 14px', borderRadius: '8px', border: 'none',
                        background: '#0a4f3a', color: '#fff', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer',
                    }}>
                        ✏️ Edit Profile
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { setEditing(false); setError(''); }} style={{
                            padding: '7px 14px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', background: '#fff',
                            color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        }}>
                            Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving} style={{
                            padding: '7px 14px', borderRadius: '8px', border: 'none',
                            background: saving ? '#9ca3af' : '#0a4f3a',
                            color: '#fff', fontSize: '12px', fontWeight: 600,
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            {saving ? 'Saving...' : '✓ Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

                {error && (
                    <div style={{
                        background: '#fef2f2', border: '1px solid #fecaca',
                        color: '#dc2626', fontSize: '12px', borderRadius: '9px',
                        padding: '10px 14px', marginBottom: '14px',
                    }}>⚠️ {error}</div>
                )}
                {success && (
                    <div style={{
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        color: '#16a34a', fontSize: '12px', borderRadius: '9px',
                        padding: '10px 14px', marginBottom: '14px',
                    }}>✅ {success}</div>
                )}

                {/* ✅ hero banner — insurance card right side mein */}
                <div style={{
                    background: 'linear-gradient(120deg,#0a4f3a,#1D9E75)',
                    borderRadius: '12px', padding: '18px 20px',
                    color: '#fff', marginBottom: '14px',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', right: '-30px', top: '-30px',
                        width: '120px', height: '120px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.06)',
                    }} />

                    {/* ✅ flex — left: name, right: insurance */}
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '14px',
                    }}>

                        {/* left — avatar + name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '12px',
                                background: 'rgba(255,255,255,.2)', color: '#fff',
                                fontSize: '18px', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid rgba(255,255,255,.3)', flexShrink: 0,
                            }}>
                                {profile?.name?.slice(0, 2).toUpperCase() || 'PT'}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '17px', fontWeight: 700,
                                    fontFamily: "'Playfair Display', serif",
                                }}>
                                    {profile?.name}
                                </div>
                                <div style={{ fontSize: '11px', opacity: .75, marginTop: '3px' }}>
                                    {profile?.email} · {profile?.phone}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                                    {profile?.bloodGroup && (
                                        <span style={{
                                            background: 'rgba(255,255,255,.2)', padding: '2px 9px',
                                            borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                        }}>
                                            🩸 {bloodGroupLabels[profile.bloodGroup] || profile.bloodGroup}
                                        </span>
                                    )}
                                    {profile?.gender && (
                                        <span style={{
                                            background: 'rgba(255,255,255,.2)', padding: '2px 9px',
                                            borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                        }}>
                                            {profile.gender}
                                        </span>
                                    )}
                                    {bmi && (
                                        <span style={{
                                            background: 'rgba(255,255,255,.2)', padding: '2px 9px',
                                            borderRadius: '8px', fontSize: '10px', fontWeight: 600,
                                        }}>
                                            BMI {bmi} · {bmiLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ✅ right — insurance card */}
                        <div style={{
                            background: 'rgba(255,255,255,.12)',
                            border: '1px solid rgba(255,255,255,.2)',
                            borderRadius: '12px', padding: '14px 18px',
                            minWidth: '180px', flexShrink: 0,
                        }}>
                            <div style={{
                                fontSize: '10px', fontWeight: 600, opacity: .7,
                                textTransform: 'uppercase', letterSpacing: '.05em',
                                marginBottom: '8px',
                            }}>
                                🛡️ Insurance Status
                            </div>

                            {insurance && isInsuranceActive ? (
                                // ✅ Active insurance
                                <>
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: '6px', marginBottom: '6px',
                                    }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: '#4ade80',
                                        }} />
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>Active</div>
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                                        {insurance.provider}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: .7 }}>
                                        Valid until: {new Date(insurance.validUntil).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric',
                                    })}
                                    </div>
                                </>
                            ) : insurance && !isInsuranceActive ? (
                                // ⚠️ Expired insurance
                                <>
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: '6px', marginBottom: '6px',
                                    }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: '#f87171',
                                        }} />
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>Expired</div>
                                    </div>
                                    <div style={{ fontSize: '11px', opacity: .7, marginBottom: '8px' }}>
                                        {insurance.provider}
                                    </div>
                                    <button
                                        onClick={() => navigate('/patient/insurance')}
                                        style={{
                                            background: 'rgba(255,255,255,.2)',
                                            border: '1px solid rgba(255,255,255,.3)',
                                            color: '#fff', fontSize: '10px', fontWeight: 600,
                                            padding: '5px 10px', borderRadius: '6px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        🔄 Renew Insurance
                                    </button>
                                </>
                            ) : (
                                // ❌ No insurance
                                <>
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: '6px', marginBottom: '6px',
                                    }}>
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            background: '#fbbf24',
                                        }} />
                                        <div style={{ fontSize: '13px', fontWeight: 700 }}>Not Added</div>
                                    </div>
                                    <div style={{ fontSize: '11px', opacity: .7, marginBottom: '8px' }}>
                                        No insurance on file
                                    </div>
                                    <button
                                        onClick={() => navigate('/patient/insurance')}
                                        style={{
                                            background: 'rgba(255,255,255,.2)',
                                            border: '1px solid rgba(255,255,255,.3)',
                                            color: '#fff', fontSize: '10px', fontWeight: 600,
                                            padding: '5px 10px', borderRadius: '6px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        + Add Insurance
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* stat cards */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    gap: '10px', marginBottom: '14px',
                }}>
                    {[
                        { icon: '📅', label: 'Date of Birth', value: profile?.birthDate || '—' },
                        { icon: '📏', label: 'Height', value: profile?.height ? `${profile.height} cm` : '—' },
                        { icon: '⚖️', label: 'Weight', value: profile?.weight ? `${profile.weight} kg` : '—' },
                        { icon: '🩸', label: 'Blood Group', value: bloodGroupLabels[profile?.bloodGroup] || '—' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: '#fff', border: '1px solid #f0f0f0',
                            borderRadius: '10px', padding: '12px 14px',
                        }}>
                            <div style={{ fontSize: '18px', marginBottom: '5px' }}>{s.icon}</div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{s.value}</div>
                            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                    {/* personal info */}
                    <div style={{
                        background: '#fff', border: '1px solid #f0f0f0',
                        borderRadius: '10px', padding: '14px',
                    }}>
                        <div style={{
                            fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                            textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px',
                        }}>
                            Personal Information
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={lbl}>Full Name</label>
                                <div style={val}>{profile?.name || '—'}</div>
                            </div>
                            <div>
                                <label style={lbl}>Father's Name</label>
                                <div style={val}>{profile?.fatherName || '—'}</div>
                            </div>
                            <div>
                                <label style={lbl}>Gender</label>
                                <div style={val}>{profile?.gender || '—'}</div>
                            </div>
                            <div>
                                <label style={lbl}>Date of Birth</label>
                                <div style={val}>{profile?.birthDate || '—'}</div>
                            </div>
                            <div>
                                <label style={lbl}>Phone</label>
                                {editing ? (
                                    <input style={inp} value={form.phone} onChange={set('phone')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                ) : (
                                    <div style={val}>{profile?.phone || '—'}</div>
                                )}
                            </div>
                            <div>
                                <label style={lbl}>Email</label>
                                <div style={val}>{profile?.email || '—'}</div>
                            </div>
                        </div>
                    </div>

                    {/* right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* address */}
                        <div style={{
                            background: '#fff', border: '1px solid #f0f0f0',
                            borderRadius: '10px', padding: '14px',
                        }}>
                            <div style={{
                                fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                                textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px',
                            }}>
                                Address
                            </div>
                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input style={inp} placeholder="Street address"
                                           value={form.address} onChange={set('address')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <input style={inp} placeholder="City"
                                               value={form.city} onChange={set('city')}
                                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                               onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                        <input style={inp} placeholder="State"
                                               value={form.state} onChange={set('state')}
                                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                               onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <input style={inp} placeholder="Pincode"
                                           value={form.pincode} onChange={set('pincode')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.8 }}>
                                    {profile?.address
                                        ? <>{profile.address}<br />{profile.city}, {profile.state} {profile.pincode}</>
                                        : '—'}
                                </div>
                            )}
                        </div>

                        {/* emergency contact */}
                        <div style={{
                            background: '#fff', border: '1px solid #f0f0f0',
                            borderRadius: '10px', padding: '14px',
                        }}>
                            <div style={{
                                fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                                textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px',
                            }}>
                                🚨 Emergency Contact
                            </div>
                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input style={inp} placeholder="Contact name"
                                           value={form.emergencyContactName}
                                           onChange={set('emergencyContactName')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    <input style={inp} placeholder="Contact phone"
                                           value={form.emergencyContactPhone}
                                           onChange={set('emergencyContactPhone')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={lbl}>Name</label>
                                        <div style={val}>{profile?.emergencyContactName || '—'}</div>
                                    </div>
                                    <div>
                                        <label style={lbl}>Phone</label>
                                        <div style={val}>{profile?.emergencyContactPhone || '—'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* health metrics — editing mode mein */}
                        {editing && (
                            <div style={{
                                background: '#fff', border: '1px solid #f0f0f0',
                                borderRadius: '10px', padding: '14px',
                            }}>
                                <div style={{
                                    fontSize: '10px', fontWeight: 700, color: '#9ca3af',
                                    textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '12px',
                                }}>
                                    Health Metrics
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={lbl}>Height (cm)</label>
                                        <input type="number" style={inp}
                                               value={form.height} onChange={set('height')}
                                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                               onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Weight (kg)</label>
                                        <input type="number" style={inp}
                                               value={form.weight} onChange={set('weight')}
                                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                               onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}