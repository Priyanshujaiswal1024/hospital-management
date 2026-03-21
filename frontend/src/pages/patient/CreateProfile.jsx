import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const bloodGroups = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE',
    'AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'];

const bloodGroupLabels = {
    A_POSITIVE: 'A+', A_NEGATIVE: 'A−', B_POSITIVE: 'B+', B_NEGATIVE: 'B−',
    AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB−', O_POSITIVE: 'O+', O_NEGATIVE: 'O−',
};

/* ══════════════════════════════════════════════════════
   INDIAN PHONE INPUT COMPONENT
   - +91 prefix always visible
   - Digits only (strips letters/symbols automatically)
   - Exactly 10 digits required
   - Must start with 6, 7, 8 or 9
   - Live ✅/❌ indicator
   - Helper text: "3 more digits needed" etc.
══════════════════════════════════════════════════════ */
function IndianPhoneInput({ value, onChange, readOnly = false, error }) {
    // Strip +91 prefix to show only 10 digits in input box
    const raw = (value || '').replace(/^\+91\s?/, '').replace(/\D/g, '');

    const isValid   = raw.length === 10 && /^[6-9]/.test(raw);
    const isTouched = raw.length > 0;

    // Border color logic
    const borderColor = error
        ? '#fca5a5'
        : isTouched && !isValid
            ? '#fbbf24'   // yellow — incomplete/invalid
            : isTouched && isValid
                ? '#0a4f3a' // green — valid
                : '#e5e7eb';  // default gray

    // Helper text + color
    let helperText = '';
    let helperColor = '#94a3b8';
    if (error) {
        helperText  = error;
        helperColor = '#ef4444';
    } else if (isTouched && raw.length < 10) {
        const rem   = 10 - raw.length;
        helperText  = `⚠ ${rem} more digit${rem !== 1 ? 's' : ''} needed`;
        helperColor = '#d97706';
    } else if (isTouched && raw.length === 10 && !/^[6-9]/.test(raw)) {
        helperText  = '⚠ Indian mobile must start with 6, 7, 8 or 9';
        helperColor = '#ef4444';
    } else if (isValid) {
        helperText  = '✓ Valid Indian mobile number';
        helperColor = '#15803d';
    } else if (!isTouched) {
        helperText  = 'Enter 10-digit Indian mobile number';
        helperColor = '#94a3b8';
    }

    function handleChange(e) {
        // Allow only digits, max 10
        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
        // Store internally as "+91 XXXXXXXXXX"
        onChange(digits ? `+91 ${digits}` : '');
    }

    if (readOnly) {
        return (
            <div style={{
                display: 'flex', borderRadius: '10px',
                border: '1px solid #bbf7d0', background: '#f0fdf4',
                overflow: 'hidden',
            }}>
                <div style={{
                    padding: '10px 11px', background: '#dcfce7',
                    borderRight: '1px solid #bbf7d0',
                    fontSize: 13, fontWeight: 700, color: '#0a4f3a',
                    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                    🇮🇳 +91
                </div>
                <input
                    readOnly
                    value={raw}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        padding: '10px 12px', fontSize: 13,
                        background: 'transparent', color: '#374151',
                        fontFamily: 'Outfit, sans-serif',
                        cursor: 'not-allowed',
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            {/* Input row */}
            <div style={{
                display: 'flex', borderRadius: '10px',
                border: `1.5px solid ${borderColor}`,
                background: '#fafafa', overflow: 'hidden',
                transition: 'border-color .15s, box-shadow .15s',
            }}
                 onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,79,58,.1)'}
                 onBlur={e  => e.currentTarget.style.boxShadow = 'none'}
            >
                {/* +91 badge */}
                <div style={{
                    padding: '10px 12px',
                    background: '#f0fdf4',
                    borderRight: `1.5px solid ${borderColor}`,
                    fontSize: 13, fontWeight: 700, color: '#0a4f3a',
                    whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                    transition: 'border-color .15s',
                    userSelect: 'none',
                }}>
                    🇮🇳 +91
                </div>

                {/* Digits-only input */}
                <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={raw}
                    onChange={handleChange}
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        padding: '10px 12px', fontSize: 13,
                        background: 'transparent', color: '#111',
                        fontFamily: 'Outfit, sans-serif',
                        letterSpacing: '.04em',
                    }}
                />

                {/* Live ✅ / ❌ indicator */}
                {isTouched && (
                    <div style={{
                        padding: '10px 12px',
                        display: 'flex', alignItems: 'center',
                        fontSize: 16, flexShrink: 0,
                    }}>
                        {isValid ? '✅' : '❌'}
                    </div>
                )}
            </div>

            {/* Helper text */}
            {helperText && (
                <div style={{ fontSize: 10, marginTop: 4, color: helperColor, fontWeight: helperColor !== '#94a3b8' ? 600 : 400, lineHeight: 1.4 }}>
                    {helperText}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   EMERGENCY CONTACT PHONE (same component, separate instance)
══════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   VALIDATORS
══════════════════════════════════════════════════════ */
const TODAY   = new Date().toISOString().split('T')[0];
const MIN_DOB = '1900-01-01';

function validatePhone(value) {
    if (!value) return 'Phone number is required';
    const digits = value.replace(/^\+91\s?/, '').replace(/\D/g, '');
    if (digits.length === 0)  return 'Phone number is required';
    if (digits.length < 10)   return `${10 - digits.length} more digit${10 - digits.length !== 1 ? 's' : ''} needed`;
    if (digits.length > 10)   return 'Phone number must be exactly 10 digits';
    if (!/^[6-9]/.test(digits)) return 'Must start with 6, 7, 8 or 9 (Indian mobile)';
    return null;
}

function validateEmergencyPhone(value) {
    if (!value) return null; // optional
    const digits = value.replace(/^\+91\s?/, '').replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 10) return `${10 - digits.length} more digit${10 - digits.length !== 1 ? 's' : ''} needed`;
    if (digits.length > 10)   return 'Must be exactly 10 digits';
    if (digits.length === 10 && !/^[6-9]/.test(digits)) return 'Must start with 6, 7, 8 or 9';
    return null;
}

function validateStep1(form) {
    const e = {};
    if (!form.name?.trim())    e.name     = 'Full name is required';
    if (!form.birthDate)       e.birthDate = 'Date of birth is required';
    else {
        const dob   = new Date(form.birthDate);
        const today = new Date(); today.setHours(0,0,0,0);
        if (dob >= today) e.birthDate = 'Date of birth cannot be today or in the future';
        if (dob < new Date('1900-01-01')) e.birthDate = 'Date of birth cannot be before 1900';
    }
    if (!form.gender)          e.gender   = 'Please select gender';
    const phoneErr = validatePhone(form.phone);
    if (phoneErr)              e.phone    = phoneErr;
    return e;
}

function validateStep2(form) {
    const e = {};
    if (!form.address?.trim()) e.address = 'Street address is required';
    if (!form.city?.trim())    e.city    = 'City is required';
    if (!form.state?.trim())   e.state   = 'State is required';
    if (!form.pincode?.trim()) e.pincode = 'Pincode is required';
    else if (!/^[1-9][0-9]{5}$/.test(form.pincode.trim())) e.pincode = 'Enter a valid 6-digit Indian pincode';

    // Cross-field: name + phone both required together
    const emergPhoneErr = validateEmergencyPhone(form.emergencyContactPhone);
    if (emergPhoneErr) e.emergencyContactPhone = emergPhoneErr;
    if (form.emergencyContactName?.trim() && !form.emergencyContactPhone)
        e.emergencyContactPhone = 'Phone required when name is provided';
    if (form.emergencyContactPhone && !form.emergencyContactName?.trim())
        e.emergencyContactName  = 'Name required when phone is provided';
    return e;
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function CreateProfile() {
    const navigate = useNavigate();
    const [step,    setStep]    = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors,  setErrors]  = useState({});

    const [form, setForm] = useState({
        name: '', fatherName: '', birthDate: '', gender: '', phone: '', email: '',
        address: '', city: '', state: '', pincode: '',
        emergencyContactName: '', emergencyContactPhone: '',
        bloodGroup: '', height: '', weight: '',
    });

    // Pre-fill from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem('userInfo');
            if (raw) {
                const info = JSON.parse(raw);
                setForm(f => ({
                    ...f,
                    name:  info.fullName || '',
                    phone: info.phone
                        ? `+91 ${info.phone.replace(/^\+91\s?/, '').replace(/\D/g, '')}`
                        : '',
                    email: info.username || '',
                }));
            }
        } catch {}
    }, []);

    const set = key => e => {
        setForm(f => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    };

    const setField = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        if (errors[key]) setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    };

    async function handleSubmit() {
        setErrors({});
        setLoading(true);
        try {
            await api.post('/patient/profile', {
                name:        form.name,
                fatherName:  form.fatherName,
                birthDate:   form.birthDate   || null,
                gender:      form.gender      || null,
                phone:       form.phone,
                address:     form.address     || null,
                city:        form.city        || null,
                state:       form.state       || null,
                pincode:     form.pincode     || null,
                emergencyContactName:  form.emergencyContactName  || null,
                emergencyContactPhone: form.emergencyContactPhone || null,
                bloodGroup:  form.bloodGroup  || null,
                height:      form.height ? parseFloat(form.height) : null,
                weight:      form.weight ? parseFloat(form.weight) : null,
            });
            navigate('/patient/profile');
        } catch (err) {
            setErrors({ _api: err.response?.data?.message || 'Failed to create profile. Please try again.' });
            setStep(1);
        } finally {
            setLoading(false);
        }
    }

    function nextStep() {
        const errs = step === 1 ? validateStep1(form)
            : step === 2 ? validateStep2(form)
                : {};
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            // Scroll to first error
            setTimeout(() => document.querySelector('[data-err="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
            return;
        }
        setErrors({});
        setStep(s => s + 1);
        window.scrollTo(0, 0);
    }

    /* ── Styles ── */
    const inp = (hasErr) => ({
        width: '100%', border: `1.5px solid ${hasErr ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: '10px', padding: '10px 14px', fontSize: '13px', outline: 'none',
        background: hasErr ? '#fff5f5' : '#fafafa', color: '#111',
        fontFamily: 'Outfit, sans-serif', transition: 'border .15s', boxSizing: 'border-box',
    });
    const inpRO = {
        ...inp(false), background: '#f0fdf4', color: '#374151',
        border: '1px solid #bbf7d0', cursor: 'not-allowed',
    };
    const lbl = {
        fontSize: '11px', fontWeight: 600, color: '#374151',
        textTransform: 'uppercase', letterSpacing: '.04em',
        marginBottom: '5px', display: 'block',
    };
    const ErrMsg = ({ msg }) => msg
        ? <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>⚠ {msg}</div>
        : null;

    /* ── BMI ── */
    const bmi = form.height && form.weight
        ? (parseFloat(form.weight) / ((parseFloat(form.height) / 100) ** 2)).toFixed(1)
        : null;
    const bmiLabel = bmi
        ? bmi < 18.5 ? '⚠️ Underweight' : bmi < 25 ? '✅ Normal' : bmi < 30 ? '⚠️ Overweight' : '🔴 Obese'
        : null;
    const bmiColor = bmi
        ? bmi < 18.5 ? '#d97706' : bmi < 25 ? '#0a4f3a' : bmi < 30 ? '#d97706' : '#dc2626'
        : '#0a4f3a';

    return (
        <div style={{ minHeight: '100vh', background: '#e8ede9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }
                .cp-input-focus:focus { border-color: #0a4f3a!important; box-shadow: 0 0 0 3px rgba(10,79,58,.08)!important; background: #fff!important; }
                .cp-btn-back:hover  { background: #f3f4f6!important; }
                .cp-btn-next:hover  { background: #0d6b50!important; transform: translateY(-1px); }
                .cp-bg-btn:hover    { border-color: #0a4f3a!important; background: #E1F5EE!important; color: #0a4f3a!important; }
                @media (max-width: 480px) {
                    .cp-2col { grid-template-columns: 1fr!important; }
                    .cp-pad  { padding: 18px 16px!important; }
                    .cp-hdr  { padding: 20px 16px 18px!important; }
                }
            `}</style>

            <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '580px', boxShadow: '0 20px 60px rgba(0,0,0,.12)', overflow: 'hidden' }}>

                {/* ── HEADER ── */}
                <div className="cp-hdr" style={{ background: 'linear-gradient(120deg, #0a4f3a, #1D9E75)', padding: '24px 28px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700 }}>Priyansh Care Hospital</div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Complete Your Profile</div>
                    <div style={{ fontSize: 12, opacity: .75 }}>This helps us provide better care for you</div>

                    {/* Step bar */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        {[{ n:1, label:'Personal' }, { n:2, label:'Address' }, { n:3, label:'Health' }].map(s => (
                            <div key={s.n} style={{ flex: 1 }}>
                                <div style={{ height: 3, borderRadius: 2, background: step >= s.n ? '#fff' : 'rgba(255,255,255,.3)', marginBottom: 4, transition: 'background .3s' }} />
                                <div style={{ fontSize: 10, fontWeight: 600, color: step >= s.n ? '#fff' : 'rgba(255,255,255,.5)' }}>{s.n}. {s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="cp-pad" style={{ padding: '24px 28px' }}>

                    {/* API error */}
                    {errors._api && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                            ⚠️ {errors._api}
                        </div>
                    )}

                    {/* ════════════════════════
                        STEP 1 — Personal Info
                    ════════════════════════ */}
                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Name + Father */}
                            <div className="cp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div data-err={!!errors.name}>
                                    <label style={lbl}>Full Name *</label>
                                    <input
                                        className="cp-input-focus"
                                        style={inp(!!errors.name)}
                                        placeholder="Priyanshu Jaiswal"
                                        value={form.name}
                                        onChange={set('name')}
                                    />
                                    <ErrMsg msg={errors.name} />
                                </div>
                                <div>
                                    <label style={lbl}>Father's Name</label>
                                    <input
                                        className="cp-input-focus"
                                        style={inp(false)}
                                        placeholder="Ramesh Jaiswal"
                                        value={form.fatherName}
                                        onChange={set('fatherName')}
                                    />
                                </div>
                            </div>

                            {/* DOB + Gender */}
                            <div className="cp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div data-err={!!errors.birthDate}>
                                    <label style={lbl}>Date of Birth *</label>
                                    <input
                                        type="date"
                                        className="cp-input-focus"
                                        style={inp(!!errors.birthDate)}
                                        value={form.birthDate}
                                        max={TODAY}
                                        min={MIN_DOB}
                                        onChange={e => {
                                            set('birthDate')(e);
                                            // Immediate DOB check
                                            const d = new Date(e.target.value);
                                            const today = new Date(); today.setHours(0,0,0,0);
                                            if (d >= today) setErrors(ev => ({ ...ev, birthDate: 'Cannot be today or future' }));
                                            else setErrors(ev => { const n = { ...ev }; delete n.birthDate; return n; });
                                        }}
                                    />
                                    <ErrMsg msg={errors.birthDate} />
                                    {form.birthDate && !errors.birthDate && (
                                        <div style={{ fontSize: 10, color: '#15803d', marginTop: 3, fontWeight: 600 }}>
                                            ✓ Age: {Math.floor((new Date() - new Date(form.birthDate)) / (365.25 * 24 * 3600 * 1000))} years
                                        </div>
                                    )}
                                </div>
                                <div data-err={!!errors.gender}>
                                    <label style={lbl}>Gender *</label>
                                    <select
                                        className="cp-input-focus"
                                        style={inp(!!errors.gender)}
                                        value={form.gender}
                                        onChange={set('gender')}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ErrMsg msg={errors.gender} />
                                </div>
                            </div>

                            {/* Phone + Email */}
                            <div className="cp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                                {/* ✅ Phone with +91 validation */}
                                <div data-err={!!errors.phone}>
                                    <label style={lbl}>Phone *</label>
                                    {/* If pre-filled from signup — show read-only with +91 */}
                                    {form.phone && !errors.phone && !( (form.phone.replace(/^\+91\s?/, '').replace(/\D/g,'').length < 10) ) ? (
                                        // Read-only display once valid number from localStorage
                                        <IndianPhoneInput
                                            value={form.phone}
                                            onChange={val => setField('phone', val)}
                                            error={errors.phone}
                                            readOnly={false}
                                        />
                                    ) : (
                                        <IndianPhoneInput
                                            value={form.phone}
                                            onChange={val => setField('phone', val)}
                                            error={errors.phone}
                                            readOnly={false}
                                        />
                                    )}
                                    <ErrMsg msg={errors.phone} />
                                </div>

                                {/* Email — always read-only */}
                                <div>
                                    <label style={lbl}>
                                        Email{' '}
                                        {form.email && (
                                            <span style={{ marginLeft: 6, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 20, fontSize: 9, fontWeight: 700, textTransform: 'none' }}>
                                                from account
                                            </span>
                                        )}
                                    </label>
                                    <input style={inpRO} value={form.email} readOnly placeholder="your@email.com" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════
                        STEP 2 — Address
                    ════════════════════════ */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            <div data-err={!!errors.address}>
                                <label style={lbl}>Street Address *</label>
                                <input className="cp-input-focus" style={inp(!!errors.address)}
                                       placeholder="123, Sector 14" value={form.address} onChange={set('address')} />
                                <ErrMsg msg={errors.address} />
                            </div>

                            <div className="cp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div data-err={!!errors.city}>
                                    <label style={lbl}>City *</label>
                                    <input className="cp-input-focus" style={inp(!!errors.city)}
                                           placeholder="Charkhi Dadri" value={form.city} onChange={set('city')} />
                                    <ErrMsg msg={errors.city} />
                                </div>
                                <div data-err={!!errors.state}>
                                    <label style={lbl}>State *</label>
                                    <input className="cp-input-focus" style={inp(!!errors.state)}
                                           placeholder="Haryana" value={form.state} onChange={set('state')} />
                                    <ErrMsg msg={errors.state} />
                                </div>
                            </div>

                            <div data-err={!!errors.pincode}>
                                <label style={lbl}>Pincode *</label>
                                <input className="cp-input-focus" style={inp(!!errors.pincode)}
                                       placeholder="127306" maxLength={6}
                                       value={form.pincode}
                                       onChange={e => setField('pincode', e.target.value.replace(/\D/g, ''))} />
                                <ErrMsg msg={errors.pincode} />
                            </div>

                            {/* Emergency Contact */}
                            <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #f3f4f6' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    🚨 Emergency Contact <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
                                </div>
                                <div className="cp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div data-err={!!errors.emergencyContactName}>
                                        <label style={lbl}>Contact Name</label>
                                        <input className="cp-input-focus" style={inp(!!errors.emergencyContactName)}
                                               placeholder="Parent / Spouse name"
                                               value={form.emergencyContactName}
                                               onChange={set('emergencyContactName')} />
                                        <ErrMsg msg={errors.emergencyContactName} />
                                    </div>

                                    {/* ✅ Emergency phone also gets +91 validation */}
                                    <div data-err={!!errors.emergencyContactPhone}>
                                        <label style={lbl}>Contact Phone</label>
                                        <IndianPhoneInput
                                            value={form.emergencyContactPhone}
                                            onChange={val => setField('emergencyContactPhone', val)}
                                            error={errors.emergencyContactPhone}
                                        />
                                        {/* ErrMsg already shown inside IndianPhoneInput via helper text */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════════════════════════
                        STEP 3 — Health Info
                    ════════════════════════ */}
                    {step === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* Blood Group */}
                            <div>
                                <label style={lbl}>Blood Group</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 4 }}>
                                    {bloodGroups.map(bg => (
                                        <button
                                            key={bg} type="button"
                                            className="cp-bg-btn"
                                            onClick={() => setForm(f => ({ ...f, bloodGroup: bg === f.bloodGroup ? '' : bg }))}
                                            style={{
                                                padding: '10px 6px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                                                cursor: 'pointer', transition: 'all .15s',
                                                border:      form.bloodGroup === bg ? '2px solid #0a4f3a' : '1.5px solid #e5e7eb',
                                                background:  form.bloodGroup === bg ? '#E1F5EE' : '#fff',
                                                color:       form.bloodGroup === bg ? '#0a4f3a' : '#374151',
                                            }}
                                        >
                                            {bloodGroupLabels[bg]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Height + Weight */}
                            <div className="cp-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={lbl}>Height (cm)</label>
                                    <input type="number" step="0.1" min="50" max="272"
                                           className="cp-input-focus" style={inp(false)}
                                           placeholder="e.g. 170" value={form.height} onChange={set('height')} />
                                </div>
                                <div>
                                    <label style={lbl}>Weight (kg)</label>
                                    <input type="number" step="0.1" min="1" max="500"
                                           className="cp-input-focus" style={inp(false)}
                                           placeholder="e.g. 65" value={form.weight} onChange={set('weight')} />
                                </div>
                            </div>

                            {/* BMI */}
                            {bmi && (
                                <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 10, color: '#065f46', fontWeight: 600, marginBottom: 2 }}>BMI (Body Mass Index)</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: bmiColor }}>{bmi}</div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: bmiColor }}>{bmiLabel}</div>
                                </div>
                            )}

                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 11, color: '#92400e', lineHeight: 1.6 }}>
                                💡 Health info is optional but helps doctors give better care. You can update this anytime from your profile.
                            </div>
                        </div>
                    )}

                    {/* ── NAV BUTTONS ── */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                        {step > 1 && (
                            <button
                                className="cp-btn-back"
                                onClick={() => { setErrors({}); setStep(s => s - 1); window.scrollTo(0,0); }}
                                style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', transition: 'all .15s' }}
                            >
                                ← Back
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                className="cp-btn-next"
                                onClick={nextStep}
                                style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#0a4f3a', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', transition: 'all .15s' }}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#9ca3af' : '#0a4f3a', fontSize: 13, fontWeight: 600, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .15s' }}
                            >
                                {loading ? (
                                    <>
                                        <svg style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={{ opacity: .25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path style={{ opacity: .75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Saving...
                                    </>
                                ) : '✓ Save Profile'}
                            </button>
                        )}
                    </div>

                    <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
                        Step {step} of 3 — You can update this later from your profile
                    </p>
                </div>
            </div>
        </div>
    );
}