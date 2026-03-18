import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import api from '../api/axios.js';

function parseError(err) {
    const d = err.response?.data;
    if (!d) return null;
    if (typeof d === 'string') return d;
    if (d.message) return d.message;
    if (d.error)   return d.error;
    if (Array.isArray(d.errors)) return d.errors[0];
    return null;
}

function friendlySignupError(err) {
    const status = err.response?.status;
    const raw    = parseError(err) || '';
    const lower  = raw.toLowerCase();
    if (lower.includes('duplicate entry') && lower.includes('phone'))
        return { field: 'phone', msg: 'This phone number is already registered.' };
    if (lower.includes('duplicate entry') && (lower.includes('username') || lower.includes('email')))
        return { field: 'username', msg: 'An account with this email already exists.' };
    if (lower.includes('duplicate entry') || lower.includes('constraint') || lower.includes('could not execute')) {
        if (/\b[6-9]\d{9}\b/.test(raw)) return { field: 'phone', msg: 'This phone number is already registered.' };
        return { field: 'username', msg: 'An account with this email already exists.' };
    }
    if (status === 409 || lower.includes('already') || lower.includes('exists') || lower.includes('registered')) {
        if (lower.includes('phone')) return { field: 'phone', msg: 'This phone number is already registered.' };
        return { field: 'username', msg: 'An account with this email already exists.' };
    }
    if (status === 400) {
        if (lower.includes('phone'))    return { field: 'phone',    msg: raw || 'Invalid phone number.' };
        if (lower.includes('email'))    return { field: 'username', msg: raw || 'Invalid email address.' };
        if (lower.includes('password')) return { field: 'password', msg: raw || 'Invalid password.' };
    }
    return { field: null, msg: raw || 'Unable to create account. Please try again.' };
}

function isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone.replace(/[\s\-+]/g, ''));
}

// ── Login Modal ───────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSwitchToSignup }) {
    const [form, setForm]         = useState({ username: '', password: '' });
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { login } = useAuth();
    const navigate  = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.username.trim())                              { setError('Please enter your email address'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) { setError('Please enter a valid email address'); return; }
        if (!form.password)                                     { setError('Please enter your password'); return; }
        setError(''); setLoading(true);
        try {
            const { data } = await api.post('/auth/login', {
                username: form.username.trim().toLowerCase(),
                password: form.password,
            });
            login(data.jwt);
            onClose();
            navigate('/role-redirect');
        } catch (err) {
            const status = err.response?.status;
            const raw    = parseError(err) || '';
            const lower  = raw.toLowerCase();
            if (status === 401 || status === 403) setError('Incorrect email or password. Please try again.');
            else if (lower.includes('verify') || lower.includes('not verified')) setError('Please verify your email before logging in.');
            else if (status === 404 || lower.includes('not found')) setError('No account found with this email.');
            else setError(raw || 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    }

    const inp = { width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '11px 14px', fontSize: '13px', outline: 'none', background: '#f8fafc', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box', transition: 'border .15s' };

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '4px' }}>Welcome back 👋</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sign in to your Priyansh Care account</div>
            </div>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '9px', padding: '10px 12px', marginBottom: '14px', lineHeight: 1.5 }}>⚠️ {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>Email Address</label>
                    <input style={inp} type="email" placeholder="your@email.com" value={form.username}
                           onChange={e => { setError(''); setForm({ ...form, username: e.target.value }); }}
                           onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                           onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>Password</label>
                        <span style={{ fontSize: '11px', color: '#0a4f3a', fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => { onClose(); navigate('/forgot-password'); }}>Forgot?</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input style={inp} type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={form.password}
                               onChange={e => { setError(''); setForm({ ...form, password: e.target.value }); }}
                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                               onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        <button type="button" onClick={() => setShowPass(p => !p)}
                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                            {showPass ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
                <button type="submit" disabled={loading}
                        style={{ width: '100%', padding: '13px', borderRadius: '11px', border: 'none', background: loading ? '#9ca3af' : '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Signing in...' : 'Sign In →'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
                New to Priyansh Care?{' '}
                <span style={{ color: '#0a4f3a', fontWeight: 700, cursor: 'pointer' }} onClick={onSwitchToSignup}>Create account</span>
            </div>
        </div>
    );
}

// ── Signup Modal ──────────────────────────────────────────────────────────────
function SignupModal({ onClose, onSwitchToLogin }) {
    const [form, setForm]               = useState({ username: '', password: '', confirm: '', fullName: '', phone: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [loading, setLoading]         = useState(false);
    const navigate = useNavigate();

    function validate() {
        const errs = {};
        if (!form.fullName.trim() || form.fullName.trim().length < 2) errs.fullName = 'Enter your full name';
        if (!form.phone.trim()) errs.phone = 'Phone number is required';
        else if (!isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number';
        if (!form.username.trim()) errs.username = 'Email address is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) errs.username = 'Enter a valid email address';
        if (!form.password) errs.password = 'Password is required';
        else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
        if (!form.confirm) errs.confirm = 'Please confirm your password';
        else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setGlobalError('');
        const errs = validate();
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setLoading(true);
        try {
            await api.post('/auth/signup', {
                username: form.username.trim().toLowerCase(),
                password: form.password,
                fullName: form.fullName.trim(),
                phone:    form.phone.replace(/[\s\-]/g, ''),
            });
            localStorage.setItem('userInfo', JSON.stringify({ username: form.username.trim().toLowerCase(), fullName: form.fullName.trim(), phone: form.phone.replace(/[\s\-]/g, '') }));
            onClose();
            navigate('/verify-otp', { state: { email: form.username.trim().toLowerCase() } });
        } catch (err) {
            const { field, msg } = friendlySignupError(err);
            if (field) setFieldErrors(prev => ({ ...prev, [field]: msg }));
            else setGlobalError(msg);
        } finally { setLoading(false); }
    }

    function strength(p) {
        if (!p)           return null;
        if (p.length < 4) return { label: 'Too weak', color: '#ef4444', w: '20%' };
        if (p.length < 6) return { label: 'Weak',     color: '#f97316', w: '40%' };
        if (p.length < 8) return { label: 'Fair',     color: '#eab308', w: '65%' };
        return              { label: 'Strong',   color: '#0a4f3a', w: '100%' };
    }
    const str = strength(form.password);

    const inp = (hasErr) => ({ width: '100%', border: `1.5px solid ${hasErr ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '10px', padding: '10px 13px', fontSize: '13px', outline: 'none', background: hasErr ? '#fff5f5' : '#f8fafc', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box', transition: 'border .15s' });
    const FieldErr = ({ k }) => fieldErrors[k] ? <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600, marginTop: '4px', lineHeight: 1.4 }}>⚠ {fieldErrors[k]}</div> : null;
    function clear(k) { setFieldErrors(p => { const n = { ...p }; delete n[k]; return n; }); }

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '4px' }}>Create account 🏥</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Register as a new patient at Priyansh Care</div>
            </div>
            {globalError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '9px', padding: '9px 12px', marginBottom: '12px', lineHeight: 1.5 }}>⚠️ {globalError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Full Name</label>
                        <input style={inp(!!fieldErrors.fullName)} placeholder="Priyanshu Jaiswal" value={form.fullName}
                               onChange={e => { clear('fullName'); setForm({ ...form, fullName: e.target.value }); }}
                               onFocus={e => e.target.style.borderColor = '#0a4f3a'} onBlur={e => e.target.style.borderColor = fieldErrors.fullName ? '#fca5a5' : '#e2e8f0'} />
                        <FieldErr k="fullName" />
                    </div>
                    <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Phone</label>
                        <input style={inp(!!fieldErrors.phone)} type="tel" placeholder="9876543210" value={form.phone} maxLength={10}
                               onChange={e => { clear('phone'); setForm({ ...form, phone: e.target.value.replace(/\D/g, '') }); }}
                               onFocus={e => e.target.style.borderColor = '#0a4f3a'} onBlur={e => { e.target.style.borderColor = fieldErrors.phone ? '#fca5a5' : '#e2e8f0'; if (form.phone && !isValidPhone(form.phone)) setFieldErrors(p => ({ ...p, phone: 'Enter a valid 10-digit mobile number' })); }} />
                        <FieldErr k="phone" />
                    </div>
                </div>
                <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Email Address</label>
                    <input style={inp(!!fieldErrors.username)} type="email" placeholder="your@email.com" value={form.username}
                           onChange={e => { clear('username'); setForm({ ...form, username: e.target.value }); }}
                           onFocus={e => e.target.style.borderColor = '#0a4f3a'} onBlur={e => e.target.style.borderColor = fieldErrors.username ? '#fca5a5' : '#e2e8f0'} />
                    <FieldErr k="username" />
                </div>
                <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Password</label>
                    <input style={inp(!!fieldErrors.password)} type="password" placeholder="Min 6 characters" value={form.password}
                           onChange={e => { clear('password'); setForm({ ...form, password: e.target.value }); }}
                           onFocus={e => e.target.style.borderColor = '#0a4f3a'} onBlur={e => e.target.style.borderColor = fieldErrors.password ? '#fca5a5' : '#e2e8f0'} />
                    {str && !fieldErrors.password && (
                        <div style={{ marginTop: '5px' }}>
                            <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: str.w, background: str.color, borderRadius: '99px', transition: 'width .3s' }} />
                            </div>
                            <div style={{ fontSize: '10px', color: str.color, fontWeight: 600, marginTop: '3px' }}>{str.label}</div>
                        </div>
                    )}
                    <FieldErr k="password" />
                </div>
                <div>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>Confirm Password</label>
                    <input style={inp(!!fieldErrors.confirm)} type="password" placeholder="Repeat password" value={form.confirm}
                           onChange={e => { clear('confirm'); setForm({ ...form, confirm: e.target.value }); }}
                           onFocus={e => e.target.style.borderColor = '#0a4f3a'} onBlur={e => e.target.style.borderColor = fieldErrors.confirm ? '#fca5a5' : '#e2e8f0'} />
                    {form.confirm && !fieldErrors.confirm && (
                        <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '3px', color: form.password === form.confirm ? '#0a4f3a' : '#ef4444' }}>
                            {form.password === form.confirm ? '✓ Passwords match' : '✗ Does not match'}
                        </div>
                    )}
                    <FieldErr k="confirm" />
                </div>
                <button type="submit" disabled={loading}
                        style={{ width: '100%', padding: '12px', borderRadius: '11px', border: 'none', background: loading ? '#9ca3af' : '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
                    {loading ? 'Creating account...' : 'Create Account & Send OTP →'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
                Already have an account?{' '}
                <span style={{ color: '#0a4f3a', fontWeight: 700, cursor: 'pointer' }} onClick={onSwitchToLogin}>Sign in</span>
            </div>
        </div>
    );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
    const [modal,       setModal]       = useState(null);
    const [mobileMenu,  setMobileMenu]  = useState(false);
    const { state } = useLocation();

    useEffect(() => {
        if (state?.openModal) setModal(state.openModal);
    }, [state]);

    const departments = [
        { icon: '❤️',  name: 'Cardiology',      desc: 'Heart & cardiovascular care' },
        { icon: '🧠',  name: 'Neurology',        desc: 'Brain & nervous system' },
        { icon: '🦴',  name: 'Orthopedics',      desc: 'Bone, joint & muscle care' },
        { icon: '👁️', name: 'Ophthalmology',    desc: 'Eye care & vision' },
        { icon: '🫁',  name: 'Pulmonology',      desc: 'Lung & respiratory care' },
        { icon: '🩺',  name: 'General Medicine', desc: 'Primary healthcare' },
        { icon: '👶',  name: 'Pediatrics',       desc: "Children's health" },
        { icon: '🦷',  name: 'Dentistry',        desc: 'Oral & dental care' },
    ];

    const doctors = [
        { name: 'Dr. Arun Kapoor',  spec: 'Cardiology',    exp: '12 yrs', quali: 'MBBS, MD - Cardiology',    color: '#0a4f3a', bg: '#f0fdf4' },
        { name: 'Dr. Priya Mehta',  spec: 'Neurology',     exp: '9 yrs',  quali: 'MBBS, DM - Neurology',     color: '#185FA5', bg: '#EFF6FF' },
        { name: 'Dr. Rahul Sharma', spec: 'Orthopedics',   exp: '15 yrs', quali: 'MBBS, MS - Orthopaedics',  color: '#7e22ce', bg: '#FDF4FF' },
        { name: 'Dr. Sneha Patel',  spec: 'Ophthalmology', exp: '8 yrs',  quali: 'MBBS, MS - Ophthalmology', color: '#c2410c', bg: '#FFF7ED' },
    ];

    const steps = [
        { icon: '👤', step: '01', title: 'Create Account',   desc: 'Sign up as a patient with your email and phone number in seconds.' },
        { icon: '🔍', step: '02', title: 'Find Your Doctor', desc: 'Browse specialists by department or search by name and specialty.' },
        { icon: '📅', step: '03', title: 'Book Appointment', desc: 'Choose your preferred date and time slot from available slots.' },
        { icon: '💊', step: '04', title: 'Get Treatment',    desc: 'Visit the doctor, receive prescriptions and medical records online.' },
    ];

    return (
        <div style={{ fontFamily: "'DM Sans','Outfit',sans-serif", background: '#fff', overflowX: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
                @keyframes fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                @keyframes modalIn { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
                @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }

                * { box-sizing: border-box; }

                .lp-btn-primary { transition: all .2s !important; }
                .lp-btn-primary:hover { background:#1D9E75!important; transform:translateY(-2px); box-shadow:0 12px 28px rgba(10,79,58,.3)!important; }
                .lp-btn-outline:hover { background:#0a4f3a!important; color:#fff!important; transform:translateY(-2px); }
                .dept-card:hover  { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; border-color:#5DCAA5!important; }
                .doc-card:hover   { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; }
                .nav-link:hover   { color:#0a4f3a!important; }
                .step-card:hover  { background:#0a4f3a!important; color:#fff!important; }
                .step-card:hover .step-icon  { background:rgba(255,255,255,.15)!important; }
                .step-card:hover .step-num   { color:rgba(255,255,255,.4)!important; }
                .step-card:hover .step-title { color:#fff!important; }
                .step-card:hover .step-desc  { color:rgba(255,255,255,.7)!important; }

                /* ── Responsive Grids ── */
                .lp-steps-grid    { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
                .lp-dept-grid     { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; max-width:1100px; margin:0 auto; }
                .lp-doc-grid      { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
                .lp-about-grid    { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; max-width:1100px; margin:0 auto; position:relative; }
                .lp-about-stats   { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
                .lp-contact-grid  { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; max-width:1100px; margin:0 auto; }
                .lp-hero-stats    { display:flex; gap:32px; justify-content:center; padding-top:32px; border-top:1px solid rgba(255,255,255,.1); flex-wrap:wrap; }
                .lp-hero-btns     { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:48px; }
                .lp-section-pad   { padding:90px 60px; }
                .lp-nav           { padding:14px 60px; }
                .lp-nav-links     { display:flex; align-items:center; gap:28px; }
                .lp-nav-actions   { display:flex; gap:10px; }
                .lp-mobile-menu-btn { display:none; }
                .lp-mobile-nav    { display:none; }

                @media (max-width: 1024px) {
                    .lp-steps-grid  { grid-template-columns:repeat(2,1fr) !important; }
                    .lp-dept-grid   { grid-template-columns:repeat(4,1fr) !important; }
                    .lp-doc-grid    { grid-template-columns:repeat(2,1fr) !important; }
                    .lp-about-grid  { grid-template-columns:1fr !important; gap:40px !important; }
                    .lp-contact-grid { grid-template-columns:1fr !important; gap:40px !important; }
                    .lp-section-pad { padding:70px 40px !important; }
                    .lp-nav         { padding:14px 32px !important; }
                }

                @media (max-width: 768px) {
                    .lp-nav-links   { display:none !important; }
                    .lp-nav-actions { display:none !important; }
                    .lp-mobile-menu-btn { display:flex !important; }
                    .lp-mobile-nav.open { display:flex !important; }
                    .lp-dept-grid   { grid-template-columns:repeat(2,1fr) !important; }
                    .lp-doc-grid    { grid-template-columns:repeat(2,1fr) !important; }
                    .lp-steps-grid  { grid-template-columns:repeat(2,1fr) !important; }
                    .lp-section-pad { padding:56px 20px !important; }
                    .lp-nav         { padding:12px 20px !important; }
                    .lp-hero-stats  { gap:16px !important; }
                    .lp-about-stats { grid-template-columns:1fr 1fr !important; }
                }

                @media (max-width: 480px) {
                    .lp-dept-grid   { grid-template-columns:repeat(2,1fr) !important; }
                    .lp-doc-grid    { grid-template-columns:1fr !important; }
                    .lp-steps-grid  { grid-template-columns:1fr !important; }
                    .lp-hero-btns button { width:100% !important; }
                    .signup-name-grid { grid-template-columns:1fr !important; }
                }
            `}</style>

            {/* ── NAVBAR ── */}
            <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.06)' }}>
                <div className="lp-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{ width: '36px', height: '36px', background: '#0a4f3a', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🏥</div>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", lineHeight: 1.1 }}>Priyansh Care</div>
                            <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.09em' }}>Hospital</div>
                        </div>
                    </div>

                    {/* Desktop nav links */}
                    <div className="lp-nav-links">
                        {['Services', 'Doctors', 'Departments', 'About', 'Contact'].map(l => (
                            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', textDecoration: 'none', transition: 'color .15s' }}>{l}</a>
                        ))}
                    </div>

                    {/* Desktop auth buttons */}
                    <div className="lp-nav-actions">
                        <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding: '9px 20px', borderRadius: '9px', border: '1.5px solid #0a4f3a', background: 'transparent', color: '#0a4f3a', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>Sign In</button>
                        <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding: '9px 20px', borderRadius: '9px', border: 'none', background: '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .2s', boxShadow: '0 4px 14px rgba(10,79,58,.25)' }}>Book Appointment</button>
                    </div>

                    {/* Mobile hamburger */}
                    <button className="lp-mobile-menu-btn" onClick={() => setMobileMenu(v => !v)}
                            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#0a4f3a', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        {mobileMenu ? '✕' : '☰'}
                    </button>
                </div>

                {/* Mobile dropdown menu */}
                <div className={`lp-mobile-nav ${mobileMenu ? 'open' : ''}`}
                     style={{ flexDirection: 'column', padding: '16px 20px 20px', borderTop: '1px solid #f0f0f0', background: '#fff', gap: '4px', animation: 'slideDown .2s ease' }}>
                    {['Services', 'Doctors', 'Departments', 'About', 'Contact'].map(l => (
                        <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                           style={{ fontSize: '14px', fontWeight: 500, color: '#374151', textDecoration: 'none', padding: '10px 8px', borderRadius: '8px', display: 'block' }}>
                            {l}
                        </a>
                    ))}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button onClick={() => { setModal('login'); setMobileMenu(false); }}
                                style={{ flex: 1, padding: '11px', borderRadius: '9px', border: '1.5px solid #0a4f3a', background: 'transparent', color: '#0a4f3a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                            Sign In
                        </button>
                        <button onClick={() => { setModal('signup'); setMobileMenu(false); }}
                                style={{ flex: 1, padding: '11px', borderRadius: '9px', border: 'none', background: '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                            Sign Up
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a4f3a 0%,#0d6b50 50%,#1a8a6a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingTop: '80px' }}>
                <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,.04)', top: '-100px', right: '-100px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,.05)', bottom: '-60px', left: '-60px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(93,202,165,.15)', top: '30%', left: '10%', animation: 'float 6s ease-in-out infinite', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', textAlign: 'center', maxWidth: '760px', width: '100%', padding: '0 24px', animation: 'fadeUp .8s ease' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'rgba(255,255,255,.8)', fontWeight: 500, marginBottom: '28px', backdropFilter: 'blur(8px)' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#5DCAA5', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                        Trusted by 50,000+ patients across India
                    </div>
                    <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800, color: '#fff', fontFamily: "'Playfair Display',serif", lineHeight: 1.1, marginBottom: '20px' }}>
                        Your Health,<br />Our <span style={{ color: '#5DCAA5' }}>Priority</span>
                    </h1>
                    <p style={{ fontSize: 'clamp(13px,2vw,16px)', color: 'rgba(255,255,255,.65)', lineHeight: 1.8, maxWidth: '520px', margin: '0 auto 36px' }}>
                        World-class healthcare at your fingertips. Book appointments, access prescriptions, manage insurance — all in one place.
                    </p>
                    <div className="lp-hero-btns">
                        <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding: '15px 32px', borderRadius: '12px', border: 'none', background: '#5DCAA5', color: '#0a4f3a', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(93,202,165,.4)' }}>
                            📅 Book Appointment
                        </button>
                        <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding: '15px 32px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                            Sign In →
                        </button>
                    </div>
                    <div className="lp-hero-stats">
                        {[['500+', 'Expert Doctors'], ['50K+', 'Happy Patients'], ['20+', 'Departments'], ['15+', 'Years of Care']].map(([num, lbl]) => (
                            <div key={lbl} style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, color: '#5DCAA5', fontFamily: "'Playfair Display',serif" }}>{num}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: '3px' }}>{lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="services" className="lp-section-pad" style={{ background: '#f8fafa' }}>
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#5DCAA5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>How it works</div>
                    <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '12px' }}>Healthcare in 4 Simple Steps</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>From registration to recovery — we've made it effortless.</p>
                </div>
                <div className="lp-steps-grid">
                    {steps.map(s => (
                        <div key={s.step} className="step-card" style={{ background: '#fff', borderRadius: '18px', padding: '28px 24px', border: '1px solid #e8f4ef', transition: 'all .25s', cursor: 'default', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
                            <div className="step-num" style={{ fontSize: '11px', fontWeight: 800, color: '#d1fae5', letterSpacing: '.1em', marginBottom: '14px', transition: 'color .25s' }}>{s.step}</div>
                            <div className="step-icon" style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px', transition: 'background .25s' }}>{s.icon}</div>
                            <div className="step-title" style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', transition: 'color .25s' }}>{s.title}</div>
                            <div className="step-desc" style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.7, transition: 'color .25s' }}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── DEPARTMENTS ── */}
            <section id="departments" className="lp-section-pad" style={{ background: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#5DCAA5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>Our Specialties</div>
                    <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '12px' }}>World-Class Departments</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>Comprehensive care across all major medical specialties under one roof.</p>
                </div>
                <div className="lp-dept-grid">
                    {departments.map(d => (
                        <div key={d.name} className="dept-card" style={{ border: '1.5px solid #e8f4ef', borderRadius: '16px', padding: '24px 20px', cursor: 'pointer', transition: 'all .25s', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
                            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{d.icon}</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '5px' }}>{d.name}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{d.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── DOCTORS ── */}
            <section id="doctors" className="lp-section-pad" style={{ background: '#f0fdf4' }}>
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#5DCAA5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>Our Team</div>
                    <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '12px' }}>Meet Our Specialists</h2>
                    <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>Experienced doctors dedicated to your health and well-being.</p>
                </div>
                <div className="lp-doc-grid">
                    {doctors.map(doc => (
                        <div key={doc.name} className="doc-card" style={{ background: '#fff', borderRadius: '18px', padding: '24px', border: '1px solid #e8f4ef', transition: 'all .25s', boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: doc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '14px' }}>👨‍⚕️</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{doc.name}</div>
                            <div style={{ fontSize: '12px', color: doc.color, fontWeight: 600, marginBottom: '6px' }}>{doc.spec}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>{doc.quali}</div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: doc.bg, border: `1px solid ${doc.color}22`, borderRadius: '8px', padding: '5px 10px' }}>
                                <span style={{ fontSize: '12px' }}>⏳</span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: doc.color }}>{doc.exp} experience</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Sign in to see all doctors, their availability and book an appointment</p>
                    <button onClick={() => setModal('signup')}
                            style={{ padding: '13px 32px', borderRadius: '12px', border: 'none', background: '#0a4f3a', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,79,58,.25)' }}>
                        📅 Create Account to Book
                    </button>
                </div>
            </section>

            {/* ── ABOUT ── */}
            <section id="about" className="lp-section-pad" style={{ background: '#0a4f3a', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,.04)', top: '-100px', right: '-80px', pointerEvents: 'none' }} />
                <div className="lp-about-grid">
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#5DCAA5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '12px' }}>Why Choose Us</div>
                        <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#fff', fontFamily: "'Playfair Display',serif", lineHeight: 1.2, marginBottom: '20px' }}>Healthcare You Can<br /><span style={{ color: '#5DCAA5' }}>Trust & Rely On</span></h2>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: '32px' }}>At Priyansh Care, we combine cutting-edge medical technology with compassionate care to deliver the best health outcomes for every patient.</p>
                        {[
                            ['🏆', 'NABH Accredited Hospital', 'Nationally certified for quality & safety standards'],
                            ['🕐', '24/7 Emergency Services',  'Round-the-clock care for critical situations'],
                            ['💻', 'Digital Health Records',   'All your records secure and accessible anytime'],
                            ['💊', 'In-house Pharmacy',        'Medicines available right at the hospital'],
                        ].map(([icon, title, desc]) => (
                            <div key={title} style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'flex-start' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(93,202,165,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{icon}</div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{title}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)' }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lp-about-stats">
                        {[
                            { num: '99%',  label: 'Patient Satisfaction', icon: '😊' },
                            { num: '500+', label: 'Specialist Doctors',   icon: '👨‍⚕️' },
                            { num: '24/7', label: 'Emergency Support',    icon: '🚨' },
                            { num: '50K+', label: 'Lives Touched',        icon: '❤️' },
                        ].map(s => (
                            <div key={s.label} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '16px', padding: '24px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                                <div style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: '#5DCAA5', fontFamily: "'Playfair Display',serif", marginBottom: '5px' }}>{s.num}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTACT ── */}
            <section id="contact" className="lp-section-pad" style={{ background: '#fff' }}>
                <div className="lp-contact-grid">
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#5DCAA5', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '10px' }}>Contact Us</div>
                        <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '16px' }}>Get in Touch</h2>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.8, marginBottom: '32px' }}>Have questions? Our team is here to help you 24/7.</p>
                        {[
                            ['📍', 'Address', 'Sector 14, Priyansh Care Hospital, New Delhi - 110001'],
                            ['📞', 'Phone',   '+91 98765 43210 / +91 11-2345-6789'],
                            ['📧', 'Email',   'care@priyanshcare.com'],
                            ['⏰', 'Timings', 'Mon–Sat: 8am–8pm | Emergency: 24/7'],
                        ].map(([icon, label, val]) => (
                            <div key={label} style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'flex-start' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{icon}</div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0a4f3a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>{label}</div>
                                    <div style={{ fontSize: '13px', color: '#374151' }}>{val}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '32px', border: '1px solid #d1fae5' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '6px' }}>Book an Appointment</h3>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px', lineHeight: 1.6 }}>Create a free account to browse all doctors, check live availability and book your appointment online.</p>
                        {[
                            ['✅', 'Choose from 500+ specialist doctors'],
                            ['📅', 'See real-time available slots'],
                            ['💊', 'Get digital prescriptions'],
                            ['🧾', 'View bills & insurance online'],
                        ].map(([icon, text]) => (
                            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '16px' }}>{icon}</span>
                                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{text}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
                            <button onClick={() => setModal('signup')}
                                    style={{ flex: 1, minWidth: '120px', padding: '13px', borderRadius: '11px', border: 'none', background: '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                                📅 Create Account
                            </button>
                            <button onClick={() => setModal('login')}
                                    style={{ padding: '13px 20px', borderRadius: '11px', border: '1.5px solid #0a4f3a', background: 'transparent', color: '#0a4f3a', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: '#0a4f3a', padding: '40px 20px 24px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🏥</div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',serif" }}>Priyansh Care Hospital</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Caring for life since 2010</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {['Privacy Policy', 'Terms of Service', 'Careers', 'Sitemap'].map(l => (
                            <span key={l} style={{ fontSize: '12px', cursor: 'pointer', color: 'rgba(255,255,255,.5)' }}>{l}</span>
                        ))}
                    </div>
                </div>
                <div style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '20px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,.35)' }}>
                    © {new Date().getFullYear()} Priyansh Care Hospital. All rights reserved. Made with ❤️ for better healthcare.
                </div>
            </footer>

            {/* ── MODAL ── */}
            {modal && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)', padding: '16px' }}
                    onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
                    <div style={{ background: '#fff', borderRadius: '22px', padding: 'clamp(20px,4vw,36px)', width: '100%', maxWidth: modal === 'signup' ? '480px' : '420px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,.25)', animation: 'modalIn .25s ease', position: 'relative' }}>
                        <button onClick={() => setModal(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        {modal === 'login'
                            ? <LoginModal onClose={() => setModal(null)} onSwitchToSignup={() => setModal('signup')} />
                            : <SignupModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />
                        }
                    </div>
                </div>
            )}
        </div>
    );
}