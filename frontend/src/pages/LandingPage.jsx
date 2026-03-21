import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import api from '../api/axios.js';

// ── Error Parsing ─────────────────────────────────────────────────────────────
function parseError(err) {
    if (!err.response) return null;
    const d = err.response?.data;
    if (!d) return null;
    if (typeof d === 'string') return d.trim();
    if (d.message) return String(d.message).trim();
    if (d.error)   return String(d.error).trim();
    if (d.msg)     return String(d.msg).trim();
    if (d.detail)  return String(d.detail).trim();
    if (Array.isArray(d.errors) && d.errors.length > 0) return String(d.errors[0]).trim();
    try { return JSON.stringify(d); } catch { return null; }
}

/*
  ✅ IMPROVED: friendlySignupError
  Returns { field, msg, action } where:
    field  — which input to highlight ('username' | 'phone' | 'password' | null)
    msg    — human-readable message shown under the field
    action — optional CTA { label, type } e.g. { label: 'Sign in instead', type: 'login' }
*/
function friendlySignupError(err) {
    const status = err.response?.status;
    const raw    = parseError(err) || '';
    const lower  = raw.toLowerCase();

    // Network error
    if (!err.response) {
        return {
            field: null,
            msg: 'No internet connection. Please check your network and try again.',
            action: null,
        };
    }

    // ── Helper to decide phone vs email ──────────────────────────────────────
    const isPhoneDupe = lower.includes('phone') || lower.includes('mobile') || /\b[6-9]\d{9}\b/.test(raw);
    const isEmailDupe = lower.includes('email') || lower.includes('username') || lower.includes('user');

    // 409 Conflict — server explicitly says duplicate
    if (status === 409) {
        if (isPhoneDupe) {
            return {
                field: 'phone',
                msg: 'This phone number is already linked to an account.',
                action: { label: 'Sign in instead', type: 'login' },
            };
        }
        return {
            field: 'username',
            msg: 'An account with this email already exists.',
            action: { label: 'Sign in instead', type: 'login' },
        };
    }

    // Database / ORM constraint errors
    const isDuplicate =
        lower.includes('duplicate entry') ||
        lower.includes('duplicate key') ||
        lower.includes('already exists') ||
        lower.includes('already registered') ||
        lower.includes('unique constraint') ||
        lower.includes('violates unique') ||
        lower.includes('integrity constraint') ||
        lower.includes('could not execute') ||
        lower.includes('constraint violation') ||
        lower.includes('constraint [23');

    if (isDuplicate) {
        if (isPhoneDupe) {
            return {
                field: 'phone',
                msg: 'This phone number is already registered.',
                action: { label: 'Sign in with this number', type: 'login' },
            };
        }
        if (isEmailDupe) {
            return {
                field: 'username',
                msg: 'An account with this email already exists.',
                action: { label: 'Sign in instead', type: 'login' },
            };
        }
        // Generic duplicate — fallback to email field
        return {
            field: 'username',
            msg: 'An account with these details already exists.',
            action: { label: 'Sign in instead', type: 'login' },
        };
    }

    // 400 Bad Request — validation errors from backend
    if (status === 400) {
        if (isPhoneDupe)    return { field: 'phone',    msg: raw || 'Invalid phone number.',    action: null };
        if (isEmailDupe)    return { field: 'username', msg: raw || 'Invalid email address.',   action: null };
        if (lower.includes('password')) return { field: 'password', msg: raw || 'Invalid password.', action: null };
        if (lower.includes('name'))     return { field: 'fullName', msg: raw || 'Invalid name.',     action: null };
        if (raw) return { field: null, msg: raw, action: null };
    }

    // 500 or other — still try to be helpful
    if (isPhoneDupe) return { field: 'phone',    msg: 'This phone number may already be registered.', action: { label: 'Try signing in', type: 'login' } };
    if (isEmailDupe) return { field: 'username', msg: 'This email may already be registered.',        action: { label: 'Try signing in', type: 'login' } };

    return {
        field: null,
        msg: raw || `Registration failed (${status ?? 'network error'}). Please try again.`,
        action: null,
    };
}

function friendlyLoginError(err) {
    if (!err.response) return 'No internet connection. Please check your network.';
    const status = err.response?.status;
    const raw    = parseError(err) || '';
    const lower  = raw.toLowerCase();
    if (status === 401 || status === 403)
        return 'Incorrect email or password. Please try again.';
    if (lower.includes('verify') || lower.includes('not verified'))
        return 'Please verify your email first. Check your inbox for the verification link.';
    if (status === 404 || lower.includes('not found') || lower.includes('no account'))
        return 'No account found with this email. Please sign up first.';
    if (lower.includes('locked') || lower.includes('disabled'))
        return 'Your account has been suspended. Please contact support.';
    return raw || `Login failed (${status ?? 'network error'}). Please try again.`;
}

// ── Validation helpers ────────────────────────────────────────────────────────
function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function passwordStrength(p) {
    if (!p) return null;
    let score = 0;
    if (p.length >= 8)           score++;
    if (p.length >= 12)          score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[a-z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^A-Za-z0-9]/.test(p))  score++;
    if (score <= 1) return { label: 'Too weak',   color: '#ef4444', w: '16%',  level: 0 };
    if (score <= 2) return { label: 'Weak',       color: '#f97316', w: '35%',  level: 1 };
    if (score <= 3) return { label: 'Fair',       color: '#eab308', w: '55%',  level: 2 };
    if (score <= 4) return { label: 'Good',       color: '#22c55e', w: '75%',  level: 3 };
    return              { label: 'Strong 🔒',     color: '#0a4f3a', w: '100%', level: 4 };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </g>
        </svg>
    );
}

function EyeIcon({ open }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function GoogleButton({ label = 'Continue with Google' }) {
    function handleGoogle() {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
        window.location.href = `${base}/oauth2/authorization/google`;
    }
    return (
        <button type="button" onClick={handleGoogle} className="google-btn">
            <GoogleIcon /> {label}
        </button>
    );
}

function Divider() {
    return (
        <div className="divider">
            <div className="divider-line"/>
            <span className="divider-text">or continue with email</span>
            <div className="divider-line"/>
        </div>
    );
}

function PasswordInput({ value, onChange, onBlur, placeholder, hasError, id }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <input
                id={id}
                type={show ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                className={`form-input ${hasError ? 'input-error' : ''}`}
                style={{ paddingRight: '44px' }}
                autoComplete={id === 'login-pass' ? 'current-password' : 'new-password'}
            />
            <button type="button" onClick={() => setShow(v => !v)} className="eye-btn" tabIndex={-1}>
                <EyeIcon open={show} />
            </button>
        </div>
    );
}

/*
  ✅ FieldErr — now supports an optional `action` (e.g. "Sign in instead" link)
     onAction is called when the link is clicked
*/
function FieldErr({ msg, action, onAction }) {
    if (!msg) return null;
    return (
        <div className="field-err">
            ⚠ {msg}
            {action && (
                <span
                    className="field-err-action"
                    onClick={onAction}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && onAction?.()}
                >
                    {action.label} →
                </span>
            )}
        </div>
    );
}

// ── Login Modal ───────────────────────────────────────────────────────────────
function LoginModal({ onClose, onSwitchToSignup, prefillEmail = '' }) {
    const [form,    setForm]    = useState({ username: prefillEmail, password: '' });
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate  = useNavigate();

    // If parent passes prefillEmail after mount (redirect from signup error), update
    useEffect(() => {
        if (prefillEmail) setForm(f => ({ ...f, username: prefillEmail }));
    }, [prefillEmail]);

    function validateLogin() {
        const errs = {};
        if (!form.username.trim())             errs.username = 'Email address is required';
        else if (!isValidEmail(form.username)) errs.username = 'Please enter a valid email address';
        if (!form.password)                    errs.password = 'Password is required';
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validateLogin();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', {
                username: form.username.trim().toLowerCase(),
                password: form.password,
            });
            login(data.jwt);
            onClose();
            navigate('/role-redirect');
        } catch (err) {
            setErrors({ global: friendlyLoginError(err) });
        } finally {
            setLoading(false);
        }
    }

    function clear(k) {
        setErrors(p => { const n = { ...p }; delete n[k]; delete n.global; return n; });
    }

    return (
        <div className="modal-body">
            <div className="modal-header">
                <div className="modal-icon">🏥</div>
                <div className="modal-title">Welcome back 👋</div>
                <div className="modal-subtitle">Sign in to your Priyansh Care account</div>
            </div>

            <GoogleButton label="Sign in with Google" />
            <Divider />

            {errors.global && <div className="alert-error">⚠️ {errors.global}</div>}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label className="form-label" htmlFor="login-email">Email Address</label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.username}
                        autoComplete="email"
                        className={`form-input ${errors.username ? 'input-error' : ''}`}
                        onChange={e => { clear('username'); setForm({ ...form, username: e.target.value }); }}
                    />
                    <FieldErr msg={errors.username} />
                </div>

                <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" htmlFor="login-pass" style={{ margin: 0 }}>Password</label>
                        <span className="link-text" onClick={() => { onClose(); navigate('/forgot-password'); }}>
                            Forgot password?
                        </span>
                    </div>
                    <PasswordInput
                        id="login-pass"
                        placeholder="Enter your password"
                        value={form.password}
                        hasError={!!errors.password}
                        onChange={e => { clear('password'); setForm({ ...form, password: e.target.value }); }}
                    />
                    <FieldErr msg={errors.password} />
                </div>

                <button type="submit" disabled={loading} className={`btn-primary ${loading ? 'btn-loading' : ''}`}>
                    {loading ? <><span className="spinner"/> Signing in...</> : 'Sign In →'}
                </button>
            </form>

            <p className="modal-footer-text">
                New to Priyansh Care?{' '}
                <span className="link-text" onClick={onSwitchToSignup}>Create account</span>
            </p>

            <div className="trust-badges">
                {['🔒 Secure Login', '🏥 NABH Certified', '✅ Verified'].map(b => (
                    <span key={b} className="trust-badge">{b}</span>
                ))}
            </div>
        </div>
    );
}

// ── Signup Modal ──────────────────────────────────────────────────────────────
function SignupModal({ onClose, onSwitchToLogin }) {
    const [form, setForm] = useState({
        username: '', password: '', confirm: '', fullName: '', phone: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    // ✅ fieldActions — optional CTA per-field (e.g. "Sign in instead")
    const [fieldActions, setFieldActions] = useState({});
    const [globalError,  setGlobalError]  = useState('');
    const [loading,      setLoading]      = useState(false);
    const [touched,      setTouched]      = useState({});

    // ✅ Pre-fill email in login modal when user clicks "Sign in instead"
    const [switchEmail,  setSwitchEmail]  = useState('');
    const [doSwitch,     setDoSwitch]     = useState(false);

    const navigate = useNavigate();

    // When doSwitch triggers, switch to login modal with email prefilled
    useEffect(() => {
        if (doSwitch) {
            onSwitchToLogin(switchEmail);
        }
    }, [doSwitch]);

    // ── Frontend validation ────────────────────────────────────────────────
    function validate(fields = form) {
        const errs = {};

        const name = fields.fullName.trim();
        if (!name)                errs.fullName = 'Full name is required';
        else if (name.length < 2) errs.fullName = 'Name must be at least 2 characters';
        else if (name.length > 60) errs.fullName = 'Name must be under 60 characters';
        else if (/\d/.test(name)) errs.fullName = 'Name cannot contain numbers';
        else if (!/^[a-zA-Z\s.',-]+$/.test(name)) errs.fullName = 'Name contains invalid characters';

        const phone = fields.phone.replace(/[\s\-+()]/g, '');
        if (!phone)                    errs.phone = 'Phone number is required';
        else if (!/^\d+$/.test(phone)) errs.phone = 'Phone number must contain only digits';
        else if (phone.length !== 10)  errs.phone = `${phone.length < 10 ? `${10 - phone.length} more digit(s) needed` : 'Too many digits — must be 10'}`;
        else if (!/^[6-9]/.test(phone)) errs.phone = 'Enter a valid Indian mobile number (starts with 6, 7, 8 or 9)';

        const email = fields.username.trim();
        if (!email)                    errs.username = 'Email address is required';
        else if (!isValidEmail(email)) errs.username = 'Enter a valid email (e.g. john@gmail.com)';
        else if (email.length > 100)   errs.username = 'Email is too long';

        const pwd = fields.password;
        if (!pwd)                       errs.password = 'Password is required';
        else if (pwd.length < 6)        errs.password = 'Password must be at least 6 characters';
        else if (pwd.length > 128)      errs.password = 'Password is too long (max 128 characters)';
        else if (/^\s|\s$/.test(pwd))   errs.password = 'Password cannot start or end with a space';

        if (!fields.confirm)                          errs.confirm = 'Please confirm your password';
        else if (fields.password !== fields.confirm)  errs.confirm = 'Passwords do not match';

        return errs;
    }

    function validateField(name) {
        setTouched(t => ({ ...t, [name]: true }));
        const errs = validate();
        if (errs[name]) {
            setFieldErrors(p => ({ ...p, [name]: errs[name] }));
        } else {
            setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
            setFieldActions(p => { const n = { ...p }; delete n[name]; return n; });
        }
    }

    function update(key, val) {
        const next = { ...form, [key]: val };
        setForm(next);
        if (touched[key]) {
            const errs = validate(next);
            if (errs[key]) {
                setFieldErrors(p => ({ ...p, [key]: errs[key] }));
            } else {
                setFieldErrors(p => { const n = { ...p }; delete n[key]; return n; });
                // clear server-set action too if user corrected the field
                setFieldActions(p => { const n = { ...p }; delete n[key]; return n; });
            }
        }
        setGlobalError('');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setGlobalError('');
        // Clear previous server-side actions
        setFieldActions({});
        const errs = validate();
        setFieldErrors(errs);
        setTouched({ username: true, password: true, confirm: true, fullName: true, phone: true });
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            await api.post('/auth/signup', {
                username: form.username.trim().toLowerCase(),
                password: form.password,
                fullName: form.fullName.trim(),
                phone:    form.phone.replace(/[\s\-+()]/g, ''),
            });
            localStorage.setItem('userInfo', JSON.stringify({
                username: form.username.trim().toLowerCase(),
                fullName: form.fullName.trim(),
                phone:    form.phone.replace(/[\s\-+()]/g, ''),
            }));
            onClose();
            navigate('/verify-otp', { state: { email: form.username.trim().toLowerCase() } });
        } catch (err) {
            // ✅ Use improved friendlySignupError — get field + msg + action
            const { field, msg, action } = friendlySignupError(err);
            if (field) {
                setFieldErrors(prev => ({ ...prev, [field]: msg }));
                if (action) {
                    setFieldActions(prev => ({ ...prev, [field]: action }));
                }
            } else {
                setGlobalError(msg);
            }
        } finally {
            setLoading(false);
        }
    }

    // ✅ Called when user clicks "Sign in instead →" next to a field error
    function handleSwitchToLogin(email = '') {
        setSwitchEmail(email || form.username.trim().toLowerCase());
        setDoSwitch(true);
    }

    const str = passwordStrength(form.password);
    const pwdReqs = form.password ? [
        { ok: form.password.length >= 8,        text: '8+ chars'   },
        { ok: /[A-Z]/.test(form.password),       text: 'Uppercase'  },
        { ok: /[0-9]/.test(form.password),       text: 'Number'     },
        { ok: /[^A-Za-z0-9]/.test(form.password), text: 'Special'  },
    ] : [];

    return (
        <div className="modal-body">
            <div className="modal-header">
                <div className="modal-icon">🏥</div>
                <div className="modal-title">Create account 🏥</div>
                <div className="modal-subtitle">Register as a new patient at Priyansh Care</div>
            </div>

            <GoogleButton label="Sign up with Google" />
            <Divider />

            {/* ✅ Global error (non-field errors) */}
            {globalError && (
                <div className="alert-error">
                    ⚠️ {globalError}
                    <span className="alert-action" onClick={() => handleSwitchToLogin()}>
                        Sign in instead →
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Row: Name + Phone */}
                <div className="form-row-2">
                    <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Full Name</label>
                        <input
                            id="fullName" type="text" placeholder="Priyanshu Jaiswal"
                            autoComplete="name" value={form.fullName}
                            className={`form-input ${fieldErrors.fullName ? 'input-error' : touched.fullName && !fieldErrors.fullName ? 'input-ok' : ''}`}
                            onChange={e => update('fullName', e.target.value)}
                            onBlur={() => validateField('fullName')}
                        />
                        <FieldErr msg={fieldErrors.fullName} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="phone">
                            Phone <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '10px' }}>(10 digits)</span>
                        </label>
                        {/* ✅ Phone duplicate — styled banner under the field */}
                        <input
                            id="phone" type="tel" placeholder="9876543210"
                            autoComplete="tel" value={form.phone} maxLength={10}
                            className={`form-input ${fieldErrors.phone ? 'input-error' : touched.phone && !fieldErrors.phone && form.phone.length === 10 ? 'input-ok' : ''}`}
                            onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
                            onBlur={() => validateField('phone')}
                        />
                        <FieldErr
                            msg={fieldErrors.phone}
                            action={fieldActions.phone}
                            onAction={() => handleSwitchToLogin()}
                        />
                        {/* ✅ Special callout for phone duplicate */}
                        {fieldActions.phone?.type === 'login' && (
                            <div className="dupe-callout dupe-callout--phone">
                                <span>📱</span>
                                <span>
                                    This number is already registered.{' '}
                                    <strong className="dupe-link" onClick={() => handleSwitchToLogin()}>
                                        Sign in instead →
                                    </strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                        id="email" type="email" placeholder="your@email.com"
                        autoComplete="email" value={form.username}
                        className={`form-input ${fieldErrors.username ? 'input-error' : touched.username && !fieldErrors.username && form.username ? 'input-ok' : ''}`}
                        onChange={e => update('username', e.target.value)}
                        onBlur={() => validateField('username')}
                    />
                    <FieldErr
                        msg={fieldErrors.username}
                        action={fieldActions.username}
                        onAction={() => handleSwitchToLogin(form.username.trim())}
                    />
                    {/* ✅ Special callout for email duplicate */}
                    {fieldActions.username?.type === 'login' && (
                        <div className="dupe-callout dupe-callout--email">
                            <span>✉️</span>
                            <div style={{ flex: 1 }}>
                                <div><strong>{form.username.trim().toLowerCase()}</strong> is already registered.</div>
                                <div style={{ marginTop: '4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <strong
                                        className="dupe-link"
                                        onClick={() => handleSwitchToLogin(form.username.trim())}
                                    >
                                        Sign in to this account →
                                    </strong>
                                    <span
                                        className="dupe-link-secondary"
                                        onClick={() => { navigate('/forgot-password'); onClose(); }}
                                    >
                                        Forgot password?
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Password */}
                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <PasswordInput
                        id="password" placeholder="Min 6 characters"
                        value={form.password} hasError={!!fieldErrors.password}
                        onChange={e => update('password', e.target.value)}
                        onBlur={() => validateField('password')}
                    />
                    {str && !fieldErrors.password && (
                        <div style={{ marginTop: '6px' }}>
                            <div className="strength-bar-bg">
                                <div className="strength-bar-fill" style={{ width: str.w, background: str.color }}/>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span style={{ fontSize: '10px', color: str.color, fontWeight: 700 }}>{str.label}</span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {pwdReqs.map(r => (
                                        <span key={r.text} style={{ fontSize: '9px', fontWeight: 600, color: r.ok ? '#0a4f3a' : '#94a3b8' }}>
                                            {r.ok ? '✓' : '○'} {r.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <FieldErr msg={fieldErrors.password} />
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                    <label className="form-label" htmlFor="confirm">Confirm Password</label>
                    <PasswordInput
                        id="confirm" placeholder="Repeat your password"
                        value={form.confirm} hasError={!!fieldErrors.confirm}
                        onChange={e => update('confirm', e.target.value)}
                        onBlur={() => validateField('confirm')}
                    />
                    {form.confirm && !fieldErrors.confirm && (
                        <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: form.password === form.confirm ? '#0a4f3a' : '#ef4444' }}>
                            {form.password === form.confirm ? '✓ Passwords match' : '✗ Does not match'}
                        </div>
                    )}
                    <FieldErr msg={fieldErrors.confirm} />
                </div>

                <button type="submit" disabled={loading} className={`btn-primary ${loading ? 'btn-loading' : ''}`} style={{ marginTop: '4px' }}>
                    {loading
                        ? <><span className="spinner"/> Creating account...</>
                        : 'Create Account & Send OTP →'
                    }
                </button>
            </form>

            <p className="modal-footer-text">
                Already have an account?{' '}
                <span className="link-text" onClick={() => handleSwitchToLogin()}>Sign in</span>
            </p>

            <div className="privacy-note">
                🔒 Your data is encrypted & secure. By signing up, you agree to our{' '}
                <span className="link-text">Terms</span> &{' '}
                <span className="link-text">Privacy Policy</span>
            </div>
        </div>
    );
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
    const [modal,       setModal]       = useState(null);
    const [mobileMenu,  setMobileMenu]  = useState(false);
    // ✅ loginPrefillEmail — when signup says "email exists", switch to login with email pre-filled
    const [loginPrefillEmail, setLoginPrefillEmail] = useState('');
    const { state } = useLocation();

    useEffect(() => {
        if (state?.openModal) setModal(state.openModal);
    }, [state]);

    useEffect(() => {
        const handler = () => { if (window.innerWidth > 768) setMobileMenu(false); };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // ✅ When SignupModal calls onSwitchToLogin(email), prefill login email
    function handleSwitchToLogin(email = '') {
        setLoginPrefillEmail(email);
        setModal('login');
    }

    function handleSwitchToSignup() {
        setLoginPrefillEmail('');
        setModal('signup');
    }

    const departments = [
        { icon: '❤️',  name: 'Cardiology',      desc: 'Heart & cardiovascular care'  },
        { icon: '🧠',  name: 'Neurology',        desc: 'Brain & nervous system'       },
        { icon: '🦴',  name: 'Orthopedics',      desc: 'Bone, joint & muscle care'    },
        { icon: '👁️', name: 'Ophthalmology',    desc: 'Eye care & vision'            },
        { icon: '🫁',  name: 'Pulmonology',      desc: 'Lung & respiratory care'      },
        { icon: '🩺',  name: 'General Medicine', desc: 'Primary healthcare'           },
        { icon: '👶',  name: 'Pediatrics',       desc: "Children's health"            },
        { icon: '🦷',  name: 'Dentistry',        desc: 'Oral & dental care'           },
    ];

    const doctors = [
        { name: 'Dr. Arun Kapoor',  spec: 'Cardiology',    exp: '12 yrs', quali: 'MBBS, MD - Cardiology',    color: '#0a4f3a', bg: '#f0fdf4' },
        { name: 'Dr. Priya Mehta',  spec: 'Neurology',     exp: '9 yrs',  quali: 'MBBS, DM - Neurology',     color: '#185FA5', bg: '#EFF6FF' },
        { name: 'Dr. Rahul Sharma', spec: 'Orthopedics',   exp: '15 yrs', quali: 'MBBS, MS - Orthopaedics',  color: '#7e22ce', bg: '#FDF4FF' },
        { name: 'Dr. Sneha Patel',  spec: 'Ophthalmology', exp: '8 yrs',  quali: 'MBBS, MS - Ophthalmology', color: '#c2410c', bg: '#FFF7ED' },
    ];

    const steps = [
        { icon: '👤', step: '01', title: 'Create Account',   desc: 'Sign up as a patient with your email and phone number in seconds.' },
        { icon: '🔍', step: '02', title: 'Find Your Doctor', desc: 'Browse specialists by department or search by name and specialty.'  },
        { icon: '📅', step: '03', title: 'Book Appointment', desc: 'Choose your preferred date and time slot from available slots.'     },
        { icon: '💊', step: '04', title: 'Get Treatment',    desc: 'Visit the doctor, receive prescriptions and medical records online.' },
    ];

    return (
        <div style={{ fontFamily: "'DM Sans','Outfit',sans-serif", background: '#fff', overflowX: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');

                @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
                @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
                @keyframes modalIn   { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
                @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
                @keyframes spin      { to{transform:rotate(360deg)} }
                @keyframes dupeIn    { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

                * { box-sizing:border-box; margin:0; padding:0; }

                /* ── Forms ── */
                .form-group { display:flex; flex-direction:column; }
                .form-label {
                    font-size:11px; font-weight:700; color:#64748b;
                    text-transform:uppercase; letter-spacing:.06em;
                    display:block; margin-bottom:6px; font-family:'DM Sans',sans-serif;
                }
                .form-input {
                    width:100%; border:1.5px solid #e2e8f0; border-radius:10px;
                    padding:11px 14px; font-size:13px; outline:none;
                    background:#f8fafc; font-family:'DM Sans',sans-serif;
                    box-sizing:border-box; color:#0f172a;
                    transition:border-color .15s, background .15s, box-shadow .15s;
                }
                .form-input:focus {
                    border-color:#0a4f3a; background:#fff;
                    box-shadow:0 0 0 3px rgba(10,79,58,.08);
                }
                .form-input.input-error { border-color:#fca5a5 !important; background:#fff5f5; }
                .form-input.input-error:focus { border-color:#ef4444 !important; box-shadow:0 0 0 3px rgba(239,68,68,.08); }
                .form-input.input-ok   { border-color:#86efac; background:#f0fdf4; }
                .form-input::placeholder { color:#94a3b8; }
                .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

                /* ── Field error ── */
                .field-err {
                    font-size:10px; color:#ef4444; font-weight:600;
                    margin-top:4px; line-height:1.5; display:flex;
                    align-items:center; gap:5px; flex-wrap:wrap;
                }
                .field-err-action {
                    color:#0a4f3a; font-weight:700; cursor:pointer;
                    text-decoration:underline; white-space:nowrap;
                }
                .field-err-action:hover { color:#1D9E75; }

                /* ── Duplicate callout banners ── */
                .dupe-callout {
                    margin-top:7px; padding:9px 12px; border-radius:9px;
                    font-size:11px; font-weight:500; line-height:1.5;
                    display:flex; align-items:flex-start; gap:8px;
                    animation:dupeIn .2s ease;
                }
                .dupe-callout--email {
                    background:#fef3c7; border:1px solid #fde68a; color:#92400e;
                }
                .dupe-callout--phone {
                    background:#fef3c7; border:1px solid #fde68a; color:#92400e;
                }
                .dupe-link {
                    color:#0a4f3a; cursor:pointer; text-decoration:underline;
                    font-weight:700;
                }
                .dupe-link:hover { color:#1D9E75; }
                .dupe-link-secondary {
                    color:#64748b; cursor:pointer; font-size:10px;
                    text-decoration:underline;
                }
                .dupe-link-secondary:hover { color:#374151; }

                /* ── Alert ── */
                .alert-error {
                    background:#fef2f2; border:1px solid #fecaca; color:#dc2626;
                    font-size:12px; border-radius:10px; padding:11px 14px;
                    margin-bottom:14px; line-height:1.5; font-weight:500;
                    display:flex; align-items:center; gap:8px; flex-wrap:wrap;
                }
                .alert-action {
                    margin-left:auto; color:#0a4f3a; font-weight:700;
                    cursor:pointer; text-decoration:underline; white-space:nowrap;
                }
                .alert-action:hover { color:#1D9E75; }

                /* ── Buttons ── */
                .btn-primary {
                    width:100%; padding:13px 16px; border-radius:11px; border:none;
                    background:#0a4f3a; color:#fff; font-size:13px; font-weight:700;
                    cursor:pointer; font-family:'DM Sans',sans-serif;
                    display:flex; align-items:center; justify-content:center; gap:8px;
                    transition:background .2s, transform .15s, box-shadow .2s;
                }
                .btn-primary:hover:not(:disabled) {
                    background:#0d6b50; transform:translateY(-1px);
                    box-shadow:0 6px 20px rgba(10,79,58,.3);
                }
                .btn-primary.btn-loading, .btn-primary:disabled { background:#64748b; cursor:not-allowed; opacity:.8; }

                .google-btn {
                    width:100%; padding:11px 16px; border-radius:11px;
                    border:1.5px solid #e2e8f0; background:#fff;
                    display:flex; align-items:center; justify-content:center;
                    gap:10px; cursor:pointer; font-size:13px; font-weight:600;
                    color:#374151; font-family:'DM Sans',sans-serif;
                    transition:all .2s; box-shadow:0 1px 4px rgba(0,0,0,.06);
                }
                .google-btn:hover {
                    background:#f8fafc; border-color:#94a3b8;
                    transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.1);
                }

                /* ── Eye / Spinner ── */
                .eye-btn {
                    position:absolute; right:12px; top:50%; transform:translateY(-50%);
                    background:none; border:none; color:#94a3b8; cursor:pointer;
                    display:flex; align-items:center; padding:4px; border-radius:4px;
                    transition:color .15s;
                }
                .eye-btn:hover { color:#475569; }
                .spinner {
                    width:14px; height:14px; border:2px solid rgba(255,255,255,.3);
                    border-top-color:#fff; border-radius:50%;
                    display:inline-block; animation:spin .7s linear infinite;
                }

                /* ── Divider / Modal ── */
                .divider { display:flex; align-items:center; gap:12px; margin:16px 0; }
                .divider-line { flex:1; height:1px; background:#e2e8f0; }
                .divider-text { font-size:11px; color:#94a3b8; font-weight:600; white-space:nowrap; }
                .strength-bar-bg { height:3px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
                .strength-bar-fill { height:100%; border-radius:99px; transition:width .3s, background .3s; }
                .modal-body { font-family:'DM Sans',sans-serif; }
                .modal-header { margin-bottom:20px; text-align:center; }
                .modal-icon {
                    width:48px; height:48px; border-radius:14px; background:#f0fdf4;
                    display:flex; align-items:center; justify-content:center;
                    font-size:22px; margin:0 auto 12px;
                }
                .modal-title  { font-size:22px; font-weight:700; color:#0a4f3a; font-family:'Playfair Display',serif; margin-bottom:4px; }
                .modal-subtitle { font-size:12px; color:#94a3b8; }
                .modal-footer-text { text-align:center; margin-top:16px; font-size:12px; color:#94a3b8; }
                .link-text { color:#0a4f3a; font-weight:700; cursor:pointer; }
                .link-text:hover { text-decoration:underline; }
                .trust-badges { display:flex; justify-content:center; gap:16px; margin-top:16px; padding-top:16px; border-top:1px solid #f1f5f9; flex-wrap:wrap; }
                .trust-badge  { font-size:10px; color:#94a3b8; font-weight:500; }
                .privacy-note { margin-top:12px; padding:10px 12px; background:#f8fafc; border-radius:9px; font-size:10px; color:#94a3b8; text-align:center; line-height:1.6; }

                /* ── Landing ── */
                .lp-btn-primary:hover { background:#1D9E75!important; transform:translateY(-2px); box-shadow:0 12px 28px rgba(10,79,58,.3)!important; }
                .lp-btn-outline:hover { background:#0a4f3a!important; color:#fff!important; transform:translateY(-2px); }
                .dept-card:hover { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; border-color:#5DCAA5!important; }
                .doc-card:hover  { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; }
                .nav-link:hover  { color:#0a4f3a!important; }
                .step-card:hover { background:#0a4f3a!important; }
                .step-card:hover .step-icon  { background:rgba(255,255,255,.15)!important; }
                .step-card:hover .step-num   { color:rgba(255,255,255,.4)!important; }
                .step-card:hover .step-title { color:#fff!important; }
                .step-card:hover .step-desc  { color:rgba(255,255,255,.7)!important; }
                .lp-steps-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
                .lp-dept-grid    { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; max-width:1100px; margin:0 auto; }
                .lp-doc-grid     { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
                .lp-about-grid   { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; max-width:1100px; margin:0 auto; }
                .lp-about-stats  { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
                .lp-contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; max-width:1100px; margin:0 auto; }
                .lp-hero-stats   { display:flex; gap:32px; justify-content:center; padding-top:32px; border-top:1px solid rgba(255,255,255,.1); flex-wrap:wrap; }
                .lp-hero-btns    { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:48px; }
                .lp-section-pad  { padding:90px 60px; }
                .lp-nav          { padding:14px 60px; }
                .lp-nav-links    { display:flex; align-items:center; gap:28px; }
                .lp-nav-actions  { display:flex; gap:10px; }
                .lp-mobile-menu-btn { display:none; }
                .lp-mobile-nav   { display:none; }

                @media (max-width:1024px) {
                    .lp-steps-grid { grid-template-columns:repeat(2,1fr)!important; }
                    .lp-doc-grid   { grid-template-columns:repeat(2,1fr)!important; }
                    .lp-about-grid, .lp-contact-grid { grid-template-columns:1fr!important; gap:40px!important; }
                    .lp-section-pad { padding:70px 40px!important; }
                    .lp-nav         { padding:14px 32px!important; }
                }
                @media (max-width:768px) {
                    .lp-nav-links, .lp-nav-actions { display:none!important; }
                    .lp-mobile-menu-btn { display:flex!important; }
                    .lp-mobile-nav.open { display:flex!important; }
                    .lp-dept-grid, .lp-doc-grid, .lp-steps-grid { grid-template-columns:repeat(2,1fr)!important; }
                    .lp-section-pad { padding:56px 20px!important; }
                    .lp-nav         { padding:12px 20px!important; }
                    .lp-hero-stats  { gap:16px!important; }
                }
                @media (max-width:480px) {
                    .lp-doc-grid, .lp-steps-grid { grid-template-columns:1fr!important; }
                    .lp-hero-btns button { width:100%!important; }
                    .form-row-2 { grid-template-columns:1fr!important; }
                }
            `}</style>

            {/* ── NAVBAR ── */}
            <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(255,255,255,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
                <div className="lp-nav" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                        <div style={{ width:'36px', height:'36px', background:'#0a4f3a', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🏥</div>
                        <div>
                            <div style={{ fontSize:'14px', fontWeight:700, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>Priyansh Care</div>
                            <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.09em' }}>Hospital</div>
                        </div>
                    </div>
                    <div className="lp-nav-links">
                        {['Services','Doctors','Departments','About','Contact'].map(l => (
                            <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ fontSize:'13px', fontWeight:500, color:'#64748b', textDecoration:'none', transition:'color .15s' }}>{l}</a>
                        ))}
                    </div>
                    <div className="lp-nav-actions">
                        <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding:'9px 20px', borderRadius:'9px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all .2s' }}>Sign In</button>
                        <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding:'9px 20px', borderRadius:'9px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all .2s', boxShadow:'0 4px 14px rgba(10,79,58,.25)' }}>Book Appointment</button>
                    </div>
                    <button className="lp-mobile-menu-btn" onClick={() => setMobileMenu(v => !v)}
                            style={{ background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#0a4f3a', alignItems:'center', justifyContent:'center', padding:0 }}>
                        {mobileMenu ? '✕' : '☰'}
                    </button>
                </div>
                {mobileMenu && (
                    <div className="lp-mobile-nav open" style={{ flexDirection:'column', padding:'16px 20px 20px', borderTop:'1px solid #f0f0f0', background:'#fff', gap:'4px', animation:'slideDown .2s ease' }}>
                        {['Services','Doctors','Departments','About','Contact'].map(l => (
                            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                               style={{ fontSize:'14px', fontWeight:500, color:'#374151', textDecoration:'none', padding:'10px 8px', borderRadius:'8px', display:'block' }}>{l}</a>
                        ))}
                        <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
                            <button onClick={() => { setModal('login'); setMobileMenu(false); }} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign In</button>
                            <button onClick={() => { setModal('signup'); setMobileMenu(false); }} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign Up</button>
                        </div>
                    </div>
                )}
            </nav>

            {/* ── HERO ── */}
            <section style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a4f3a 0%,#0d6b50 50%,#1a8a6a 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingTop:'80px' }}>
                <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'-100px', right:'-100px', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:'-60px', left:'-60px', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(93,202,165,.15)', top:'30%', left:'10%', animation:'float 6s ease-in-out infinite', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
                <div style={{ position:'relative', textAlign:'center', maxWidth:'760px', width:'100%', padding:'0 24px', animation:'fadeUp .8s ease' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'20px', padding:'6px 16px', fontSize:'12px', color:'rgba(255,255,255,.8)', fontWeight:500, marginBottom:'28px', backdropFilter:'blur(8px)' }}>
                        <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#5DCAA5', display:'inline-block', animation:'pulse 2s infinite' }}/>
                        Trusted by 50,000+ patients across India
                    </div>
                    <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:'20px' }}>
                        Your Health,<br/>Our <span style={{ color:'#5DCAA5' }}>Priority</span>
                    </h1>
                    <p style={{ fontSize:'clamp(13px,2vw,16px)', color:'rgba(255,255,255,.65)', lineHeight:1.8, maxWidth:'520px', margin:'0 auto 36px' }}>
                        World-class healthcare at your fingertips. Book appointments, access prescriptions, manage insurance — all in one place.
                    </p>
                    <div className="lp-hero-btns">
                        <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding:'15px 32px', borderRadius:'12px', border:'none', background:'#5DCAA5', color:'#0a4f3a', fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(93,202,165,.4)', transition:'all .2s' }}>
                            📅 Book Appointment
                        </button>
                        <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding:'15px 32px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:'14px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)', transition:'all .2s' }}>
                            Sign In →
                        </button>
                    </div>
                    <div className="lp-hero-stats">
                        {[['500+','Expert Doctors'],['50K+','Happy Patients'],['20+','Departments'],['15+','Years of Care']].map(([num, lbl]) => (
                            <div key={lbl} style={{ textAlign:'center', minWidth:'80px' }}>
                                <div style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#5DCAA5', fontFamily:"'Playfair Display',serif" }}>{num}</div>
                                <div style={{ fontSize:'11px', color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginTop:'3px' }}>{lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="services" className="lp-section-pad" style={{ background:'#f8fafa' }}>
                <div style={{ textAlign:'center', marginBottom:'56px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>How it works</div>
                    <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>Healthcare in 4 Simple Steps</h2>
                    <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>From registration to recovery — we've made it effortless.</p>
                </div>
                <div className="lp-steps-grid">
                    {steps.map(s => (
                        <div key={s.step} className="step-card" style={{ background:'#fff', borderRadius:'18px', padding:'28px 24px', border:'1px solid #e8f4ef', transition:'all .25s', cursor:'default', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
                            <div className="step-num" style={{ fontSize:'11px', fontWeight:800, color:'#d1fae5', letterSpacing:'.1em', marginBottom:'14px', transition:'color .25s' }}>{s.step}</div>
                            <div className="step-icon" style={{ width:'48px', height:'48px', borderRadius:'14px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'14px', transition:'background .25s' }}>{s.icon}</div>
                            <div className="step-title" style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'8px', transition:'color .25s' }}>{s.title}</div>
                            <div className="step-desc" style={{ fontSize:'12px', color:'#64748b', lineHeight:1.7, transition:'color .25s' }}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── DEPARTMENTS ── */}
            <section id="departments" className="lp-section-pad" style={{ background:'#fff' }}>
                <div style={{ textAlign:'center', marginBottom:'56px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Our Specialties</div>
                    <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>World-Class Departments</h2>
                    <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>Comprehensive care across all major medical specialties under one roof.</p>
                </div>
                <div className="lp-dept-grid">
                    {departments.map(d => (
                        <div key={d.name} className="dept-card" style={{ border:'1.5px solid #e8f4ef', borderRadius:'16px', padding:'24px 20px', cursor:'pointer', transition:'all .25s', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
                            <div style={{ fontSize:'28px', marginBottom:'12px' }}>{d.icon}</div>
                            <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'5px' }}>{d.name}</div>
                            <div style={{ fontSize:'12px', color:'#94a3b8' }}>{d.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── DOCTORS ── */}
            <section id="doctors" className="lp-section-pad" style={{ background:'#f0fdf4' }}>
                <div style={{ textAlign:'center', marginBottom:'56px' }}>
                    <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Our Team</div>
                    <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>Meet Our Specialists</h2>
                    <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>Experienced doctors dedicated to your health and well-being.</p>
                </div>
                <div className="lp-doc-grid">
                    {doctors.map(doc => (
                        <div key={doc.name} className="doc-card" style={{ background:'#fff', borderRadius:'18px', padding:'24px', border:'1px solid #e8f4ef', transition:'all .25s', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
                            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:doc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'14px' }}>👨‍⚕️</div>
                            <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'3px' }}>{doc.name}</div>
                            <div style={{ fontSize:'12px', color:doc.color, fontWeight:600, marginBottom:'6px' }}>{doc.spec}</div>
                            <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'12px' }}>{doc.quali}</div>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:doc.bg, border:`1px solid ${doc.color}22`, borderRadius:'8px', padding:'5px 10px' }}>
                                <span style={{ fontSize:'12px' }}>⏳</span>
                                <span style={{ fontSize:'11px', fontWeight:600, color:doc.color }}>{doc.exp} experience</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign:'center', marginTop:'40px' }}>
                    <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'16px' }}>Sign in to see all doctors, their availability and book an appointment</p>
                    <button onClick={() => setModal('signup')} style={{ padding:'13px 32px', borderRadius:'12px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(10,79,58,.25)' }}>
                        📅 Create Account to Book
                    </button>
                </div>
            </section>

            {/* ── ABOUT ── */}
            <section id="about" className="lp-section-pad" style={{ background:'#0a4f3a', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'-100px', right:'-80px', pointerEvents:'none' }}/>
                <div className="lp-about-grid">
                    <div>
                        <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'12px' }}>Why Choose Us</div>
                        <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:'20px' }}>
                            Healthcare You Can<br/><span style={{ color:'#5DCAA5' }}>Trust & Rely On</span>
                        </h2>
                        <p style={{ fontSize:'14px', color:'rgba(255,255,255,.65)', lineHeight:1.8, marginBottom:'32px' }}>
                            At Priyansh Care, we combine cutting-edge medical technology with compassionate care to deliver the best health outcomes for every patient.
                        </p>
                        {[
                            ['🏆','NABH Accredited Hospital','Nationally certified for quality & safety standards'],
                            ['🕐','24/7 Emergency Services','Round-the-clock care for critical situations'],
                            ['💻','Digital Health Records','All your records secure and accessible anytime'],
                            ['💊','In-house Pharmacy','Medicines available right at the hospital'],
                        ].map(([icon, title, desc]) => (
                            <div key={title} style={{ display:'flex', gap:'14px', marginBottom:'20px', alignItems:'flex-start' }}>
                                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(93,202,165,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{icon}</div>
                                <div>
                                    <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{title}</div>
                                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,.55)' }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lp-about-stats">
                        {[
                            { num:'99%',  label:'Patient Satisfaction', icon:'😊' },
                            { num:'500+', label:'Specialist Doctors',   icon:'👨‍⚕️' },
                            { num:'24/7', label:'Emergency Support',    icon:'🚨' },
                            { num:'50K+', label:'Lives Touched',        icon:'❤️' },
                        ].map(s => (
                            <div key={s.label} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'16px', padding:'24px 20px', textAlign:'center' }}>
                                <div style={{ fontSize:'28px', marginBottom:'8px' }}>{s.icon}</div>
                                <div style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:800, color:'#5DCAA5', fontFamily:"'Playfair Display',serif", marginBottom:'5px' }}>{s.num}</div>
                                <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.07em' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CONTACT ── */}
            <section id="contact" className="lp-section-pad" style={{ background:'#fff' }}>
                <div className="lp-contact-grid">
                    <div>
                        <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Contact Us</div>
                        <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'16px' }}>Get in Touch</h2>
                        <p style={{ fontSize:'14px', color:'#64748b', lineHeight:1.8, marginBottom:'32px' }}>Have questions? Our team is here to help you 24/7.</p>
                        {[
                            ['📍','Address','Sector 14, Priyansh Care Hospital, New Delhi - 110001'],
                            ['📞','Phone',  '+91 98765 43210 / +91 11-2345-6789'],
                            ['📧','Email',  'care@priyanshcare.com'],
                            ['⏰','Timings','Mon–Sat: 8am–8pm | Emergency: 24/7'],
                        ].map(([icon, label, val]) => (
                            <div key={label} style={{ display:'flex', gap:'14px', marginBottom:'20px', alignItems:'flex-start' }}>
                                <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{icon}</div>
                                <div>
                                    <div style={{ fontSize:'11px', fontWeight:700, color:'#0a4f3a', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>{label}</div>
                                    <div style={{ fontSize:'13px', color:'#374151' }}>{val}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ background:'#f0fdf4', borderRadius:'20px', padding:'32px', border:'1px solid #d1fae5' }}>
                        <h3 style={{ fontSize:'18px', fontWeight:700, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'6px' }}>Book an Appointment</h3>
                        <p style={{ fontSize:'12px', color:'#64748b', marginBottom:'20px', lineHeight:1.6 }}>Create a free account to browse all doctors, check live availability and book your appointment online.</p>
                        {[['✅','Choose from 500+ specialist doctors'],['📅','See real-time available slots'],['💊','Get digital prescriptions'],['🧾','View bills & insurance online']].map(([icon, text]) => (
                            <div key={text} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                                <span style={{ fontSize:'16px' }}>{icon}</span>
                                <span style={{ fontSize:'13px', color:'#374151', fontWeight:500 }}>{text}</span>
                            </div>
                        ))}
                        <div style={{ display:'flex', gap:'10px', marginTop:'24px', flexWrap:'wrap' }}>
                            <button onClick={() => setModal('signup')} style={{ flex:1, minWidth:'120px', padding:'13px', borderRadius:'11px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>📅 Create Account</button>
                            <button onClick={() => setModal('login')}  style={{ padding:'13px 20px', borderRadius:'11px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign In</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background:'#0a4f3a', padding:'40px 20px 24px' }}>
                <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px', paddingBottom:'24px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'32px', height:'32px', background:'rgba(255,255,255,.15)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🏥</div>
                        <div>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>Priyansh Care Hospital</div>
                            <div style={{ fontSize:'10px', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.08em' }}>Caring for life since 2010</div>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
                        {['Privacy Policy','Terms of Service','Careers','Sitemap'].map(l => (
                            <span key={l} style={{ fontSize:'12px', cursor:'pointer', color:'rgba(255,255,255,.5)' }}>{l}</span>
                        ))}
                    </div>
                </div>
                <div style={{ maxWidth:'1100px', margin:'0 auto', paddingTop:'20px', textAlign:'center', fontSize:'12px', color:'rgba(255,255,255,.35)' }}>
                    © {new Date().getFullYear()} Priyansh Care Hospital. All rights reserved. Made with ❤️ for better healthcare.
                </div>
            </footer>

            {/* ── MODAL ── */}
            {modal && (
                <div
                    style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)', padding:'16px' }}
                    onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
                    <div style={{ background:'#fff', borderRadius:'22px', padding:'clamp(20px,4vw,36px)', width:'100%', maxWidth: modal === 'signup' ? '480px' : '420px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,.25)', animation:'modalIn .25s ease', position:'relative' }}>
                        <button onClick={() => setModal(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f1f5f9', border:'none', borderRadius:'8px', width:'30px', height:'30px', cursor:'pointer', fontSize:'14px', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>✕</button>
                        {modal === 'login'
                            ? <LoginModal
                                onClose={() => setModal(null)}
                                onSwitchToSignup={handleSwitchToSignup}
                                prefillEmail={loginPrefillEmail}
                            />
                            : <SignupModal
                                onClose={() => setModal(null)}
                                onSwitchToLogin={handleSwitchToLogin}
                            />
                        }
                    </div>
                </div>
            )}
        </div>
    );
}










// // import { useState, useEffect } from 'react';
// // import { useNavigate, useLocation } from 'react-router-dom';
// // import { useAuth } from '../auth/AuthContext.jsx';
// // import api from '../api/axios.js';
// //
// // function parseError(err) {
// //     const d = err.response?.data;
// //     if (!d) return null;
// //     if (typeof d === 'string') return d;
// //     if (d.message) return d.message;
// //     if (d.error)   return d.error;
// //     if (Array.isArray(d.errors)) return d.errors[0];
// //     return null;
// // }
// //
// // function friendlySignupError(err) {
// //     const status = err.response?.status;
// //     const raw    = parseError(err) || '';
// //     const lower  = raw.toLowerCase();
// //     if (lower.includes('duplicate entry') && lower.includes('phone'))
// //         return { field: 'phone', msg: 'This phone number is already registered.' };
// //     if (lower.includes('duplicate entry') && (lower.includes('username') || lower.includes('email')))
// //         return { field: 'username', msg: 'An account with this email already exists.' };
// //     if (lower.includes('duplicate entry') || lower.includes('constraint') || lower.includes('could not execute')) {
// //         if (/\b[6-9]\d{9}\b/.test(raw)) return { field: 'phone', msg: 'This phone number is already registered.' };
// //         return { field: 'username', msg: 'An account with this email already exists.' };
// //     }
// //     if (status === 409 || lower.includes('already') || lower.includes('exists') || lower.includes('registered')) {
// //         if (lower.includes('phone')) return { field: 'phone', msg: 'This phone number is already registered.' };
// //         return { field: 'username', msg: 'An account with this email already exists.' };
// //     }
// //     if (status === 400) {
// //         if (lower.includes('phone'))    return { field: 'phone',    msg: raw || 'Invalid phone number.' };
// //         if (lower.includes('email'))    return { field: 'username', msg: raw || 'Invalid email address.' };
// //         if (lower.includes('password')) return { field: 'password', msg: raw || 'Invalid password.' };
// //     }
// //     return { field: null, msg: raw || 'Unable to create account. Please try again.' };
// // }
// //
// // function isValidPhone(phone) {
// //     return /^[6-9]\d{9}$/.test(phone.replace(/[\s\-+]/g, ''));
// // }
// //
// // // ── Google SVG Icon ───────────────────────────────────────────────────────────
// // function GoogleIcon() {
// //     return (
// //         <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
// //             <g fill="none" fillRule="evenodd">
// //                 <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
// //                 <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
// //                 <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
// //                 <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
// //             </g>
// //         </svg>
// //     );
// // }
// //
// // // ── Google Button ─────────────────────────────────────────────────────────────
// // // FIX: Uses VITE_API_BASE_URL env variable instead of hardcoded localhost
// // function GoogleButton({ label = 'Continue with Google' }) {
// //     function handleGoogle() {
// //         const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
// //         window.location.href = `${base}/oauth2/authorization/google`;
// //     }
// //     return (
// //         <button
// //             type="button"
// //             onClick={handleGoogle}
// //             style={{
// //                 width: '100%', padding: '11px 16px', borderRadius: '11px',
// //                 border: '1.5px solid #e2e8f0', background: '#fff',
// //                 display: 'flex', alignItems: 'center', justifyContent: 'center',
// //                 gap: '10px', cursor: 'pointer', fontSize: '13px',
// //                 fontWeight: 600, color: '#374151',
// //                 transition: 'all .2s', boxShadow: '0 1px 4px rgba(0,0,0,.06)',
// //                 fontFamily: "'DM Sans',sans-serif",
// //             }}
// //             onMouseEnter={e => {
// //                 e.currentTarget.style.background = '#f8fafc';
// //                 e.currentTarget.style.borderColor = '#94a3b8';
// //                 e.currentTarget.style.transform = 'translateY(-1px)';
// //                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)';
// //             }}
// //             onMouseLeave={e => {
// //                 e.currentTarget.style.background = '#fff';
// //                 e.currentTarget.style.borderColor = '#e2e8f0';
// //                 e.currentTarget.style.transform = 'none';
// //                 e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)';
// //             }}
// //         >
// //             <GoogleIcon />
// //             {label}
// //         </button>
// //     );
// // }
// //
// // // ── Divider ───────────────────────────────────────────────────────────────────
// // function Divider() {
// //     return (
// //         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
// //             <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}/>
// //             <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
// //                 or continue with email
// //             </span>
// //             <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}/>
// //         </div>
// //     );
// // }
// //
// // // ── Login Modal ───────────────────────────────────────────────────────────────
// // function LoginModal({ onClose, onSwitchToSignup }) {
// //     const [form,     setForm]     = useState({ username: '', password: '' });
// //     const [error,    setError]    = useState('');
// //     const [loading,  setLoading]  = useState(false);
// //     const [showPass, setShowPass] = useState(false);
// //     const { login } = useAuth();
// //     const navigate  = useNavigate();
// //
// //     async function handleSubmit(e) {
// //         e.preventDefault();
// //         if (!form.username.trim())                              { setError('Please enter your email address'); return; }
// //         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) { setError('Please enter a valid email address'); return; }
// //         if (!form.password)                                     { setError('Please enter your password'); return; }
// //         setError(''); setLoading(true);
// //         try {
// //             const { data } = await api.post('/auth/login', {
// //                 username: form.username.trim().toLowerCase(),
// //                 password: form.password,
// //             });
// //             login(data.jwt);
// //             onClose();
// //             navigate('/role-redirect');
// //         } catch (err) {
// //             const status = err.response?.status;
// //             const raw    = parseError(err) || '';
// //             const lower  = raw.toLowerCase();
// //             if (status === 401 || status === 403) setError('Incorrect email or password. Please try again.');
// //             else if (lower.includes('verify') || lower.includes('not verified')) setError('Please verify your email before logging in.');
// //             else if (status === 404 || lower.includes('not found')) setError('No account found with this email.');
// //             else setError(raw || 'Something went wrong. Please try again.');
// //         } finally { setLoading(false); }
// //     }
// //
// //     const inp = {
// //         width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
// //         padding: '11px 14px', fontSize: '13px', outline: 'none',
// //         background: '#f8fafc', fontFamily: "'DM Sans',sans-serif",
// //         boxSizing: 'border-box', transition: 'border .15s',
// //     };
// //
// //     return (
// //         <div>
// //             <div style={{ marginBottom: '20px', textAlign: 'center' }}>
// //                 <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px' }}>
// //                     🏥
// //                 </div>
// //                 <div style={{ fontSize: '22px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '4px' }}>
// //                     Welcome back 👋
// //                 </div>
// //                 <div style={{ fontSize: '12px', color: '#94a3b8' }}>
// //                     Sign in to your Priyansh Care account
// //                 </div>
// //             </div>
// //
// //             <GoogleButton label="Sign in with Google" />
// //             <Divider />
// //
// //             {error && (
// //                 <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '9px', padding: '10px 12px', marginBottom: '14px', lineHeight: 1.5 }}>
// //                     ⚠️ {error}
// //                 </div>
// //             )}
// //
// //             <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
// //                 <div>
// //                     <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
// //                         Email Address
// //                     </label>
// //                     <input
// //                         style={inp} type="email" placeholder="your@email.com"
// //                         value={form.username}
// //                         onChange={e => { setError(''); setForm({ ...form, username: e.target.value }); }}
// //                         onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                         onBlur={e => e.target.style.borderColor = '#e2e8f0'}
// //                     />
// //                 </div>
// //                 <div>
// //                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
// //                         <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>
// //                             Password
// //                         </label>
// //                         <span
// //                             style={{ fontSize: '11px', color: '#0a4f3a', fontWeight: 600, cursor: 'pointer' }}
// //                             onClick={() => { onClose(); navigate('/forgot-password'); }}>
// //                             Forgot?
// //                         </span>
// //                     </div>
// //                     <div style={{ position: 'relative' }}>
// //                         <input
// //                             style={inp} type={showPass ? 'text' : 'password'}
// //                             placeholder="Enter your password"
// //                             value={form.password}
// //                             onChange={e => { setError(''); setForm({ ...form, password: e.target.value }); }}
// //                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                             onBlur={e => e.target.style.borderColor = '#e2e8f0'}
// //                         />
// //                         <button
// //                             type="button" onClick={() => setShowPass(p => !p)}
// //                             style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
// //                             {showPass ? 'Hide' : 'Show'}
// //                         </button>
// //                     </div>
// //                 </div>
// //
// //                 <button
// //                     type="submit" disabled={loading}
// //                     style={{ width: '100%', padding: '13px', borderRadius: '11px', border: 'none', background: loading ? '#9ca3af' : '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .2s' }}>
// //                     {loading ? 'Signing in...' : 'Sign In →'}
// //                 </button>
// //             </form>
// //
// //             <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
// //                 New to Priyansh Care?{' '}
// //                 <span style={{ color: '#0a4f3a', fontWeight: 700, cursor: 'pointer' }} onClick={onSwitchToSignup}>
// //                     Create account
// //                 </span>
// //             </div>
// //
// //             <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
// //                 {['🔒 Secure Login', '🏥 NABH Certified', '✅ Verified'].map(b => (
// //                     <div key={b} style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>{b}</div>
// //                 ))}
// //             </div>
// //         </div>
// //     );
// // }
// //
// // // ── Signup Modal ──────────────────────────────────────────────────────────────
// // function SignupModal({ onClose, onSwitchToLogin }) {
// //     const [form,        setForm]        = useState({ username: '', password: '', confirm: '', fullName: '', phone: '' });
// //     const [fieldErrors, setFieldErrors] = useState({});
// //     const [globalError, setGlobalError] = useState('');
// //     const [loading,     setLoading]     = useState(false);
// //     const navigate = useNavigate();
// //
// //     function validate() {
// //         const errs = {};
// //         if (!form.fullName.trim() || form.fullName.trim().length < 2) errs.fullName = 'Enter your full name';
// //         if (!form.phone.trim()) errs.phone = 'Phone number is required';
// //         else if (!isValidPhone(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number';
// //         if (!form.username.trim()) errs.username = 'Email address is required';
// //         else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) errs.username = 'Enter a valid email address';
// //         if (!form.password) errs.password = 'Password is required';
// //         else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
// //         if (!form.confirm) errs.confirm = 'Please confirm your password';
// //         else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
// //         return errs;
// //     }
// //
// //     async function handleSubmit(e) {
// //         e.preventDefault();
// //         setGlobalError('');
// //         const errs = validate();
// //         setFieldErrors(errs);
// //         if (Object.keys(errs).length > 0) return;
// //         setLoading(true);
// //         try {
// //             await api.post('/auth/signup', {
// //                 username: form.username.trim().toLowerCase(),
// //                 password: form.password,
// //                 fullName: form.fullName.trim(),
// //                 phone:    form.phone.replace(/[\s\-]/g, ''),
// //             });
// //             localStorage.setItem('userInfo', JSON.stringify({
// //                 username: form.username.trim().toLowerCase(),
// //                 fullName: form.fullName.trim(),
// //                 phone:    form.phone.replace(/[\s\-]/g, ''),
// //             }));
// //             onClose();
// //             navigate('/verify-otp', { state: { email: form.username.trim().toLowerCase() } });
// //         } catch (err) {
// //             const { field, msg } = friendlySignupError(err);
// //             if (field) setFieldErrors(prev => ({ ...prev, [field]: msg }));
// //             else setGlobalError(msg);
// //         } finally { setLoading(false); }
// //     }
// //
// //     function strength(p) {
// //         if (!p)           return null;
// //         if (p.length < 4) return { label: 'Too weak', color: '#ef4444', w: '20%' };
// //         if (p.length < 6) return { label: 'Weak',     color: '#f97316', w: '40%' };
// //         if (p.length < 8) return { label: 'Fair',     color: '#eab308', w: '65%' };
// //         return              { label: 'Strong',   color: '#0a4f3a', w: '100%' };
// //     }
// //     const str = strength(form.password);
// //
// //     const inp = (hasErr) => ({
// //         width: '100%', border: `1.5px solid ${hasErr ? '#fca5a5' : '#e2e8f0'}`,
// //         borderRadius: '10px', padding: '10px 13px', fontSize: '13px', outline: 'none',
// //         background: hasErr ? '#fff5f5' : '#f8fafc', fontFamily: "'DM Sans',sans-serif",
// //         boxSizing: 'border-box', transition: 'border .15s',
// //     });
// //
// //     const FieldErr = ({ k }) => fieldErrors[k]
// //         ? <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600, marginTop: '4px', lineHeight: 1.4 }}>⚠ {fieldErrors[k]}</div>
// //         : null;
// //
// //     function clear(k) { setFieldErrors(p => { const n = { ...p }; delete n[k]; return n; }); }
// //
// //     return (
// //         <div>
// //             <div style={{ marginBottom: '16px', textAlign: 'center' }}>
// //                 <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 12px' }}>
// //                     🏥
// //                 </div>
// //                 <div style={{ fontSize: '22px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '4px' }}>
// //                     Create account 🏥
// //                 </div>
// //                 <div style={{ fontSize: '12px', color: '#94a3b8' }}>
// //                     Register as a new patient at Priyansh Care
// //                 </div>
// //             </div>
// //
// //             <GoogleButton label="Sign up with Google" />
// //             <Divider />
// //
// //             {globalError && (
// //                 <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '9px', padding: '9px 12px', marginBottom: '12px', lineHeight: 1.5 }}>
// //                     ⚠️ {globalError}
// //                 </div>
// //             )}
// //
// //             <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
// //                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
// //                     <div>
// //                         <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
// //                             Full Name
// //                         </label>
// //                         <input
// //                             style={inp(!!fieldErrors.fullName)}
// //                             placeholder="Priyanshu Jaiswal"
// //                             value={form.fullName}
// //                             onChange={e => { clear('fullName'); setForm({ ...form, fullName: e.target.value }); }}
// //                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                             onBlur={e => e.target.style.borderColor = fieldErrors.fullName ? '#fca5a5' : '#e2e8f0'}
// //                         />
// //                         <FieldErr k="fullName"/>
// //                     </div>
// //                     <div>
// //                         <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
// //                             Phone
// //                         </label>
// //                         <input
// //                             style={inp(!!fieldErrors.phone)}
// //                             type="tel" placeholder="9876543210"
// //                             value={form.phone} maxLength={10}
// //                             onChange={e => { clear('phone'); setForm({ ...form, phone: e.target.value.replace(/\D/g, '') }); }}
// //                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                             onBlur={e => {
// //                                 e.target.style.borderColor = fieldErrors.phone ? '#fca5a5' : '#e2e8f0';
// //                                 if (form.phone && !isValidPhone(form.phone))
// //                                     setFieldErrors(p => ({ ...p, phone: 'Enter a valid 10-digit mobile number' }));
// //                             }}
// //                         />
// //                         <FieldErr k="phone"/>
// //                     </div>
// //                 </div>
// //
// //                 <div>
// //                     <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
// //                         Email Address
// //                     </label>
// //                     <input
// //                         style={inp(!!fieldErrors.username)}
// //                         type="email" placeholder="your@email.com"
// //                         value={form.username}
// //                         onChange={e => { clear('username'); setForm({ ...form, username: e.target.value }); }}
// //                         onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                         onBlur={e => e.target.style.borderColor = fieldErrors.username ? '#fca5a5' : '#e2e8f0'}
// //                     />
// //                     <FieldErr k="username"/>
// //                 </div>
// //
// //                 <div>
// //                     <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
// //                         Password
// //                     </label>
// //                     <input
// //                         style={inp(!!fieldErrors.password)}
// //                         type="password" placeholder="Min 6 characters"
// //                         value={form.password}
// //                         onChange={e => { clear('password'); setForm({ ...form, password: e.target.value }); }}
// //                         onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                         onBlur={e => e.target.style.borderColor = fieldErrors.password ? '#fca5a5' : '#e2e8f0'}
// //                     />
// //                     {str && !fieldErrors.password && (
// //                         <div style={{ marginTop: '5px' }}>
// //                             <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
// //                                 <div style={{ height: '100%', width: str.w, background: str.color, borderRadius: '99px', transition: 'width .3s' }}/>
// //                             </div>
// //                             <div style={{ fontSize: '10px', color: str.color, fontWeight: 600, marginTop: '3px' }}>{str.label}</div>
// //                         </div>
// //                     )}
// //                     <FieldErr k="password"/>
// //                 </div>
// //
// //                 <div>
// //                     <label style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '5px' }}>
// //                         Confirm Password
// //                     </label>
// //                     <input
// //                         style={inp(!!fieldErrors.confirm)}
// //                         type="password" placeholder="Repeat password"
// //                         value={form.confirm}
// //                         onChange={e => { clear('confirm'); setForm({ ...form, confirm: e.target.value }); }}
// //                         onFocus={e => e.target.style.borderColor = '#0a4f3a'}
// //                         onBlur={e => e.target.style.borderColor = fieldErrors.confirm ? '#fca5a5' : '#e2e8f0'}
// //                     />
// //                     {form.confirm && !fieldErrors.confirm && (
// //                         <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '3px', color: form.password === form.confirm ? '#0a4f3a' : '#ef4444' }}>
// //                             {form.password === form.confirm ? '✓ Passwords match' : '✗ Does not match'}
// //                         </div>
// //                     )}
// //                     <FieldErr k="confirm"/>
// //                 </div>
// //
// //                 <button
// //                     type="submit" disabled={loading}
// //                     style={{ width: '100%', padding: '12px', borderRadius: '11px', border: 'none', background: loading ? '#9ca3af' : '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px', transition: 'background .2s' }}>
// //                     {loading ? 'Creating account...' : 'Create Account & Send OTP →'}
// //                 </button>
// //             </form>
// //
// //             <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
// //                 Already have an account?{' '}
// //                 <span style={{ color: '#0a4f3a', fontWeight: 700, cursor: 'pointer' }} onClick={onSwitchToLogin}>
// //                     Sign in
// //                 </span>
// //             </div>
// //
// //             <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '9px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
// //                 🔒 Your data is encrypted & secure. By signing up, you agree to our{' '}
// //                 <span style={{ color: '#0a4f3a', fontWeight: 600, cursor: 'pointer' }}>Terms</span> &{' '}
// //                 <span style={{ color: '#0a4f3a', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
// //             </div>
// //         </div>
// //     );
// // }
// //
// // // ── Main Landing Page ─────────────────────────────────────────────────────────
// // export default function LandingPage() {
// //     const [modal,      setModal]      = useState(null);
// //     const [mobileMenu, setMobileMenu] = useState(false);
// //     const { state } = useLocation();
// //
// //     useEffect(() => {
// //         if (state?.openModal) setModal(state.openModal);
// //     }, [state]);
// //
// //     const departments = [
// //         { icon: '❤️',  name: 'Cardiology',      desc: 'Heart & cardiovascular care'  },
// //         { icon: '🧠',  name: 'Neurology',        desc: 'Brain & nervous system'       },
// //         { icon: '🦴',  name: 'Orthopedics',      desc: 'Bone, joint & muscle care'    },
// //         { icon: '👁️', name: 'Ophthalmology',    desc: 'Eye care & vision'            },
// //         { icon: '🫁',  name: 'Pulmonology',      desc: 'Lung & respiratory care'      },
// //         { icon: '🩺',  name: 'General Medicine', desc: 'Primary healthcare'           },
// //         { icon: '👶',  name: 'Pediatrics',       desc: "Children's health"            },
// //         { icon: '🦷',  name: 'Dentistry',        desc: 'Oral & dental care'           },
// //     ];
// //
// //     const doctors = [
// //         { name: 'Dr. Arun Kapoor',  spec: 'Cardiology',    exp: '12 yrs', quali: 'MBBS, MD - Cardiology',    color: '#0a4f3a', bg: '#f0fdf4' },
// //         { name: 'Dr. Priya Mehta',  spec: 'Neurology',     exp: '9 yrs',  quali: 'MBBS, DM - Neurology',     color: '#185FA5', bg: '#EFF6FF' },
// //         { name: 'Dr. Rahul Sharma', spec: 'Orthopedics',   exp: '15 yrs', quali: 'MBBS, MS - Orthopaedics',  color: '#7e22ce', bg: '#FDF4FF' },
// //         { name: 'Dr. Sneha Patel',  spec: 'Ophthalmology', exp: '8 yrs',  quali: 'MBBS, MS - Ophthalmology', color: '#c2410c', bg: '#FFF7ED' },
// //     ];
// //
// //     const steps = [
// //         { icon: '👤', step: '01', title: 'Create Account',   desc: 'Sign up as a patient with your email and phone number in seconds.' },
// //         { icon: '🔍', step: '02', title: 'Find Your Doctor', desc: 'Browse specialists by department or search by name and specialty.'  },
// //         { icon: '📅', step: '03', title: 'Book Appointment', desc: 'Choose your preferred date and time slot from available slots.'     },
// //         { icon: '💊', step: '04', title: 'Get Treatment',    desc: 'Visit the doctor, receive prescriptions and medical records online.' },
// //     ];
// //
// //     return (
// //         <div style={{ fontFamily: "'DM Sans','Outfit',sans-serif", background: '#fff', overflowX: 'hidden' }}>
// //             <style>{`
// //                 @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
// //                 @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
// //                 @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
// //                 @keyframes modalIn   { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
// //                 @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
// //                 @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
// //                 * { box-sizing:border-box; }
// //                 .lp-btn-primary { transition:all .2s !important; }
// //                 .lp-btn-primary:hover { background:#1D9E75!important; transform:translateY(-2px); box-shadow:0 12px 28px rgba(10,79,58,.3)!important; }
// //                 .lp-btn-outline:hover { background:#0a4f3a!important; color:#fff!important; transform:translateY(-2px); }
// //                 .dept-card:hover  { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; border-color:#5DCAA5!important; }
// //                 .doc-card:hover   { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; }
// //                 .nav-link:hover   { color:#0a4f3a!important; }
// //                 .step-card:hover  { background:#0a4f3a!important; }
// //                 .step-card:hover .step-icon  { background:rgba(255,255,255,.15)!important; }
// //                 .step-card:hover .step-num   { color:rgba(255,255,255,.4)!important; }
// //                 .step-card:hover .step-title { color:#fff!important; }
// //                 .step-card:hover .step-desc  { color:rgba(255,255,255,.7)!important; }
// //                 .lp-steps-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
// //                 .lp-dept-grid    { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; max-width:1100px; margin:0 auto; }
// //                 .lp-doc-grid     { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
// //                 .lp-about-grid   { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; max-width:1100px; margin:0 auto; position:relative; }
// //                 .lp-about-stats  { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
// //                 .lp-contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; max-width:1100px; margin:0 auto; }
// //                 .lp-hero-stats   { display:flex; gap:32px; justify-content:center; padding-top:32px; border-top:1px solid rgba(255,255,255,.1); flex-wrap:wrap; }
// //                 .lp-hero-btns    { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:48px; }
// //                 .lp-section-pad  { padding:90px 60px; }
// //                 .lp-nav          { padding:14px 60px; }
// //                 .lp-nav-links    { display:flex; align-items:center; gap:28px; }
// //                 .lp-nav-actions  { display:flex; gap:10px; }
// //                 .lp-mobile-menu-btn { display:none; }
// //                 .lp-mobile-nav   { display:none; }
// //                 @media (max-width:1024px) {
// //                     .lp-steps-grid   { grid-template-columns:repeat(2,1fr)!important; }
// //                     .lp-doc-grid     { grid-template-columns:repeat(2,1fr)!important; }
// //                     .lp-about-grid   { grid-template-columns:1fr!important; gap:40px!important; }
// //                     .lp-contact-grid { grid-template-columns:1fr!important; gap:40px!important; }
// //                     .lp-section-pad  { padding:70px 40px!important; }
// //                     .lp-nav          { padding:14px 32px!important; }
// //                 }
// //                 @media (max-width:768px) {
// //                     .lp-nav-links       { display:none!important; }
// //                     .lp-nav-actions     { display:none!important; }
// //                     .lp-mobile-menu-btn { display:flex!important; }
// //                     .lp-mobile-nav.open { display:flex!important; }
// //                     .lp-dept-grid  { grid-template-columns:repeat(2,1fr)!important; }
// //                     .lp-doc-grid   { grid-template-columns:repeat(2,1fr)!important; }
// //                     .lp-steps-grid { grid-template-columns:repeat(2,1fr)!important; }
// //                     .lp-section-pad { padding:56px 20px!important; }
// //                     .lp-nav         { padding:12px 20px!important; }
// //                     .lp-hero-stats  { gap:16px!important; }
// //                 }
// //                 @media (max-width:480px) {
// //                     .lp-dept-grid  { grid-template-columns:repeat(2,1fr)!important; }
// //                     .lp-doc-grid   { grid-template-columns:1fr!important; }
// //                     .lp-steps-grid { grid-template-columns:1fr!important; }
// //                     .lp-hero-btns button { width:100%!important; }
// //                 }
// //             `}</style>
// //
// //             {/* ── NAVBAR ── */}
// //             <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(255,255,255,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
// //                 <div className="lp-nav" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
// //                     <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
// //                         <div style={{ width:'36px', height:'36px', background:'#0a4f3a', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🏥</div>
// //                         <div>
// //                             <div style={{ fontSize:'14px', fontWeight:700, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>Priyansh Care</div>
// //                             <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.09em' }}>Hospital</div>
// //                         </div>
// //                     </div>
// //                     <div className="lp-nav-links">
// //                         {['Services','Doctors','Departments','About','Contact'].map(l => (
// //                             <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ fontSize:'13px', fontWeight:500, color:'#64748b', textDecoration:'none', transition:'color .15s' }}>{l}</a>
// //                         ))}
// //                     </div>
// //                     <div className="lp-nav-actions">
// //                         <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding:'9px 20px', borderRadius:'9px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all .2s' }}>Sign In</button>
// //                         <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding:'9px 20px', borderRadius:'9px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all .2s', boxShadow:'0 4px 14px rgba(10,79,58,.25)' }}>Book Appointment</button>
// //                     </div>
// //                     <button className="lp-mobile-menu-btn" onClick={() => setMobileMenu(v => !v)}
// //                             style={{ background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#0a4f3a', alignItems:'center', justifyContent:'center', padding:0 }}>
// //                         {mobileMenu ? '✕' : '☰'}
// //                     </button>
// //                 </div>
// //                 <div className={`lp-mobile-nav ${mobileMenu ? 'open' : ''}`}
// //                      style={{ flexDirection:'column', padding:'16px 20px 20px', borderTop:'1px solid #f0f0f0', background:'#fff', gap:'4px', animation:'slideDown .2s ease' }}>
// //                     {['Services','Doctors','Departments','About','Contact'].map(l => (
// //                         <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
// //                            style={{ fontSize:'14px', fontWeight:500, color:'#374151', textDecoration:'none', padding:'10px 8px', borderRadius:'8px', display:'block' }}>{l}</a>
// //                     ))}
// //                     <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
// //                         <button onClick={() => { setModal('login'); setMobileMenu(false); }} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign In</button>
// //                         <button onClick={() => { setModal('signup'); setMobileMenu(false); }} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign Up</button>
// //                     </div>
// //                 </div>
// //             </nav>
// //
// //             {/* ── HERO ── */}
// //             <section style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a4f3a 0%,#0d6b50 50%,#1a8a6a 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingTop:'80px' }}>
// //                 <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'-100px', right:'-100px', pointerEvents:'none' }}/>
// //                 <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:'-60px', left:'-60px', pointerEvents:'none' }}/>
// //                 <div style={{ position:'absolute', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(93,202,165,.15)', top:'30%', left:'10%', animation:'float 6s ease-in-out infinite', pointerEvents:'none' }}/>
// //                 <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
// //                 <div style={{ position:'relative', textAlign:'center', maxWidth:'760px', width:'100%', padding:'0 24px', animation:'fadeUp .8s ease' }}>
// //                     <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'20px', padding:'6px 16px', fontSize:'12px', color:'rgba(255,255,255,.8)', fontWeight:500, marginBottom:'28px', backdropFilter:'blur(8px)' }}>
// //                         <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#5DCAA5', display:'inline-block', animation:'pulse 2s infinite' }}/>
// //                         Trusted by 50,000+ patients across India
// //                     </div>
// //                     <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:'20px' }}>
// //                         Your Health,<br/>Our <span style={{ color:'#5DCAA5' }}>Priority</span>
// //                     </h1>
// //                     <p style={{ fontSize:'clamp(13px,2vw,16px)', color:'rgba(255,255,255,.65)', lineHeight:1.8, maxWidth:'520px', margin:'0 auto 36px' }}>
// //                         World-class healthcare at your fingertips. Book appointments, access prescriptions, manage insurance — all in one place.
// //                     </p>
// //                     <div className="lp-hero-btns">
// //                         <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding:'15px 32px', borderRadius:'12px', border:'none', background:'#5DCAA5', color:'#0a4f3a', fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(93,202,165,.4)' }}>
// //                             📅 Book Appointment
// //                         </button>
// //                         <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding:'15px 32px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:'14px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)' }}>
// //                             Sign In →
// //                         </button>
// //                     </div>
// //                     <div className="lp-hero-stats">
// //                         {[['500+','Expert Doctors'],['50K+','Happy Patients'],['20+','Departments'],['15+','Years of Care']].map(([num, lbl]) => (
// //                             <div key={lbl} style={{ textAlign:'center', minWidth:'80px' }}>
// //                                 <div style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#5DCAA5', fontFamily:"'Playfair Display',serif" }}>{num}</div>
// //                                 <div style={{ fontSize:'11px', color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginTop:'3px' }}>{lbl}</div>
// //                             </div>
// //                         ))}
// //                     </div>
// //                 </div>
// //             </section>
// //
// //             {/* ── HOW IT WORKS ── */}
// //             <section id="services" className="lp-section-pad" style={{ background:'#f8fafa' }}>
// //                 <div style={{ textAlign:'center', marginBottom:'56px' }}>
// //                     <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>How it works</div>
// //                     <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>Healthcare in 4 Simple Steps</h2>
// //                     <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>From registration to recovery — we've made it effortless.</p>
// //                 </div>
// //                 <div className="lp-steps-grid">
// //                     {steps.map(s => (
// //                         <div key={s.step} className="step-card" style={{ background:'#fff', borderRadius:'18px', padding:'28px 24px', border:'1px solid #e8f4ef', transition:'all .25s', cursor:'default', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
// //                             <div className="step-num" style={{ fontSize:'11px', fontWeight:800, color:'#d1fae5', letterSpacing:'.1em', marginBottom:'14px', transition:'color .25s' }}>{s.step}</div>
// //                             <div className="step-icon" style={{ width:'48px', height:'48px', borderRadius:'14px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'14px', transition:'background .25s' }}>{s.icon}</div>
// //                             <div className="step-title" style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'8px', transition:'color .25s' }}>{s.title}</div>
// //                             <div className="step-desc" style={{ fontSize:'12px', color:'#64748b', lineHeight:1.7, transition:'color .25s' }}>{s.desc}</div>
// //                         </div>
// //                     ))}
// //                 </div>
// //             </section>
// //
// //             {/* ── DEPARTMENTS ── */}
// //             <section id="departments" className="lp-section-pad" style={{ background:'#fff' }}>
// //                 <div style={{ textAlign:'center', marginBottom:'56px' }}>
// //                     <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Our Specialties</div>
// //                     <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>World-Class Departments</h2>
// //                     <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>Comprehensive care across all major medical specialties under one roof.</p>
// //                 </div>
// //                 <div className="lp-dept-grid">
// //                     {departments.map(d => (
// //                         <div key={d.name} className="dept-card" style={{ border:'1.5px solid #e8f4ef', borderRadius:'16px', padding:'24px 20px', cursor:'pointer', transition:'all .25s', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
// //                             <div style={{ fontSize:'28px', marginBottom:'12px' }}>{d.icon}</div>
// //                             <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'5px' }}>{d.name}</div>
// //                             <div style={{ fontSize:'12px', color:'#94a3b8' }}>{d.desc}</div>
// //                         </div>
// //                     ))}
// //                 </div>
// //             </section>
// //
// //             {/* ── DOCTORS ── */}
// //             <section id="doctors" className="lp-section-pad" style={{ background:'#f0fdf4' }}>
// //                 <div style={{ textAlign:'center', marginBottom:'56px' }}>
// //                     <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Our Team</div>
// //                     <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>Meet Our Specialists</h2>
// //                     <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>Experienced doctors dedicated to your health and well-being.</p>
// //                 </div>
// //                 <div className="lp-doc-grid">
// //                     {doctors.map(doc => (
// //                         <div key={doc.name} className="doc-card" style={{ background:'#fff', borderRadius:'18px', padding:'24px', border:'1px solid #e8f4ef', transition:'all .25s', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
// //                             <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:doc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'14px' }}>👨‍⚕️</div>
// //                             <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'3px' }}>{doc.name}</div>
// //                             <div style={{ fontSize:'12px', color:doc.color, fontWeight:600, marginBottom:'6px' }}>{doc.spec}</div>
// //                             <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'12px' }}>{doc.quali}</div>
// //                             <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:doc.bg, border:`1px solid ${doc.color}22`, borderRadius:'8px', padding:'5px 10px' }}>
// //                                 <span style={{ fontSize:'12px' }}>⏳</span>
// //                                 <span style={{ fontSize:'11px', fontWeight:600, color:doc.color }}>{doc.exp} experience</span>
// //                             </div>
// //                         </div>
// //                     ))}
// //                 </div>
// //                 <div style={{ textAlign:'center', marginTop:'40px' }}>
// //                     <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'16px' }}>Sign in to see all doctors, their availability and book an appointment</p>
// //                     <button onClick={() => setModal('signup')} style={{ padding:'13px 32px', borderRadius:'12px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(10,79,58,.25)' }}>
// //                         📅 Create Account to Book
// //                     </button>
// //                 </div>
// //             </section>
// //
// //             {/* ── ABOUT ── */}
// //             <section id="about" className="lp-section-pad" style={{ background:'#0a4f3a', position:'relative', overflow:'hidden' }}>
// //                 <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'-100px', right:'-80px', pointerEvents:'none' }}/>
// //                 <div className="lp-about-grid">
// //                     <div>
// //                         <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'12px' }}>Why Choose Us</div>
// //                         <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:'20px' }}>
// //                             Healthcare You Can<br/><span style={{ color:'#5DCAA5' }}>Trust & Rely On</span>
// //                         </h2>
// //                         <p style={{ fontSize:'14px', color:'rgba(255,255,255,.65)', lineHeight:1.8, marginBottom:'32px' }}>
// //                             At Priyansh Care, we combine cutting-edge medical technology with compassionate care to deliver the best health outcomes for every patient.
// //                         </p>
// //                         {[
// //                             ['🏆','NABH Accredited Hospital','Nationally certified for quality & safety standards'],
// //                             ['🕐','24/7 Emergency Services','Round-the-clock care for critical situations'],
// //                             ['💻','Digital Health Records','All your records secure and accessible anytime'],
// //                             ['💊','In-house Pharmacy','Medicines available right at the hospital'],
// //                         ].map(([icon, title, desc]) => (
// //                             <div key={title} style={{ display:'flex', gap:'14px', marginBottom:'20px', alignItems:'flex-start' }}>
// //                                 <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(93,202,165,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{icon}</div>
// //                                 <div>
// //                                     <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{title}</div>
// //                                     <div style={{ fontSize:'12px', color:'rgba(255,255,255,.55)' }}>{desc}</div>
// //                                 </div>
// //                             </div>
// //                         ))}
// //                     </div>
// //                     <div className="lp-about-stats">
// //                         {[
// //                             { num:'99%',  label:'Patient Satisfaction', icon:'😊' },
// //                             { num:'500+', label:'Specialist Doctors',   icon:'👨‍⚕️' },
// //                             { num:'24/7', label:'Emergency Support',    icon:'🚨' },
// //                             { num:'50K+', label:'Lives Touched',        icon:'❤️' },
// //                         ].map(s => (
// //                             <div key={s.label} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'16px', padding:'24px 20px', textAlign:'center' }}>
// //                                 <div style={{ fontSize:'28px', marginBottom:'8px' }}>{s.icon}</div>
// //                                 <div style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:800, color:'#5DCAA5', fontFamily:"'Playfair Display',serif", marginBottom:'5px' }}>{s.num}</div>
// //                                 <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.07em' }}>{s.label}</div>
// //                             </div>
// //                         ))}
// //                     </div>
// //                 </div>
// //             </section>
// //
// //             {/* ── CONTACT ── */}
// //             <section id="contact" className="lp-section-pad" style={{ background:'#fff' }}>
// //                 <div className="lp-contact-grid">
// //                     <div>
// //                         <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Contact Us</div>
// //                         <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'16px' }}>Get in Touch</h2>
// //                         <p style={{ fontSize:'14px', color:'#64748b', lineHeight:1.8, marginBottom:'32px' }}>Have questions? Our team is here to help you 24/7.</p>
// //                         {[
// //                             ['📍','Address','Sector 14, Priyansh Care Hospital, New Delhi - 110001'],
// //                             ['📞','Phone',  '+91 98765 43210 / +91 11-2345-6789'],
// //                             ['📧','Email',  'care@priyanshcare.com'],
// //                             ['⏰','Timings','Mon–Sat: 8am–8pm | Emergency: 24/7'],
// //                         ].map(([icon, label, val]) => (
// //                             <div key={label} style={{ display:'flex', gap:'14px', marginBottom:'20px', alignItems:'flex-start' }}>
// //                                 <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{icon}</div>
// //                                 <div>
// //                                     <div style={{ fontSize:'11px', fontWeight:700, color:'#0a4f3a', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>{label}</div>
// //                                     <div style={{ fontSize:'13px', color:'#374151' }}>{val}</div>
// //                                 </div>
// //                             </div>
// //                         ))}
// //                     </div>
// //                     <div style={{ background:'#f0fdf4', borderRadius:'20px', padding:'32px', border:'1px solid #d1fae5' }}>
// //                         <h3 style={{ fontSize:'18px', fontWeight:700, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'6px' }}>Book an Appointment</h3>
// //                         <p style={{ fontSize:'12px', color:'#64748b', marginBottom:'20px', lineHeight:1.6 }}>Create a free account to browse all doctors, check live availability and book your appointment online.</p>
// //                         {[
// //                             ['✅','Choose from 500+ specialist doctors'],
// //                             ['📅','See real-time available slots'],
// //                             ['💊','Get digital prescriptions'],
// //                             ['🧾','View bills & insurance online'],
// //                         ].map(([icon, text]) => (
// //                             <div key={text} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
// //                                 <span style={{ fontSize:'16px' }}>{icon}</span>
// //                                 <span style={{ fontSize:'13px', color:'#374151', fontWeight:500 }}>{text}</span>
// //                             </div>
// //                         ))}
// //                         <div style={{ display:'flex', gap:'10px', marginTop:'24px', flexWrap:'wrap' }}>
// //                             <button onClick={() => setModal('signup')} style={{ flex:1, minWidth:'120px', padding:'13px', borderRadius:'11px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
// //                                 📅 Create Account
// //                             </button>
// //                             <button onClick={() => setModal('login')} style={{ padding:'13px 20px', borderRadius:'11px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
// //                                 Sign In
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>
// //             </section>
// //
// //             {/* ── FOOTER ── */}
// //             <footer style={{ background:'#0a4f3a', padding:'40px 20px 24px' }}>
// //                 <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px', paddingBottom:'24px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
// //                     <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
// //                         <div style={{ width:'32px', height:'32px', background:'rgba(255,255,255,.15)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🏥</div>
// //                         <div>
// //                             <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>Priyansh Care Hospital</div>
// //                             <div style={{ fontSize:'10px', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.08em' }}>Caring for life since 2010</div>
// //                         </div>
// //                     </div>
// //                     <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
// //                         {['Privacy Policy','Terms of Service','Careers','Sitemap'].map(l => (
// //                             <span key={l} style={{ fontSize:'12px', cursor:'pointer', color:'rgba(255,255,255,.5)' }}>{l}</span>
// //                         ))}
// //                     </div>
// //                 </div>
// //                 <div style={{ maxWidth:'1100px', margin:'0 auto', paddingTop:'20px', textAlign:'center', fontSize:'12px', color:'rgba(255,255,255,.35)' }}>
// //                     © {new Date().getFullYear()} Priyansh Care Hospital. All rights reserved. Made with ❤️ for better healthcare.
// //                 </div>
// //             </footer>
// //
// //             {/* ── MODAL ── */}
// //             {modal && (
// //                 <div
// //                     style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)', padding:'16px' }}
// //                     onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
// //                     <div style={{ background:'#fff', borderRadius:'22px', padding:'clamp(20px,4vw,36px)', width:'100%', maxWidth: modal === 'signup' ? '480px' : '420px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,.25)', animation:'modalIn .25s ease', position:'relative' }}>
// //                         <button onClick={() => setModal(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f1f5f9', border:'none', borderRadius:'8px', width:'30px', height:'30px', cursor:'pointer', fontSize:'14px', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
// //                         {modal === 'login'
// //                             ? <LoginModal  onClose={() => setModal(null)} onSwitchToSignup={() => setModal('signup')} />
// //                             : <SignupModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />
// //                         }
// //                     </div>
// //                 </div>
// //             )}
// //         </div>
// //     );
// // }
//
// import { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../auth/AuthContext.jsx';
// import api from '../api/axios.js';
//
// // ── Error Parsing ─────────────────────────────────────────────────────────────
// function parseError(err) {
//     if (!err.response) return null;
//     const d = err.response?.data;
//     if (!d) return null;
//     if (typeof d === 'string') return d.trim();
//     if (d.message) return String(d.message).trim();
//     if (d.error)   return String(d.error).trim();
//     if (d.msg)     return String(d.msg).trim();
//     if (d.detail)  return String(d.detail).trim();
//     if (Array.isArray(d.errors) && d.errors.length > 0) return String(d.errors[0]).trim();
//     // Try to stringify and extract anything useful
//     try { return JSON.stringify(d); } catch { return null; }
// }
//
// function friendlySignupError(err) {
//     const status = err.response?.status;
//     const raw    = parseError(err) || '';
//     const lower  = raw.toLowerCase();
//
//     // Network error
//     if (!err.response) return { field: null, msg: 'Network error. Please check your connection and try again.' };
//
//     // 409 Conflict — most reliable for duplicates
//     if (status === 409) {
//         if (lower.includes('phone') || lower.includes('mobile'))
//             return { field: 'phone', msg: 'This phone number is already registered. Try signing in instead.' };
//         if (lower.includes('email') || lower.includes('username') || lower.includes('user'))
//             return { field: 'username', msg: 'An account with this email already exists. Try signing in instead.' };
//         // Generic 409 — try heuristics
//         return { field: 'username', msg: 'An account with these details already exists. Try signing in instead.' };
//     }
//
//     // Database / constraint errors
//     const isDuplicate =
//         lower.includes('duplicate') ||
//         lower.includes('already exists') ||
//         lower.includes('already registered') ||
//         lower.includes('unique constraint') ||
//         lower.includes('violates unique') ||
//         lower.includes('integrity constraint') ||
//         lower.includes('could not execute statement') ||
//         lower.includes('constraint violation');
//
//     if (isDuplicate) {
//         if (lower.includes('phone') || lower.includes('mobile') || /\b[6-9]\d{9}\b/.test(raw))
//             return { field: 'phone', msg: 'This phone number is already registered. Try signing in instead.' };
//         if (lower.includes('email') || lower.includes('username') || lower.includes('user'))
//             return { field: 'username', msg: 'An account with this email already exists. Try signing in instead.' };
//         return { field: 'username', msg: 'An account with these details already exists. Try signing in instead.' };
//     }
//
//     // 400 Bad Request
//     if (status === 400) {
//         if (lower.includes('phone') || lower.includes('mobile'))
//             return { field: 'phone', msg: raw || 'Invalid phone number.' };
//         if (lower.includes('email'))
//             return { field: 'username', msg: raw || 'Invalid email address.' };
//         if (lower.includes('password'))
//             return { field: 'password', msg: raw || 'Invalid password.' };
//         if (lower.includes('name'))
//             return { field: 'fullName', msg: raw || 'Invalid name.' };
//         if (raw) return { field: null, msg: raw };
//     }
//
//     // 500 / unknown — still try to be specific
//     if (lower.includes('phone') || lower.includes('mobile'))
//         return { field: 'phone', msg: 'This phone number may already be registered.' };
//     if (lower.includes('email') || lower.includes('username'))
//         return { field: 'username', msg: 'This email may already be registered.' };
//
//     return { field: null, msg: raw || `Registration failed (${status || 'network error'}). Please try again.` };
// }
//
// function friendlyLoginError(err) {
//     if (!err.response) return 'Network error. Please check your connection.';
//     const status = err.response?.status;
//     const raw    = parseError(err) || '';
//     const lower  = raw.toLowerCase();
//     if (status === 401 || status === 403)   return 'Incorrect email or password. Please try again.';
//     if (lower.includes('verify') || lower.includes('not verified'))
//         return 'Please verify your email before logging in. Check your inbox for the verification link.';
//     if (status === 404 || lower.includes('not found') || lower.includes('no account'))
//         return 'No account found with this email. Please sign up first.';
//     if (lower.includes('locked') || lower.includes('disabled'))
//         return 'Your account has been locked. Please contact support.';
//     return raw || `Login failed (${status || 'network error'}). Please try again.`;
// }
//
// // ── Validation ────────────────────────────────────────────────────────────────
// function isValidPhone(phone) {
//     return /^[6-9]\d{9}$/.test(phone.replace(/[\s\-+()]/g, ''));
// }
//
// function isValidEmail(email) {
//     return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
// }
//
// function passwordStrength(p) {
//     if (!p) return null;
//     let score = 0;
//     if (p.length >= 8)  score++;
//     if (p.length >= 12) score++;
//     if (/[A-Z]/.test(p)) score++;
//     if (/[a-z]/.test(p)) score++;
//     if (/[0-9]/.test(p)) score++;
//     if (/[^A-Za-z0-9]/.test(p)) score++;
//     if (score <= 1) return { label: 'Too weak',  color: '#ef4444', bg: '#fef2f2', w: '16%',  level: 0 };
//     if (score <= 2) return { label: 'Weak',      color: '#f97316', bg: '#fff7ed', w: '35%',  level: 1 };
//     if (score <= 3) return { label: 'Fair',      color: '#eab308', bg: '#fefce8', w: '55%',  level: 2 };
//     if (score <= 4) return { label: 'Good',      color: '#22c55e', bg: '#f0fdf4', w: '75%',  level: 3 };
//     return              { label: 'Strong 🔒',    color: '#0a4f3a', bg: '#f0fdf4', w: '100%', level: 4 };
// }
//
// // ── Google Icon ───────────────────────────────────────────────────────────────
// function GoogleIcon() {
//     return (
//         <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
//             <g fill="none" fillRule="evenodd">
//                 <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
//                 <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
//                 <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
//                 <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
//             </g>
//         </svg>
//     );
// }
//
// function GoogleButton({ label = 'Continue with Google' }) {
//     function handleGoogle() {
//         const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
//         window.location.href = `${base}/oauth2/authorization/google`;
//     }
//     return (
//         <button type="button" onClick={handleGoogle} className="google-btn">
//             <GoogleIcon />
//             {label}
//         </button>
//     );
// }
//
// function Divider() {
//     return (
//         <div className="divider">
//             <div className="divider-line"/>
//             <span className="divider-text">or continue with email</span>
//             <div className="divider-line"/>
//         </div>
//     );
// }
//
// // ── Eye Icon ──────────────────────────────────────────────────────────────────
// function EyeIcon({ open }) {
//     return open ? (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
//         </svg>
//     ) : (
//         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
//             <line x1="1" y1="1" x2="23" y2="23"/>
//         </svg>
//     );
// }
//
// // ── Field Error ───────────────────────────────────────────────────────────────
// function FieldErr({ msg }) {
//     if (!msg) return null;
//     return <div className="field-err">⚠ {msg}</div>;
// }
//
// // ── Password Input ────────────────────────────────────────────────────────────
// function PasswordInput({ value, onChange, onFocus, onBlur, placeholder, hasError, id }) {
//     const [show, setShow] = useState(false);
//     return (
//         <div style={{ position: 'relative' }}>
//             <input
//                 id={id}
//                 type={show ? 'text' : 'password'}
//                 placeholder={placeholder}
//                 value={value}
//                 onChange={onChange}
//                 onFocus={onFocus}
//                 onBlur={onBlur}
//                 className={`form-input ${hasError ? 'input-error' : ''}`}
//                 style={{ paddingRight: '44px' }}
//                 autoComplete={id === 'login-pass' ? 'current-password' : id === 'confirm' ? 'new-password' : 'new-password'}
//             />
//             <button
//                 type="button"
//                 onClick={() => setShow(v => !v)}
//                 className="eye-btn"
//                 tabIndex={-1}
//                 aria-label={show ? 'Hide password' : 'Show password'}
//             >
//                 <EyeIcon open={show} />
//             </button>
//         </div>
//     );
// }
//
// // ── Login Modal ───────────────────────────────────────────────────────────────
// function LoginModal({ onClose, onSwitchToSignup }) {
//     const [form,    setForm]    = useState({ username: '', password: '' });
//     const [errors,  setErrors]  = useState({});
//     const [loading, setLoading] = useState(false);
//     const { login } = useAuth();
//     const navigate  = useNavigate();
//
//     function validateLogin() {
//         const errs = {};
//         if (!form.username.trim())          errs.username = 'Email address is required';
//         else if (!isValidEmail(form.username)) errs.username = 'Please enter a valid email address (e.g. john@gmail.com)';
//         if (!form.password)                 errs.password = 'Password is required';
//         return errs;
//     }
//
//     async function handleSubmit(e) {
//         e.preventDefault();
//         const errs = validateLogin();
//         setErrors(errs);
//         if (Object.keys(errs).length > 0) return;
//         setLoading(true);
//         try {
//             const { data } = await api.post('/auth/login', {
//                 username: form.username.trim().toLowerCase(),
//                 password: form.password,
//             });
//             login(data.jwt);
//             onClose();
//             navigate('/role-redirect');
//         } catch (err) {
//             setErrors({ global: friendlyLoginError(err) });
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     function clear(k) { setErrors(p => { const n = { ...p }; delete n[k]; delete n.global; return n; }); }
//
//     return (
//         <div className="modal-body">
//             <div className="modal-header">
//                 <div className="modal-icon">🏥</div>
//                 <div className="modal-title">Welcome back 👋</div>
//                 <div className="modal-subtitle">Sign in to your Priyansh Care account</div>
//             </div>
//
//             <GoogleButton label="Sign in with Google" />
//             <Divider />
//
//             {errors.global && <div className="alert-error">⚠️ {errors.global}</div>}
//
//             <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
//                 <div className="form-group">
//                     <label className="form-label" htmlFor="login-email">Email Address</label>
//                     <input
//                         id="login-email"
//                         type="email"
//                         placeholder="your@email.com"
//                         value={form.username}
//                         autoComplete="email"
//                         className={`form-input ${errors.username ? 'input-error' : ''}`}
//                         onChange={e => { clear('username'); setForm({ ...form, username: e.target.value }); }}
//                     />
//                     <FieldErr msg={errors.username} />
//                 </div>
//
//                 <div className="form-group">
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
//                         <label className="form-label" htmlFor="login-pass" style={{ margin: 0 }}>Password</label>
//                         <span className="link-text" onClick={() => { onClose(); navigate('/forgot-password'); }}>
//                             Forgot password?
//                         </span>
//                     </div>
//                     <PasswordInput
//                         id="login-pass"
//                         placeholder="Enter your password"
//                         value={form.password}
//                         hasError={!!errors.password}
//                         onChange={e => { clear('password'); setForm({ ...form, password: e.target.value }); }}
//                     />
//                     <FieldErr msg={errors.password} />
//                 </div>
//
//                 <button type="submit" disabled={loading} className={`btn-primary ${loading ? 'btn-loading' : ''}`}>
//                     {loading ? (
//                         <><span className="spinner"/> Signing in...</>
//                     ) : 'Sign In →'}
//                 </button>
//             </form>
//
//             <p className="modal-footer-text">
//                 New to Priyansh Care?{' '}
//                 <span className="link-text" onClick={onSwitchToSignup}>Create account</span>
//             </p>
//
//             <div className="trust-badges">
//                 {['🔒 Secure Login', '🏥 NABH Certified', '✅ Verified'].map(b => (
//                     <span key={b} className="trust-badge">{b}</span>
//                 ))}
//             </div>
//         </div>
//     );
// }
//
// // ── Signup Modal ──────────────────────────────────────────────────────────────
// function SignupModal({ onClose, onSwitchToLogin }) {
//     const [form, setForm] = useState({
//         username: '', password: '', confirm: '', fullName: '', phone: '',
//     });
//     const [fieldErrors, setFieldErrors] = useState({});
//     const [globalError, setGlobalError] = useState('');
//     const [loading,     setLoading]     = useState(false);
//     const [touched,     setTouched]     = useState({});
//     const navigate = useNavigate();
//
//     // Enterprise-level validation
//     function validate(fields = form) {
//         const errs = {};
//
//         // Full Name
//         const name = fields.fullName.trim();
//         if (!name)               errs.fullName = 'Full name is required';
//         else if (name.length < 2) errs.fullName = 'Name must be at least 2 characters';
//         else if (name.length > 60) errs.fullName = 'Name must be under 60 characters';
//         else if (/\d/.test(name)) errs.fullName = 'Name cannot contain numbers';
//         else if (!/^[a-zA-Z\s.'-]+$/.test(name)) errs.fullName = 'Name contains invalid characters';
//
//         // Phone — Indian mobile number (10 digits, starts 6-9)
//         const phone = fields.phone.replace(/[\s\-+()]/g, '');
//         if (!phone)                    errs.phone = 'Phone number is required';
//         else if (!/^\d+$/.test(phone)) errs.phone = 'Phone number must contain only digits';
//         else if (phone.length !== 10)  errs.phone = 'Phone number must be exactly 10 digits';
//         else if (!/^[6-9]/.test(phone)) errs.phone = 'Enter a valid Indian mobile number (starts with 6-9)';
//
//         // Email
//         const email = fields.username.trim();
//         if (!email)                errs.username = 'Email address is required';
//         else if (!isValidEmail(email)) errs.username = 'Enter a valid email (e.g. john@gmail.com)';
//         else if (email.length > 100)   errs.username = 'Email is too long';
//
//         // Password — min 8 chars, at least one number or special char
//         const pwd = fields.password;
//         if (!pwd)                   errs.password = 'Password is required';
//         else if (pwd.length < 6)    errs.password = 'Password must be at least 6 characters';
//         else if (pwd.length > 128)  errs.password = 'Password is too long';
//         else if (/^\s+|\s+$/.test(pwd)) errs.password = 'Password cannot start or end with spaces';
//
//         // Confirm password
//         if (!fields.confirm)           errs.confirm = 'Please confirm your password';
//         else if (fields.password !== fields.confirm) errs.confirm = 'Passwords do not match';
//
//         return errs;
//     }
//
//     // Validate single field on blur
//     function validateField(name) {
//         setTouched(t => ({ ...t, [name]: true }));
//         const errs = validate();
//         if (errs[name]) {
//             setFieldErrors(p => ({ ...p, [name]: errs[name] }));
//         } else {
//             setFieldErrors(p => { const n = { ...p }; delete n[name]; return n; });
//         }
//     }
//
//     async function handleSubmit(e) {
//         e.preventDefault();
//         setGlobalError('');
//         const errs = validate();
//         setFieldErrors(errs);
//         setTouched({ username: true, password: true, confirm: true, fullName: true, phone: true });
//         if (Object.keys(errs).length > 0) return;
//         setLoading(true);
//         try {
//             await api.post('/auth/signup', {
//                 username: form.username.trim().toLowerCase(),
//                 password: form.password,
//                 fullName: form.fullName.trim(),
//                 phone:    form.phone.replace(/[\s\-+()]/g, ''),
//             });
//             localStorage.setItem('userInfo', JSON.stringify({
//                 username: form.username.trim().toLowerCase(),
//                 fullName: form.fullName.trim(),
//                 phone:    form.phone.replace(/[\s\-+()]/g, ''),
//             }));
//             onClose();
//             navigate('/verify-otp', { state: { email: form.username.trim().toLowerCase() } });
//         } catch (err) {
//             const { field, msg } = friendlySignupError(err);
//             if (field) setFieldErrors(prev => ({ ...prev, [field]: msg }));
//             else setGlobalError(msg);
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     function update(key, val) {
//         const next = { ...form, [key]: val };
//         setForm(next);
//         // Re-validate on change if field was already touched
//         if (touched[key]) {
//             const errs = validate(next);
//             if (errs[key]) setFieldErrors(p => ({ ...p, [key]: errs[key] }));
//             else           setFieldErrors(p => { const n = { ...p }; delete n[key]; return n; });
//         }
//         setGlobalError('');
//     }
//
//     const str = passwordStrength(form.password);
//     const pwdReqs = form.password ? [
//         { ok: form.password.length >= 8, text: '8+ characters' },
//         { ok: /[A-Z]/.test(form.password), text: 'Uppercase letter' },
//         { ok: /[0-9]/.test(form.password), text: 'Number' },
//         { ok: /[^A-Za-z0-9]/.test(form.password), text: 'Special character' },
//     ] : [];
//
//     return (
//         <div className="modal-body">
//             <div className="modal-header">
//                 <div className="modal-icon">🏥</div>
//                 <div className="modal-title">Create account 🏥</div>
//                 <div className="modal-subtitle">Register as a new patient at Priyansh Care</div>
//             </div>
//
//             <GoogleButton label="Sign up with Google" />
//             <Divider />
//
//             {globalError && <div className="alert-error">⚠️ {globalError}</div>}
//
//             <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
//                 {/* Row 1: Name + Phone */}
//                 <div className="form-row-2">
//                     <div className="form-group">
//                         <label className="form-label" htmlFor="fullName">Full Name</label>
//                         <input
//                             id="fullName"
//                             type="text"
//                             placeholder="Priyanshu Jaiswal"
//                             autoComplete="name"
//                             value={form.fullName}
//                             className={`form-input ${fieldErrors.fullName ? 'input-error' : touched.fullName && !fieldErrors.fullName ? 'input-ok' : ''}`}
//                             onChange={e => update('fullName', e.target.value)}
//                             onBlur={() => validateField('fullName')}
//                         />
//                         <FieldErr msg={fieldErrors.fullName} />
//                     </div>
//                     <div className="form-group">
//                         <label className="form-label" htmlFor="phone">
//                             Phone <span style={{ color: '#94a3b8', fontWeight: 400 }}>(10 digits)</span>
//                         </label>
//                         <input
//                             id="phone"
//                             type="tel"
//                             placeholder="9876543210"
//                             autoComplete="tel"
//                             value={form.phone}
//                             maxLength={10}
//                             className={`form-input ${fieldErrors.phone ? 'input-error' : touched.phone && !fieldErrors.phone && form.phone.length === 10 ? 'input-ok' : ''}`}
//                             onChange={e => update('phone', e.target.value.replace(/\D/g, ''))}
//                             onBlur={() => validateField('phone')}
//                         />
//                         <FieldErr msg={fieldErrors.phone} />
//                     </div>
//                 </div>
//
//                 {/* Email */}
//                 <div className="form-group">
//                     <label className="form-label" htmlFor="email">Email Address</label>
//                     <input
//                         id="email"
//                         type="email"
//                         placeholder="your@email.com"
//                         autoComplete="email"
//                         value={form.username}
//                         className={`form-input ${fieldErrors.username ? 'input-error' : touched.username && !fieldErrors.username && form.username ? 'input-ok' : ''}`}
//                         onChange={e => update('username', e.target.value)}
//                         onBlur={() => validateField('username')}
//                     />
//                     <FieldErr msg={fieldErrors.username} />
//                 </div>
//
//                 {/* Password */}
//                 <div className="form-group">
//                     <label className="form-label" htmlFor="password">Password</label>
//                     <PasswordInput
//                         id="password"
//                         placeholder="Min 6 characters"
//                         value={form.password}
//                         hasError={!!fieldErrors.password}
//                         onChange={e => update('password', e.target.value)}
//                         onBlur={() => validateField('password')}
//                     />
//                     {/* Strength bar */}
//                     {str && !fieldErrors.password && (
//                         <div style={{ marginTop: '6px' }}>
//                             <div className="strength-bar-bg">
//                                 <div className="strength-bar-fill" style={{ width: str.w, background: str.color }}/>
//                             </div>
//                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
//                                 <span style={{ fontSize: '10px', color: str.color, fontWeight: 700 }}>{str.label}</span>
//                                 {pwdReqs.length > 0 && (
//                                     <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
//                                         {pwdReqs.map(r => (
//                                             <span key={r.text} style={{ fontSize: '9px', fontWeight: 600, color: r.ok ? '#0a4f3a' : '#94a3b8' }}>
//                                                 {r.ok ? '✓' : '○'} {r.text}
//                                             </span>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                     <FieldErr msg={fieldErrors.password} />
//                 </div>
//
//                 {/* Confirm Password */}
//                 <div className="form-group">
//                     <label className="form-label" htmlFor="confirm">Confirm Password</label>
//                     <PasswordInput
//                         id="confirm"
//                         placeholder="Repeat your password"
//                         value={form.confirm}
//                         hasError={!!fieldErrors.confirm}
//                         onChange={e => update('confirm', e.target.value)}
//                         onBlur={() => validateField('confirm')}
//                     />
//                     {form.confirm && !fieldErrors.confirm && (
//                         <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: form.password === form.confirm ? '#0a4f3a' : '#ef4444' }}>
//                             {form.password === form.confirm ? '✓ Passwords match' : '✗ Does not match'}
//                         </div>
//                     )}
//                     <FieldErr msg={fieldErrors.confirm} />
//                 </div>
//
//                 <button type="submit" disabled={loading} className={`btn-primary ${loading ? 'btn-loading' : ''}`} style={{ marginTop: '4px' }}>
//                     {loading ? (
//                         <><span className="spinner"/> Creating account...</>
//                     ) : 'Create Account & Send OTP →'}
//                 </button>
//             </form>
//
//             <p className="modal-footer-text">
//                 Already have an account?{' '}
//                 <span className="link-text" onClick={onSwitchToLogin}>Sign in</span>
//             </p>
//
//             <div className="privacy-note">
//                 🔒 Your data is encrypted & secure. By signing up, you agree to our{' '}
//                 <span className="link-text">Terms</span> &{' '}
//                 <span className="link-text">Privacy Policy</span>
//             </div>
//         </div>
//     );
// }
//
// // ── Main Landing Page ─────────────────────────────────────────────────────────
// export default function LandingPage() {
//     const [modal,      setModal]      = useState(null);
//     const [mobileMenu, setMobileMenu] = useState(false);
//     const { state } = useLocation();
//
//     useEffect(() => {
//         if (state?.openModal) setModal(state.openModal);
//     }, [state]);
//
//     // Close mobile menu on resize
//     useEffect(() => {
//         const handler = () => { if (window.innerWidth > 768) setMobileMenu(false); };
//         window.addEventListener('resize', handler);
//         return () => window.removeEventListener('resize', handler);
//     }, []);
//
//     const departments = [
//         { icon: '❤️',  name: 'Cardiology',      desc: 'Heart & cardiovascular care'  },
//         { icon: '🧠',  name: 'Neurology',        desc: 'Brain & nervous system'       },
//         { icon: '🦴',  name: 'Orthopedics',      desc: 'Bone, joint & muscle care'    },
//         { icon: '👁️', name: 'Ophthalmology',    desc: 'Eye care & vision'            },
//         { icon: '🫁',  name: 'Pulmonology',      desc: 'Lung & respiratory care'      },
//         { icon: '🩺',  name: 'General Medicine', desc: 'Primary healthcare'           },
//         { icon: '👶',  name: 'Pediatrics',       desc: "Children's health"            },
//         { icon: '🦷',  name: 'Dentistry',        desc: 'Oral & dental care'           },
//     ];
//
//     const doctors = [
//         { name: 'Dr. Arun Kapoor',  spec: 'Cardiology',    exp: '12 yrs', quali: 'MBBS, MD - Cardiology',    color: '#0a4f3a', bg: '#f0fdf4' },
//         { name: 'Dr. Priya Mehta',  spec: 'Neurology',     exp: '9 yrs',  quali: 'MBBS, DM - Neurology',     color: '#185FA5', bg: '#EFF6FF' },
//         { name: 'Dr. Rahul Sharma', spec: 'Orthopedics',   exp: '15 yrs', quali: 'MBBS, MS - Orthopaedics',  color: '#7e22ce', bg: '#FDF4FF' },
//         { name: 'Dr. Sneha Patel',  spec: 'Ophthalmology', exp: '8 yrs',  quali: 'MBBS, MS - Ophthalmology', color: '#c2410c', bg: '#FFF7ED' },
//     ];
//
//     const steps = [
//         { icon: '👤', step: '01', title: 'Create Account',   desc: 'Sign up as a patient with your email and phone number in seconds.' },
//         { icon: '🔍', step: '02', title: 'Find Your Doctor', desc: 'Browse specialists by department or search by name and specialty.'  },
//         { icon: '📅', step: '03', title: 'Book Appointment', desc: 'Choose your preferred date and time slot from available slots.'     },
//         { icon: '💊', step: '04', title: 'Get Treatment',    desc: 'Visit the doctor, receive prescriptions and medical records online.' },
//     ];
//
//     return (
//         <div style={{ fontFamily: "'DM Sans','Outfit',sans-serif", background: '#fff', overflowX: 'hidden' }}>
//             <style>{`
//                 @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
//
//                 /* ── Animations ── */
//                 @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
//                 @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
//                 @keyframes modalIn   { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
//                 @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
//                 @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
//                 @keyframes spin      { to{transform:rotate(360deg)} }
//
//                 * { box-sizing: border-box; margin:0; padding:0; }
//
//                 /* ── Form Components ── */
//                 .form-group { display:flex; flex-direction:column; }
//                 .form-label {
//                     font-size:11px; font-weight:700; color:#64748b;
//                     text-transform:uppercase; letter-spacing:.06em;
//                     display:block; margin-bottom:6px;
//                     font-family:'DM Sans',sans-serif;
//                 }
//                 .form-input {
//                     width:100%; border:1.5px solid #e2e8f0; border-radius:10px;
//                     padding:11px 14px; font-size:13px; outline:none;
//                     background:#f8fafc; font-family:'DM Sans',sans-serif;
//                     box-sizing:border-box; transition:border-color .15s, background .15s, box-shadow .15s;
//                     color:#0f172a;
//                 }
//                 .form-input:focus {
//                     border-color:#0a4f3a; background:#fff;
//                     box-shadow:0 0 0 3px rgba(10,79,58,.08);
//                 }
//                 .form-input.input-error { border-color:#fca5a5; background:#fff5f5; }
//                 .form-input.input-error:focus { border-color:#ef4444; box-shadow:0 0 0 3px rgba(239,68,68,.08); }
//                 .form-input.input-ok { border-color:#86efac; background:#f0fdf4; }
//                 .form-input::placeholder { color:#94a3b8; }
//                 .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
//                 @media (max-width:400px) {
//                     .form-row-2 { grid-template-columns:1fr!important; }
//                 }
//
//                 /* ── Field Error ── */
//                 .field-err { font-size:10px; color:#ef4444; font-weight:600; margin-top:4px; line-height:1.4; }
//
//                 /* ── Alert ── */
//                 .alert-error {
//                     background:#fef2f2; border:1px solid #fecaca; color:#dc2626;
//                     font-size:12px; border-radius:10px; padding:11px 14px;
//                     margin-bottom:14px; line-height:1.5; font-weight:500;
//                 }
//
//                 /* ── Buttons ── */
//                 .btn-primary {
//                     width:100%; padding:13px 16px; border-radius:11px; border:none;
//                     background:#0a4f3a; color:#fff; font-size:13px; font-weight:700;
//                     cursor:pointer; transition:background .2s, transform .15s, box-shadow .2s;
//                     font-family:'DM Sans',sans-serif; display:flex; align-items:center;
//                     justify-content:center; gap:8px;
//                 }
//                 .btn-primary:hover:not(:disabled) {
//                     background:#0d6b50; transform:translateY(-1px);
//                     box-shadow:0 6px 20px rgba(10,79,58,.3);
//                 }
//                 .btn-primary:active:not(:disabled) { transform:translateY(0); }
//                 .btn-primary.btn-loading { background:#64748b; cursor:not-allowed; }
//                 .btn-primary:disabled { cursor:not-allowed; opacity:.7; }
//
//                 .google-btn {
//                     width:100%; padding:11px 16px; border-radius:11px;
//                     border:1.5px solid #e2e8f0; background:#fff;
//                     display:flex; align-items:center; justify-content:center;
//                     gap:10px; cursor:pointer; font-size:13px; font-weight:600;
//                     color:#374151; transition:all .2s; box-shadow:0 1px 4px rgba(0,0,0,.06);
//                     font-family:'DM Sans',sans-serif;
//                 }
//                 .google-btn:hover {
//                     background:#f8fafc; border-color:#94a3b8;
//                     transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.1);
//                 }
//
//                 /* ── Eye Button ── */
//                 .eye-btn {
//                     position:absolute; right:12px; top:50%; transform:translateY(-50%);
//                     background:none; border:none; color:#94a3b8; cursor:pointer;
//                     display:flex; align-items:center; justify-content:center;
//                     padding:4px; border-radius:4px; transition:color .15s;
//                 }
//                 .eye-btn:hover { color:#475569; }
//
//                 /* ── Spinner ── */
//                 .spinner {
//                     width:14px; height:14px; border:2px solid rgba(255,255,255,.3);
//                     border-top-color:#fff; border-radius:50%;
//                     display:inline-block; animation:spin .7s linear infinite;
//                 }
//
//                 /* ── Divider ── */
//                 .divider { display:flex; align-items:center; gap:12px; margin:16px 0; }
//                 .divider-line { flex:1; height:1px; background:#e2e8f0; }
//                 .divider-text { font-size:11px; color:#94a3b8; font-weight:600; white-space:nowrap; }
//
//                 /* ── Strength bar ── */
//                 .strength-bar-bg { height:3px; background:#f1f5f9; border-radius:99px; overflow:hidden; }
//                 .strength-bar-fill { height:100%; border-radius:99px; transition:width .3s, background .3s; }
//
//                 /* ── Modal body ── */
//                 .modal-body { font-family:'DM Sans',sans-serif; }
//                 .modal-header { margin-bottom:20px; text-align:center; }
//                 .modal-icon {
//                     width:48px; height:48px; border-radius:14px; background:#f0fdf4;
//                     display:flex; align-items:center; justify-content:center;
//                     font-size:22px; margin:0 auto 12px;
//                 }
//                 .modal-title { font-size:22px; font-weight:700; color:#0a4f3a; font-family:'Playfair Display',serif; margin-bottom:4px; }
//                 .modal-subtitle { font-size:12px; color:#94a3b8; }
//                 .modal-footer-text { text-align:center; margin-top:16px; font-size:12px; color:#94a3b8; }
//                 .link-text { color:#0a4f3a; font-weight:700; cursor:pointer; }
//                 .link-text:hover { text-decoration:underline; }
//                 .trust-badges {
//                     display:flex; justify-content:center; gap:16px; margin-top:16px;
//                     padding-top:16px; border-top:1px solid #f1f5f9; flex-wrap:wrap;
//                 }
//                 .trust-badge { font-size:10px; color:#94a3b8; font-weight:500; }
//                 .privacy-note {
//                     margin-top:12px; padding:10px 12px; background:#f8fafc;
//                     border-radius:9px; font-size:10px; color:#94a3b8;
//                     text-align:center; line-height:1.6;
//                 }
//
//                 /* ── Nav & Landing ── */
//                 .lp-btn-primary { transition:all .2s!important; }
//                 .lp-btn-primary:hover { background:#1D9E75!important; transform:translateY(-2px); box-shadow:0 12px 28px rgba(10,79,58,.3)!important; }
//                 .lp-btn-outline:hover { background:#0a4f3a!important; color:#fff!important; transform:translateY(-2px); }
//                 .dept-card:hover  { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; border-color:#5DCAA5!important; }
//                 .doc-card:hover   { transform:translateY(-4px)!important; box-shadow:0 16px 40px rgba(0,0,0,.1)!important; }
//                 .nav-link:hover   { color:#0a4f3a!important; }
//                 .step-card:hover  { background:#0a4f3a!important; }
//                 .step-card:hover .step-icon  { background:rgba(255,255,255,.15)!important; }
//                 .step-card:hover .step-num   { color:rgba(255,255,255,.4)!important; }
//                 .step-card:hover .step-title { color:#fff!important; }
//                 .step-card:hover .step-desc  { color:rgba(255,255,255,.7)!important; }
//
//                 /* ── Grid layouts ── */
//                 .lp-steps-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
//                 .lp-dept-grid    { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; max-width:1100px; margin:0 auto; }
//                 .lp-doc-grid     { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; max-width:1100px; margin:0 auto; }
//                 .lp-about-grid   { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; max-width:1100px; margin:0 auto; position:relative; }
//                 .lp-about-stats  { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
//                 .lp-contact-grid { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; max-width:1100px; margin:0 auto; }
//                 .lp-hero-stats   { display:flex; gap:32px; justify-content:center; padding-top:32px; border-top:1px solid rgba(255,255,255,.1); flex-wrap:wrap; }
//                 .lp-hero-btns    { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin-bottom:48px; }
//                 .lp-section-pad  { padding:90px 60px; }
//                 .lp-nav          { padding:14px 60px; }
//                 .lp-nav-links    { display:flex; align-items:center; gap:28px; }
//                 .lp-nav-actions  { display:flex; gap:10px; }
//                 .lp-mobile-menu-btn { display:none; }
//                 .lp-mobile-nav   { display:none; }
//
//                 /* ── Responsive ── */
//                 @media (max-width:1024px) {
//                     .lp-steps-grid   { grid-template-columns:repeat(2,1fr)!important; }
//                     .lp-doc-grid     { grid-template-columns:repeat(2,1fr)!important; }
//                     .lp-about-grid   { grid-template-columns:1fr!important; gap:40px!important; }
//                     .lp-contact-grid { grid-template-columns:1fr!important; gap:40px!important; }
//                     .lp-section-pad  { padding:70px 40px!important; }
//                     .lp-nav          { padding:14px 32px!important; }
//                 }
//                 @media (max-width:768px) {
//                     .lp-nav-links       { display:none!important; }
//                     .lp-nav-actions     { display:none!important; }
//                     .lp-mobile-menu-btn { display:flex!important; }
//                     .lp-mobile-nav.open { display:flex!important; }
//                     .lp-dept-grid  { grid-template-columns:repeat(2,1fr)!important; }
//                     .lp-doc-grid   { grid-template-columns:repeat(2,1fr)!important; }
//                     .lp-steps-grid { grid-template-columns:repeat(2,1fr)!important; }
//                     .lp-section-pad { padding:56px 20px!important; }
//                     .lp-nav         { padding:12px 20px!important; }
//                     .lp-hero-stats  { gap:16px!important; }
//                     .lp-about-stats { grid-template-columns:repeat(2,1fr)!important; }
//                 }
//                 @media (max-width:480px) {
//                     .lp-dept-grid  { grid-template-columns:repeat(2,1fr)!important; }
//                     .lp-doc-grid   { grid-template-columns:1fr!important; }
//                     .lp-steps-grid { grid-template-columns:1fr!important; }
//                     .lp-hero-btns button { width:100%!important; }
//                     .lp-about-stats { grid-template-columns:repeat(2,1fr)!important; }
//                 }
//             `}</style>
//
//             {/* ── NAVBAR ── */}
//             <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(255,255,255,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(0,0,0,.06)' }}>
//                 <div className="lp-nav" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
//                     <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
//                         <div style={{ width:'36px', height:'36px', background:'#0a4f3a', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>🏥</div>
//                         <div>
//                             <div style={{ fontSize:'14px', fontWeight:700, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", lineHeight:1.1 }}>Priyansh Care</div>
//                             <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.09em' }}>Hospital</div>
//                         </div>
//                     </div>
//                     <div className="lp-nav-links">
//                         {['Services','Doctors','Departments','About','Contact'].map(l => (
//                             <a key={l} href={`#${l.toLowerCase()}`} className="nav-link" style={{ fontSize:'13px', fontWeight:500, color:'#64748b', textDecoration:'none', transition:'color .15s' }}>{l}</a>
//                         ))}
//                     </div>
//                     <div className="lp-nav-actions">
//                         <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding:'9px 20px', borderRadius:'9px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all .2s' }}>Sign In</button>
//                         <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding:'9px 20px', borderRadius:'9px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', transition:'all .2s', boxShadow:'0 4px 14px rgba(10,79,58,.25)' }}>Book Appointment</button>
//                     </div>
//                     <button className="lp-mobile-menu-btn" onClick={() => setMobileMenu(v => !v)}
//                             style={{ background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#0a4f3a', alignItems:'center', justifyContent:'center', padding:0 }}>
//                         {mobileMenu ? '✕' : '☰'}
//                     </button>
//                 </div>
//                 {mobileMenu && (
//                     <div className="lp-mobile-nav open"
//                          style={{ flexDirection:'column', padding:'16px 20px 20px', borderTop:'1px solid #f0f0f0', background:'#fff', gap:'4px', animation:'slideDown .2s ease' }}>
//                         {['Services','Doctors','Departments','About','Contact'].map(l => (
//                             <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)}
//                                style={{ fontSize:'14px', fontWeight:500, color:'#374151', textDecoration:'none', padding:'10px 8px', borderRadius:'8px', display:'block' }}>{l}</a>
//                         ))}
//                         <div style={{ display:'flex', gap:'10px', marginTop:'12px' }}>
//                             <button onClick={() => { setModal('login'); setMobileMenu(false); }} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign In</button>
//                             <button onClick={() => { setModal('signup'); setMobileMenu(false); }} style={{ flex:1, padding:'11px', borderRadius:'9px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>Sign Up</button>
//                         </div>
//                     </div>
//                 )}
//             </nav>
//
//             {/* ── HERO ── */}
//             <section style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0a4f3a 0%,#0d6b50 50%,#1a8a6a 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', paddingTop:'80px' }}>
//                 <div style={{ position:'absolute', width:'500px', height:'500px', borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'-100px', right:'-100px', pointerEvents:'none' }}/>
//                 <div style={{ position:'absolute', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:'-60px', left:'-60px', pointerEvents:'none' }}/>
//                 <div style={{ position:'absolute', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(93,202,165,.15)', top:'30%', left:'10%', animation:'float 6s ease-in-out infinite', pointerEvents:'none' }}/>
//                 <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize:'32px 32px', pointerEvents:'none' }}/>
//                 <div style={{ position:'relative', textAlign:'center', maxWidth:'760px', width:'100%', padding:'0 24px', animation:'fadeUp .8s ease' }}>
//                     <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:'20px', padding:'6px 16px', fontSize:'12px', color:'rgba(255,255,255,.8)', fontWeight:500, marginBottom:'28px', backdropFilter:'blur(8px)' }}>
//                         <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#5DCAA5', display:'inline-block', animation:'pulse 2s infinite' }}/>
//                         Trusted by 50,000+ patients across India
//                     </div>
//                     <h1 style={{ fontSize:'clamp(36px,6vw,72px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.1, marginBottom:'20px' }}>
//                         Your Health,<br/>Our <span style={{ color:'#5DCAA5' }}>Priority</span>
//                     </h1>
//                     <p style={{ fontSize:'clamp(13px,2vw,16px)', color:'rgba(255,255,255,.65)', lineHeight:1.8, maxWidth:'520px', margin:'0 auto 36px' }}>
//                         World-class healthcare at your fingertips. Book appointments, access prescriptions, manage insurance — all in one place.
//                     </p>
//                     <div className="lp-hero-btns">
//                         <button className="lp-btn-primary" onClick={() => setModal('signup')} style={{ padding:'15px 32px', borderRadius:'12px', border:'none', background:'#5DCAA5', color:'#0a4f3a', fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:'0 8px 24px rgba(93,202,165,.4)' }}>
//                             📅 Book Appointment
//                         </button>
//                         <button className="lp-btn-outline" onClick={() => setModal('login')} style={{ padding:'15px 32px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:'14px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)' }}>
//                             Sign In →
//                         </button>
//                     </div>
//                     <div className="lp-hero-stats">
//                         {[['500+','Expert Doctors'],['50K+','Happy Patients'],['20+','Departments'],['15+','Years of Care']].map(([num, lbl]) => (
//                             <div key={lbl} style={{ textAlign:'center', minWidth:'80px' }}>
//                                 <div style={{ fontSize:'clamp(20px,4vw,26px)', fontWeight:800, color:'#5DCAA5', fontFamily:"'Playfair Display',serif" }}>{num}</div>
//                                 <div style={{ fontSize:'11px', color:'rgba(255,255,255,.45)', textTransform:'uppercase', letterSpacing:'.08em', marginTop:'3px' }}>{lbl}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── HOW IT WORKS ── */}
//             <section id="services" className="lp-section-pad" style={{ background:'#f8fafa' }}>
//                 <div style={{ textAlign:'center', marginBottom:'56px' }}>
//                     <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>How it works</div>
//                     <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>Healthcare in 4 Simple Steps</h2>
//                     <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>From registration to recovery — we've made it effortless.</p>
//                 </div>
//                 <div className="lp-steps-grid">
//                     {steps.map(s => (
//                         <div key={s.step} className="step-card" style={{ background:'#fff', borderRadius:'18px', padding:'28px 24px', border:'1px solid #e8f4ef', transition:'all .25s', cursor:'default', boxShadow:'0 2px 12px rgba(0,0,0,.04)' }}>
//                             <div className="step-num" style={{ fontSize:'11px', fontWeight:800, color:'#d1fae5', letterSpacing:'.1em', marginBottom:'14px', transition:'color .25s' }}>{s.step}</div>
//                             <div className="step-icon" style={{ width:'48px', height:'48px', borderRadius:'14px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', marginBottom:'14px', transition:'background .25s' }}>{s.icon}</div>
//                             <div className="step-title" style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'8px', transition:'color .25s' }}>{s.title}</div>
//                             <div className="step-desc" style={{ fontSize:'12px', color:'#64748b', lineHeight:1.7, transition:'color .25s' }}>{s.desc}</div>
//                         </div>
//                     ))}
//                 </div>
//             </section>
//
//             {/* ── DEPARTMENTS ── */}
//             <section id="departments" className="lp-section-pad" style={{ background:'#fff' }}>
//                 <div style={{ textAlign:'center', marginBottom:'56px' }}>
//                     <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Our Specialties</div>
//                     <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>World-Class Departments</h2>
//                     <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>Comprehensive care across all major medical specialties under one roof.</p>
//                 </div>
//                 <div className="lp-dept-grid">
//                     {departments.map(d => (
//                         <div key={d.name} className="dept-card" style={{ border:'1.5px solid #e8f4ef', borderRadius:'16px', padding:'24px 20px', cursor:'pointer', transition:'all .25s', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,.04)' }}>
//                             <div style={{ fontSize:'28px', marginBottom:'12px' }}>{d.icon}</div>
//                             <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'5px' }}>{d.name}</div>
//                             <div style={{ fontSize:'12px', color:'#94a3b8' }}>{d.desc}</div>
//                         </div>
//                     ))}
//                 </div>
//             </section>
//
//             {/* ── DOCTORS ── */}
//             <section id="doctors" className="lp-section-pad" style={{ background:'#f0fdf4' }}>
//                 <div style={{ textAlign:'center', marginBottom:'56px' }}>
//                     <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Our Team</div>
//                     <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'12px' }}>Meet Our Specialists</h2>
//                     <p style={{ fontSize:'14px', color:'#64748b', maxWidth:'480px', margin:'0 auto', lineHeight:1.7 }}>Experienced doctors dedicated to your health and well-being.</p>
//                 </div>
//                 <div className="lp-doc-grid">
//                     {doctors.map(doc => (
//                         <div key={doc.name} className="doc-card" style={{ background:'#fff', borderRadius:'18px', padding:'24px', border:'1px solid #e8f4ef', transition:'all .25s', boxShadow:'0 2px 10px rgba(0,0,0,.05)' }}>
//                             <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:doc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', marginBottom:'14px' }}>👨‍⚕️</div>
//                             <div style={{ fontSize:'14px', fontWeight:700, color:'#0f172a', marginBottom:'3px' }}>{doc.name}</div>
//                             <div style={{ fontSize:'12px', color:doc.color, fontWeight:600, marginBottom:'6px' }}>{doc.spec}</div>
//                             <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'12px' }}>{doc.quali}</div>
//                             <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:doc.bg, border:`1px solid ${doc.color}22`, borderRadius:'8px', padding:'5px 10px' }}>
//                                 <span style={{ fontSize:'12px' }}>⏳</span>
//                                 <span style={{ fontSize:'11px', fontWeight:600, color:doc.color }}>{doc.exp} experience</span>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//                 <div style={{ textAlign:'center', marginTop:'40px' }}>
//                     <p style={{ fontSize:'14px', color:'#64748b', marginBottom:'16px' }}>Sign in to see all doctors, their availability and book an appointment</p>
//                     <button onClick={() => setModal('signup')} style={{ padding:'13px 32px', borderRadius:'12px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'14px', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(10,79,58,.25)' }}>
//                         📅 Create Account to Book
//                     </button>
//                 </div>
//             </section>
//
//             {/* ── ABOUT ── */}
//             <section id="about" className="lp-section-pad" style={{ background:'#0a4f3a', position:'relative', overflow:'hidden' }}>
//                 <div style={{ position:'absolute', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(255,255,255,.04)', top:'-100px', right:'-80px', pointerEvents:'none' }}/>
//                 <div className="lp-about-grid">
//                     <div>
//                         <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'12px' }}>Why Choose Us</div>
//                         <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#fff', fontFamily:"'Playfair Display',serif", lineHeight:1.2, marginBottom:'20px' }}>
//                             Healthcare You Can<br/><span style={{ color:'#5DCAA5' }}>Trust & Rely On</span>
//                         </h2>
//                         <p style={{ fontSize:'14px', color:'rgba(255,255,255,.65)', lineHeight:1.8, marginBottom:'32px' }}>
//                             At Priyansh Care, we combine cutting-edge medical technology with compassionate care to deliver the best health outcomes for every patient.
//                         </p>
//                         {[
//                             ['🏆','NABH Accredited Hospital','Nationally certified for quality & safety standards'],
//                             ['🕐','24/7 Emergency Services','Round-the-clock care for critical situations'],
//                             ['💻','Digital Health Records','All your records secure and accessible anytime'],
//                             ['💊','In-house Pharmacy','Medicines available right at the hospital'],
//                         ].map(([icon, title, desc]) => (
//                             <div key={title} style={{ display:'flex', gap:'14px', marginBottom:'20px', alignItems:'flex-start' }}>
//                                 <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(93,202,165,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{icon}</div>
//                                 <div>
//                                     <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', marginBottom:'2px' }}>{title}</div>
//                                     <div style={{ fontSize:'12px', color:'rgba(255,255,255,.55)' }}>{desc}</div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                     <div className="lp-about-stats">
//                         {[
//                             { num:'99%',  label:'Patient Satisfaction', icon:'😊' },
//                             { num:'500+', label:'Specialist Doctors',   icon:'👨‍⚕️' },
//                             { num:'24/7', label:'Emergency Support',    icon:'🚨' },
//                             { num:'50K+', label:'Lives Touched',        icon:'❤️' },
//                         ].map(s => (
//                             <div key={s.label} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:'16px', padding:'24px 20px', textAlign:'center' }}>
//                                 <div style={{ fontSize:'28px', marginBottom:'8px' }}>{s.icon}</div>
//                                 <div style={{ fontSize:'clamp(22px,3vw,28px)', fontWeight:800, color:'#5DCAA5', fontFamily:"'Playfair Display',serif", marginBottom:'5px' }}>{s.num}</div>
//                                 <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', textTransform:'uppercase', letterSpacing:'.07em' }}>{s.label}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── CONTACT ── */}
//             <section id="contact" className="lp-section-pad" style={{ background:'#fff' }}>
//                 <div className="lp-contact-grid">
//                     <div>
//                         <div style={{ fontSize:'12px', fontWeight:700, color:'#5DCAA5', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'10px' }}>Contact Us</div>
//                         <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'16px' }}>Get in Touch</h2>
//                         <p style={{ fontSize:'14px', color:'#64748b', lineHeight:1.8, marginBottom:'32px' }}>Have questions? Our team is here to help you 24/7.</p>
//                         {[
//                             ['📍','Address','Sector 14, Priyansh Care Hospital, New Delhi - 110001'],
//                             ['📞','Phone',  '+91 98765 43210 / +91 11-2345-6789'],
//                             ['📧','Email',  'care@priyanshcare.com'],
//                             ['⏰','Timings','Mon–Sat: 8am–8pm | Emergency: 24/7'],
//                         ].map(([icon, label, val]) => (
//                             <div key={label} style={{ display:'flex', gap:'14px', marginBottom:'20px', alignItems:'flex-start' }}>
//                                 <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{icon}</div>
//                                 <div>
//                                     <div style={{ fontSize:'11px', fontWeight:700, color:'#0a4f3a', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'2px' }}>{label}</div>
//                                     <div style={{ fontSize:'13px', color:'#374151' }}>{val}</div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                     <div style={{ background:'#f0fdf4', borderRadius:'20px', padding:'32px', border:'1px solid #d1fae5' }}>
//                         <h3 style={{ fontSize:'18px', fontWeight:700, color:'#0a4f3a', fontFamily:"'Playfair Display',serif", marginBottom:'6px' }}>Book an Appointment</h3>
//                         <p style={{ fontSize:'12px', color:'#64748b', marginBottom:'20px', lineHeight:1.6 }}>Create a free account to browse all doctors, check live availability and book your appointment online.</p>
//                         {[
//                             ['✅','Choose from 500+ specialist doctors'],
//                             ['📅','See real-time available slots'],
//                             ['💊','Get digital prescriptions'],
//                             ['🧾','View bills & insurance online'],
//                         ].map(([icon, text]) => (
//                             <div key={text} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
//                                 <span style={{ fontSize:'16px' }}>{icon}</span>
//                                 <span style={{ fontSize:'13px', color:'#374151', fontWeight:500 }}>{text}</span>
//                             </div>
//                         ))}
//                         <div style={{ display:'flex', gap:'10px', marginTop:'24px', flexWrap:'wrap' }}>
//                             <button onClick={() => setModal('signup')} style={{ flex:1, minWidth:'120px', padding:'13px', borderRadius:'11px', border:'none', background:'#0a4f3a', color:'#fff', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
//                                 📅 Create Account
//                             </button>
//                             <button onClick={() => setModal('login')} style={{ padding:'13px 20px', borderRadius:'11px', border:'1.5px solid #0a4f3a', background:'transparent', color:'#0a4f3a', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
//                                 Sign In
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── FOOTER ── */}
//             <footer style={{ background:'#0a4f3a', padding:'40px 20px 24px' }}>
//                 <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'16px', paddingBottom:'24px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
//                     <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
//                         <div style={{ width:'32px', height:'32px', background:'rgba(255,255,255,.15)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🏥</div>
//                         <div>
//                             <div style={{ fontSize:'13px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>Priyansh Care Hospital</div>
//                             <div style={{ fontSize:'10px', color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:'.08em' }}>Caring for life since 2010</div>
//                         </div>
//                     </div>
//                     <div style={{ display:'flex', gap:'16px', flexWrap:'wrap' }}>
//                         {['Privacy Policy','Terms of Service','Careers','Sitemap'].map(l => (
//                             <span key={l} style={{ fontSize:'12px', cursor:'pointer', color:'rgba(255,255,255,.5)' }}>{l}</span>
//                         ))}
//                     </div>
//                 </div>
//                 <div style={{ maxWidth:'1100px', margin:'0 auto', paddingTop:'20px', textAlign:'center', fontSize:'12px', color:'rgba(255,255,255,.35)' }}>
//                     © {new Date().getFullYear()} Priyansh Care Hospital. All rights reserved. Made with ❤️ for better healthcare.
//                 </div>
//             </footer>
//
//             {/* ── MODAL ── */}
//             {modal && (
//                 <div
//                     style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)', padding:'16px' }}
//                     onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
//                     <div style={{ background:'#fff', borderRadius:'22px', padding:'clamp(20px,4vw,36px)', width:'100%', maxWidth: modal === 'signup' ? '480px' : '420px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,.25)', animation:'modalIn .25s ease', position:'relative' }}>
//                         <button onClick={() => setModal(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'#f1f5f9', border:'none', borderRadius:'8px', width:'30px', height:'30px', cursor:'pointer', fontSize:'14px', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>✕</button>
//                         {modal === 'login'
//                             ? <LoginModal  onClose={() => setModal(null)} onSwitchToSignup={() => setModal('signup')} />
//                             : <SignupModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />
//                         }
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }

