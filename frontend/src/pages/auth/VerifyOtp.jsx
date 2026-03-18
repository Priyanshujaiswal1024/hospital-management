import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import AuthLayout from '../../components/AuthLayout';
import api from '../../api/axios';

export default function VerifyOtp() {
    const [otp, setOtp]               = useState(Array(6).fill(''));
    const [error, setError]           = useState('');
    const [loading, setLoading]       = useState(false);
    const [resent, setResent]         = useState(false);
    const [timeLeft, setTimeLeft]     = useState(300);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputs   = useRef([]);
    const navigate = useNavigate();
    const { state } = useLocation();
    const email    = state?.email || '';
    const { login } = useAuth();

    // ✅ If no email in state, redirect to landing page and open signup modal
    useEffect(() => {
        if (!email) navigate('/', { state: { openModal: 'signup' }, replace: true });
    }, [email, navigate]);

    // OTP expiry countdown
    useEffect(() => {
        if (timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft]);

    // Resend cooldown countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setInterval(() => setResendCooldown(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    function handleChange(i, val) {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    }

    function handleKeyDown(i, e) {
        if (e.key === 'Backspace' && !otp[i] && i > 0)
            inputs.current[i - 1]?.focus();
    }

    function handlePaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = [...otp];
        pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
        setOtp(next);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (timeLeft <= 0) { setError('OTP expired. Please resend a new one.'); return; }
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits'); return; }
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp: code });
            login(data.jwt);
            navigate('/role-redirect');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        if (resendCooldown > 0) return;
        try {
            await api.post('/auth/resend-otp', null, { params: { email } });
            setResent(true);
            setTimeLeft(300);
            setResendCooldown(60);
            setOtp(Array(6).fill(''));
            setError('');
            inputs.current[0]?.focus();
            setTimeout(() => setResent(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP');
        }
    }

    const isExpired  = timeLeft <= 0;
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const timerColor = timeLeft <= 30 ? '#ef4444' : '#64748b';

    return (
        <AuthLayout variant="otp">

            <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
                     style={{ background: '#E1F5EE' }}>
                    ✉️
                </div>
                <h2 className="text-2xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#0a4f3a' }}>
                    Check your email
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                    We sent a 6-digit code to<br />
                    <strong style={{ color: '#0a4f3a' }}>{email}</strong>
                </p>
            </div>

            {/* Timer */}
            {!isExpired ? (
                <p className="text-xs text-center mb-4" style={{ color: timerColor, fontWeight: 600 }}>
                    ⏱ OTP expires in {formatTime(timeLeft)}
                    {timeLeft <= 60 && ' — hurry up!'}
                </p>
            ) : (
                <div className="text-xs text-center mb-4 px-4 py-2 rounded-lg"
                     style={{ background: '#fef2f2', color: '#ef4444', fontWeight: 600 }}>
                    ⚠️ OTP expired — click Resend OTP below
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-2 mb-3">
                    {otp.map((v, i) => (
                        <input
                            key={i}
                            ref={el => inputs.current[i] = el}
                            maxLength={1}
                            value={v}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            onPaste={handlePaste}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className="w-11 h-12 border-2 rounded-xl text-center text-lg font-bold outline-none transition-all"
                            style={{
                                color: '#0a4f3a',
                                background: isExpired ? '#f9fafb' : '#f8fafc',
                                borderColor: v ? '#0a4f3a' : '#e2e8f0',
                                opacity: isExpired ? 0.5 : 1,
                            }}
                        />
                    ))}
                </div>

                {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
                {resent && <p className="text-xs text-green-600 text-center mb-3">✅ New OTP sent successfully!</p>}

                <button
                    type="submit"
                    disabled={loading || isExpired}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{
                        background: loading || isExpired ? '#9ca3af' : '#0a4f3a',
                        cursor: loading || isExpired ? 'not-allowed' : 'pointer',
                    }}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </form>

            {/* Resend */}
            <p className="text-center text-xs text-gray-400 mt-4">
                Didn't receive it?{' '}
                <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    style={{
                        color: resendCooldown > 0 ? '#9ca3af' : '#0a4f3a',
                        fontWeight: 600,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        background: 'none', border: 'none', padding: 0,
                    }}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
            </p>

            {/* ✅ Fixed: navigates to '/' and opens signup modal via route state */}
            <p className="text-center text-xs text-gray-400 mt-2">
                <span
                    onClick={() => navigate('/', { state: { openModal: 'signup' } })}
                    style={{ color: '#0a4f3a', cursor: 'pointer', fontWeight: 600 }}>
                    ← Back to signup
                </span>
            </p>

        </AuthLayout>
    );
}