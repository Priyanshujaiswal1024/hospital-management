import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const bloodGroups = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE',
    'AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'];

const bloodGroupLabels = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A−', B_POSITIVE: 'B+', B_NEGATIVE: 'B−',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB−', O_POSITIVE: 'O+', O_NEGATIVE: 'O−',
};

export default function CreateProfile() {
    const navigate = useNavigate();
    const [step, setStep]       = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const [form, setForm] = useState({
        name:        '',
        fatherName:  '',
        birthDate:   '',
        gender:      '',
        phone:       '',
        email:       '',
        address:     '',
        city:        '',
        state:       '',
        pincode:     '',
        emergencyContactName:  '',
        emergencyContactPhone: '',
        bloodGroup:  '',
        height:      '',
        weight:      '',
    });

    // ── PRE-FILL from localStorage on mount ──
    useEffect(() => {
        try {
            const raw = localStorage.getItem('userInfo');
            if (raw) {
                const info = JSON.parse(raw);
                setForm(f => ({
                    ...f,
                    name:  info.fullName || '',
                    phone: info.phone    || '',
                    email: info.username || '',
                }));
            }
        } catch {}
    }, []);

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    async function handleSubmit() {
        setError('');
        setLoading(true);
        try {
            await api.post('/patient/profile', {
                name:        form.name,
                fatherName:  form.fatherName,
                birthDate:   form.birthDate,
                gender:      form.gender,
                phone:       form.phone,
                email:       form.email,
                address:     form.address,
                city:        form.city,
                state:       form.state,
                pincode:     form.pincode,
                emergencyContactName:  form.emergencyContactName,
                emergencyContactPhone: form.emergencyContactPhone,
                bloodGroup:  form.bloodGroup,
                height:      form.height ? parseFloat(form.height) : null,
                weight:      form.weight ? parseFloat(form.weight) : null,
            });
            navigate('/patient/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create profile');
            setStep(1);
        } finally {
            setLoading(false);
        }
    }

    function nextStep() {
        if (step === 1) {
            if (!form.name || !form.birthDate || !form.gender || !form.phone) {
                setError('Please fill all required fields'); return;
            }
        }
        if (step === 2) {
            if (!form.address || !form.city || !form.state || !form.pincode) {
                setError('Please fill all address fields'); return;
            }
        }
        setError('');
        setStep(s => s + 1);
    }

    const inp = {
        width: '100%', border: '1px solid #e5e7eb', borderRadius: '10px',
        padding: '10px 14px', fontSize: '13px', outline: 'none',
        background: '#fafafa', color: '#111', fontFamily: 'Outfit, sans-serif',
        transition: 'border .15s', boxSizing: 'border-box',
    };

    const inpReadOnly = {
        ...inp,
        background: '#f0fdf4',
        color: '#374151',
        border: '1px solid #bbf7d0',
        cursor: 'not-allowed',
    };

    const lbl = {
        fontSize: '11px', fontWeight: 600, color: '#374151',
        textTransform: 'uppercase', letterSpacing: '.04em',
        marginBottom: '4px', display: 'block',
    };

    return (
        <div style={{
            minHeight: '100vh', background: '#e8ede9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '580px',
                boxShadow: '0 20px 60px rgba(0,0,0,.12)', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(120deg, #0a4f3a, #1D9E75)',
                    padding: '24px 28px', color: '#fff',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{
                            width: '36px', height: '36px', background: 'rgba(255,255,255,.15)',
                            borderRadius: '9px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '18px',
                        }}>🏥</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '15px', fontWeight: 700 }}>
                            Priyansh Care Hospital
                        </div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                        Complete Your Profile
                    </div>
                    <div style={{ fontSize: '12px', opacity: .75 }}>
                        This helps us provide better care for you
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        {[{ n:1, label:'Personal' }, { n:2, label:'Address' }, { n:3, label:'Health' }].map(s => (
                            <div key={s.n} style={{ flex: 1 }}>
                                <div style={{
                                    height: '3px', borderRadius: '2px',
                                    background: step >= s.n ? '#fff' : 'rgba(255,255,255,.3)',
                                    marginBottom: '4px', transition: 'background .3s',
                                }} />
                                <div style={{
                                    fontSize: '10px', fontWeight: 600,
                                    color: step >= s.n ? '#fff' : 'rgba(255,255,255,.5)',
                                }}>
                                    {s.n}. {s.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form body */}
                <div style={{ padding: '24px 28px' }}>
                    {error && (
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#dc2626', fontSize: '12px', borderRadius: '10px',
                            padding: '10px 14px', marginBottom: '16px',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* ── STEP 1 — Personal ── */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>Full Name *</label>
                                    <input
                                        style={inp}
                                        placeholder="Priyanshu Jaiswal"
                                        value={form.name}
                                        onChange={set('name')}
                                        onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                                <div>
                                    <label style={lbl}>Father's Name</label>
                                    <input
                                        style={inp}
                                        placeholder="Ramesh Jaiswal"
                                        value={form.fatherName}
                                        onChange={set('fatherName')}
                                        onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>Date of Birth *</label>
                                    <input
                                        type="date" style={inp}
                                        value={form.birthDate}
                                        onChange={set('birthDate')}
                                        onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                                <div>
                                    <label style={lbl}>Gender *</label>
                                    <select
                                        style={inp}
                                        value={form.gender}
                                        onChange={set('gender')}
                                        onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    >
                                        <option value="">Select gender</option>
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>Phone *</label>
                                    {/* read-only if pre-filled from signup, editable otherwise */}
                                    <input
                                        style={form.phone ? inpReadOnly : inp}
                                        value={form.phone}
                                        onChange={form.phone ? undefined : set('phone')}
                                        readOnly={!!form.phone}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div>
                                    <label style={lbl}>
                                        Email
                                        {form.email && (
                                            <span style={{ marginLeft:'6px', background:'#dcfce7', color:'#15803d', padding:'1px 7px', borderRadius:'20px', fontSize:'9px', fontWeight:700, textTransform:'none' }}>
                                                from account
                                            </span>
                                        )}
                                    </label>
                                    {/* always read-only — email = username from JWT */}
                                    <input
                                        style={inpReadOnly}
                                        value={form.email}
                                        readOnly
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 — Address ── */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={lbl}>Street Address *</label>
                                <input style={inp} placeholder="123, Sector 14"
                                       value={form.address} onChange={set('address')}
                                       onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                       onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>City *</label>
                                    <input style={inp} placeholder="Charkhi Dadri"
                                           value={form.city} onChange={set('city')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                                <div>
                                    <label style={lbl}>State *</label>
                                    <input style={inp} placeholder="Haryana"
                                           value={form.state} onChange={set('state')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            </div>

                            <div>
                                <label style={lbl}>Pincode *</label>
                                <input style={inp} placeholder="127306"
                                       value={form.pincode} onChange={set('pincode')}
                                       onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                       onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                            </div>

                            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px', border: '1px solid #f3f4f6' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
                                    🚨 Emergency Contact
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={lbl}>Contact Name</label>
                                        <input style={inp} placeholder="Parent / Spouse name"
                                               value={form.emergencyContactName}
                                               onChange={set('emergencyContactName')}
                                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                               onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                    <div>
                                        <label style={lbl}>Contact Phone</label>
                                        <input type="tel" style={inp} placeholder="+91 98765 43210"
                                               value={form.emergencyContactPhone}
                                               onChange={set('emergencyContactPhone')}
                                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                               onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3 — Health ── */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={lbl}>Blood Group</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                                    {bloodGroups.map(bg => (
                                        <button
                                            key={bg} type="button"
                                            onClick={() => setForm(f => ({ ...f, bloodGroup: bg }))}
                                            style={{
                                                padding: '10px 6px', borderRadius: '9px', fontSize: '13px',
                                                fontWeight: 700, cursor: 'pointer', transition: 'all .15s',
                                                border: form.bloodGroup === bg ? '2px solid #0a4f3a' : '1px solid #e5e7eb',
                                                background: form.bloodGroup === bg ? '#E1F5EE' : '#fff',
                                                color: form.bloodGroup === bg ? '#0a4f3a' : '#374151',
                                            }}
                                        >
                                            {bloodGroupLabels[bg]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={lbl}>Height (cm)</label>
                                    <input type="number" style={inp} placeholder="e.g. 175"
                                           value={form.height} onChange={set('height')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                                <div>
                                    <label style={lbl}>Weight (kg)</label>
                                    <input type="number" style={inp} placeholder="e.g. 70"
                                           value={form.weight} onChange={set('weight')}
                                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                           onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            </div>

                            {form.height && form.weight && (
                                <div style={{
                                    background: '#E1F5EE', borderRadius: '10px',
                                    padding: '12px 14px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#065f46', fontWeight: 600 }}>BMI (Body Mass Index)</div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#0a4f3a' }}>
                                            {(form.weight / ((form.height / 100) ** 2)).toFixed(1)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#065f46' }}>
                                        {(() => {
                                            const bmi = form.weight / ((form.height / 100) ** 2);
                                            if (bmi < 18.5) return '⚠️ Underweight';
                                            if (bmi < 25)   return '✅ Normal';
                                            if (bmi < 30)   return '⚠️ Overweight';
                                            return '🔴 Obese';
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── BUTTONS ── */}
                    <div style={{
                        display: 'flex', gap: '10px', marginTop: '24px',
                        paddingTop: '16px', borderTop: '1px solid #f3f4f6',
                    }}>
                        {step > 1 && (
                            <button
                                onClick={() => { setError(''); setStep(s => s - 1); }}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px',
                                    border: '1px solid #e5e7eb', background: '#fff',
                                    fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer',
                                }}
                            >
                                ← Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px',
                                    border: 'none', background: '#0a4f3a',
                                    fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer',
                                }}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{
                                    flex: 1, padding: '11px', borderRadius: '10px',
                                    border: 'none', background: loading ? '#9ca3af' : '#0a4f3a',
                                    fontSize: '13px', fontWeight: 600, color: '#fff',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }}
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={{ opacity:.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Saving...
                                    </>
                                ) : '✓ Save Profile'}
                            </button>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '12px' }}>
                        Step {step} of 3 — You can update this later from your profile
                    </p>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}