import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import api from '../../api/axios';

export default function ForgotPassword() {
    // Step tracking
    const [step, setStep]         = useState(1); // 1 = email, 2 = otp+password

    // Step 1
    const [email, setEmail]       = useState('');

    // Step 2
    const [otp, setOtp]           = useState(Array(6).fill(''));
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPass, setShowNewPass]         = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Feedback
    const [msg, setMsg]           = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    // Timers
    const [timeLeft, setTimeLeft]           = useState(300);  // 5 min OTP expiry
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputs = useRef([]);

    // ── OTP expiry timer (starts when step 2 is shown) ──────────────────
    useEffect(() => {
        if (step !== 2 || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [step, timeLeft]);

    // ── Resend cooldown ──────────────────────────────────────────────────
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setInterval(() => setResendCooldown(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    // ── OTP input handlers ───────────────────────────────────────────────
    function handleOtpChange(i, val) {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    }

    function handleOtpKeyDown(i, e) {
        if (e.key === 'Backspace' && !otp[i] && i > 0)
            inputs.current[i - 1]?.focus();
    }

    function handleOtpPaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = [...otp];
        pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
        setOtp(next);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    }

    // ── Step 1: Send OTP ────────────────────────────────────────────────
    async function handleSend(e) {
        e.preventDefault();
        setError(''); setMsg(''); setLoading(true);

        try {
            await api.post('/auth/forgot-password', null, { params: { email } });
            setMsg('OTP sent! Check your email.');
            setStep(2);
            setTimeLeft(300);
            setResendCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Email not found');
        } finally {
            setLoading(false);
        }
    }

    // ── Resend OTP (from step 2) ─────────────────────────────────────────
    async function handleResend() {
        if (resendCooldown > 0) return;
        setError(''); setMsg('');

        try {
            await api.post('/auth/forgot-password', null, { params: { email } });
            setMsg('OTP resent! Check your email.');
            setTimeLeft(300);
            setResendCooldown(60);
            setOtp(Array(6).fill(''));
            inputs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    }

    // ── Step 2: Reset password ───────────────────────────────────────────
    async function handleReset(e) {
        e.preventDefault();
        setError(''); setMsg('');

        if (timeLeft <= 0) { setError('OTP expired. Please resend a new one.'); return; }

        const code = otp.join('');
        if (code.length < 6)              { setError('Please enter all 6 OTP digits'); return; }
        if (!newPassword)                 { setError('Please enter a new password'); return; }
        if (newPassword.length < 8)       { setError('Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', {
                email,
                otp:             code,
                newPassword,
                confirmPassword,
            });
            setMsg('✅ Password reset successfully! You can now login.');
            // Reset everything back to step 1
            setStep(1);
            setEmail('');
            setOtp(Array(6).fill(''));
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────
    const isExpired  = step === 2 && timeLeft <= 0;
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const timerColor = timeLeft <= 30 ? '#ef4444' : '#64748b';

    function strength(p) {
        if (!p)        return null;
        if (p.length < 4) return { label: 'Too weak', color: '#ef4444', w: '20%' };
        if (p.length < 6) return { label: 'Weak',     color: '#f97316', w: '40%' };
        if (p.length < 8) return { label: 'Fair',     color: '#eab308', w: '65%' };
        return              { label: 'Strong',   color: '#0a4f3a', w: '100%' };
    }
    const str = strength(newPassword);

    const inp = {
        width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
        padding: '11px 14px', fontSize: '13px', outline: 'none', background: '#f8fafc',
        fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box', transition: 'border .15s',
    };

    return (
        <AuthLayout variant="forgot">

            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '12px' }}>
                    🔑
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0a4f3a', fontFamily: "'Playfair Display',serif", marginBottom: '4px' }}>
                    Forgot password?
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {step === 1
                        ? 'Enter your registered email to receive a reset OTP'
                        : `Enter the OTP sent to ${email}`}
                </p>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[1, 2].map(s => (
                    <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '99px',
                        background: step >= s ? '#0a4f3a' : '#e2e8f0',
                        transition: 'background .3s',
                    }} />
                ))}
            </div>

            {/* Feedback messages */}
            {msg && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '12px', borderRadius: '9px', padding: '10px 12px', marginBottom: '14px' }}>
                    {msg}
                </div>
            )}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '9px', padding: '10px 12px', marginBottom: '14px' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* ── STEP 1: Email ─────────────────────────────────────────────── */}
            {step === 1 && (
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                            Registered Email
                        </label>
                        <input
                            type="email"
                            style={inp}
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '13px', borderRadius: '11px', border: 'none', background: loading ? '#9ca3af' : '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
                        {loading ? 'Sending...' : 'Send Reset OTP →'}
                    </button>
                </form>
            )}

            {/* ── STEP 2: OTP boxes + new password ─────────────────────────── */}
            {step === 2 && (
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Timer */}
                    {!isExpired ? (
                        <p style={{ fontSize: '12px', textAlign: 'center', color: timerColor, fontWeight: 600, margin: 0 }}>
                            ⏱ OTP expires in {formatTime(timeLeft)}
                            {timeLeft <= 60 && ' — hurry!'}
                        </p>
                    ) : (
                        <div style={{ background: '#fef2f2', color: '#ef4444', fontSize: '12px', borderRadius: '8px', padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>
                            ⚠️ OTP expired — click Resend below
                        </div>
                    )}

                    {/* 6-digit OTP boxes */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '10px' }}>
                            OTP Code
                        </label>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            {otp.map((v, i) => (
                                <input
                                    key={i}
                                    ref={el => inputs.current[i] = el}
                                    maxLength={1}
                                    value={v}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                    onPaste={handleOtpPaste}
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    style={{
                                        width: '44px', height: '48px', border: '2px solid',
                                        borderColor: v ? '#0a4f3a' : '#e2e8f0',
                                        borderRadius: '10px', textAlign: 'center',
                                        fontSize: '18px', fontWeight: 700,
                                        color: '#0a4f3a', background: isExpired ? '#f9fafb' : '#f8fafc',
                                        outline: 'none', opacity: isExpired ? 0.5 : 1,
                                        transition: 'border-color .15s',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Resend link */}
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                            Didn't receive it?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                style={{ color: resendCooldown > 0 ? '#9ca3af' : '#0a4f3a', fontWeight: 600, cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', background: 'none', border: 'none', padding: 0, fontSize: '12px' }}>
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </p>
                    </div>

                    {/* New Password */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                            New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNewPass ? 'text' : 'password'}
                                style={inp}
                                placeholder="Min 8 characters"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                required
                            />
                            <button type="button" onClick={() => setShowNewPass(p => !p)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                {showNewPass ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {str && (
                            <div style={{ marginTop: '5px' }}>
                                <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: str.w, background: str.color, borderRadius: '99px', transition: 'width .3s' }} />
                                </div>
                                <div style={{ fontSize: '10px', color: str.color, fontWeight: 600, marginTop: '3px' }}>{str.label}</div>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', display: 'block', marginBottom: '6px' }}>
                            Confirm Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPass ? 'text' : 'password'}
                                style={inp}
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                required
                            />
                            <button type="button" onClick={() => setShowConfirmPass(p => !p)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                                {showConfirmPass ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {confirmPassword && (
                            <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: newPassword === confirmPassword ? '#0a4f3a' : '#ef4444' }}>
                                {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Does not match'}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isExpired}
                        style={{ width: '100%', padding: '13px', borderRadius: '11px', border: 'none', background: loading || isExpired ? '#9ca3af' : '#0a4f3a', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: loading || isExpired ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>

                    {/* Back to step 1 */}
                    <button
                        type="button"
                        onClick={() => { setStep(1); setError(''); setMsg(''); }}
                        style={{ width: '100%', background: 'none', border: 'none', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                        ← Change email
                    </button>
                </form>
            )}

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', marginTop: '20px' }}>
                <Link to="/login" style={{ color: '#0a4f3a', fontWeight: 600 }}>
                    ← Back to login
                </Link>
            </p>

        </AuthLayout>
    );
}