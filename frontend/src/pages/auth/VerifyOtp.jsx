import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

export default function VerifyOtp() {
    const [otp,            setOtp]            = useState(Array(6).fill(''));
    const [error,          setError]          = useState('');
    const [loading,        setLoading]        = useState(false);
    const [resent,         setResent]         = useState(false);
    const [timeLeft,       setTimeLeft]       = useState(300);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputs   = useRef([]);
    const navigate = useNavigate();
    const { state } = useLocation();
    const email     = state?.email || '';
    const { login } = useAuth();

    // Redirect if no email
    useEffect(() => {
        if (!email) navigate('/', { state: { openModal: 'signup' }, replace: true });
    }, [email, navigate]);

    // Focus first box on mount
    useEffect(() => {
        setTimeout(() => inputs.current[0]?.focus(), 300);
    }, []);

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

    // Auto-submit when all 6 digits filled
    useEffect(() => {
        if (otp.every(d => d !== '') && !loading) {
            handleVerify();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [otp]);

    function handleChange(i, val) {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        setError('');
        if (val && i < 5) inputs.current[i + 1]?.focus();
    }

    function handleKeyDown(i, e) {
        if (e.key === 'Backspace') {
            if (otp[i]) {
                const next = [...otp]; next[i] = ''; setOtp(next);
            } else if (i > 0) {
                const next = [...otp]; next[i - 1] = ''; setOtp(next);
                inputs.current[i - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft'  && i > 0) inputs.current[i - 1]?.focus();
        else if   (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus();
    }

    function handlePaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = Array(6).fill('');
        pasted.split('').forEach((ch, idx) => { if (idx < 6) next[idx] = ch; });
        setOtp(next);
        inputs.current[Math.min(pasted.length, 5)]?.focus();
    }

    async function handleVerify() {
        if (timeLeft <= 0) { setError('OTP expired. Please request a new one.'); return; }
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter all 6 digits'); return; }
        setLoading(true); setError('');
        try {
            const { data } = await api.post('/auth/verify-otp', { email, otp: code });
            login(data.jwt);
            navigate('/role-redirect');
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || '';
            const lower = msg.toLowerCase();
            if (lower.includes('expired') || lower.includes('expire'))
                setError('OTP has expired. Please request a new one.');
            else if (lower.includes('invalid') || lower.includes('incorrect') || lower.includes('wrong'))
                setError('Incorrect OTP. Please check and try again.');
            else if (lower.includes('already') || lower.includes('verified'))
                setError('This account is already verified. You can sign in now.');
            else
                setError(msg || 'Verification failed. Please try again.');
            setOtp(Array(6).fill(''));
            setTimeout(() => inputs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        if (resendCooldown > 0) return;
        setError('');
        try {
            await api.post('/auth/resend-otp', null, { params: { email } });
            setResent(true);
            setTimeLeft(300);
            setResendCooldown(60);
            setOtp(Array(6).fill(''));
            setTimeout(() => { setResent(false); inputs.current[0]?.focus(); }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
        }
    }

    const isExpired  = timeLeft <= 0;
    const formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const timerColor = timeLeft <= 30 ? '#ef4444' : timeLeft <= 60 ? '#f97316' : '#64748b';
    const filledCount = otp.filter(d => d !== '').length;

    // Masked email for display  e.g. pr****@gmail.com
    const maskedEmail = email
        ? email.replace(/^(.{2}).+(@.+)$/, (_, a, b) => a + '•'.repeat(Math.max(0, email.indexOf('@') - 2)) + b)
        : '';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a4f3a 0%, #0d6b50 50%, #1D9E75 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: "'DM Sans', 'Outfit', sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                * { box-sizing: border-box; }

                @keyframes otp-in    { from{opacity:0; transform:translateY(20px)} to{opacity:1; transform:translateY(0)} }
                @keyframes otp-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
                @keyframes spin      { to{transform:rotate(360deg)} }
                @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }
                @keyframes pop       { 0%{transform:scale(1)} 40%{transform:scale(1.15)} 100%{transform:scale(1)} }
                @keyframes timer-in  { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }

                .otp-card {
                    background: #fff;
                    border-radius: 24px;
                    width: 100%;
                    max-width: 420px;
                    box-shadow: 0 24px 64px rgba(0,0,0,.24), 0 4px 16px rgba(0,0,0,.12);
                    animation: otp-in .4s ease;
                    overflow: hidden;
                }

                /* ── OTP input boxes ── */
                .otp-wrap {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    margin: 20px 0 6px;
                }
                .otp-box {
                    width: 52px; height: 60px;
                    border: 2px solid #e5e7eb;
                    border-radius: 14px;
                    font-size: 26px; font-weight: 800;
                    text-align: center;
                    background: #f8fafc;
                    color: #0f172a;
                    outline: none;
                    transition: border-color .15s, box-shadow .15s, transform .1s, background .15s;
                    font-family: 'DM Sans', monospace;
                    caret-color: #0a4f3a;
                    -webkit-appearance: none;
                }
                .otp-box:focus {
                    border-color: #0a4f3a;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(10,79,58,.12);
                    transform: scale(1.07);
                }
                .otp-box.filled {
                    border-color: #0a4f3a;
                    background: #f0fdf4;
                    animation: pop .15s ease;
                }
                .otp-box.error-box {
                    border-color: #fca5a5;
                    background: #fff5f5;
                    animation: otp-shake .4s ease;
                }
                .otp-box.expired {
                    opacity: .45;
                    cursor: not-allowed;
                    background: #f9fafb;
                }

                /* ── Progress dots ── */
                .otp-dots { display:flex; justify-content:center; gap:6px; margin-bottom:16px; }
                .otp-dot  { width:8px; height:8px; border-radius:50%; background:#e5e7eb; transition:background .2s, transform .2s; }
                .otp-dot.active { background:#0a4f3a; transform:scale(1.25); }

                /* ── Verify button ── */
                .otp-btn {
                    width: 100%; padding: 14px;
                    border-radius: 13px; border: none;
                    background: #0a4f3a; color: #fff;
                    font-size: 14px; font-weight: 700;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: background .2s, transform .15s, box-shadow .2s;
                    margin-top: 16px;
                }
                .otp-btn:hover:not(:disabled) {
                    background: #0d6b50;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(10,79,58,.3);
                }
                .otp-btn:disabled { background: #94a3b8; cursor: not-allowed; }
                .otp-btn.verified { background: #15803d; }

                .otp-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid rgba(255,255,255,.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    display: inline-block;
                    animation: spin .7s linear infinite;
                }

                /* ── Timer ── */
                .timer-box {
                    text-align: center;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 8px 14px;
                    border-radius: 10px;
                    margin-bottom: 16px;
                    animation: timer-in .3s ease;
                    font-variant-numeric: tabular-nums;
                    letter-spacing: .02em;
                }
                .timer-box.active  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
                .timer-box.warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
                .timer-box.danger  { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
                .timer-box.expired { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

                /* ── Tips box ── */
                .otp-tips {
                    margin-top: 16px;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 10px;
                    padding: 10px 14px;
                    font-size: 11px;
                    color: #92400e;
                    line-height: 1.7;
                }

                /* ── Responsive ── */
                @media (max-width: 400px) {
                    .otp-box    { width: 44px; height: 52px; font-size: 22px; border-radius: 11px; }
                    .otp-wrap   { gap: 7px; }
                    .otp-header { padding: 22px 16px 20px!important; }
                    .otp-body   { padding: 20px 16px!important; }
                }
                @media (max-width: 340px) {
                    .otp-box  { width: 38px; height: 46px; font-size: 19px; border-radius: 9px; }
                    .otp-wrap { gap: 5px; }
                }
                @media (max-width: 280px) {
                    .otp-box  { width: 34px; height: 42px; font-size: 17px; border-radius: 8px; }
                    .otp-wrap { gap: 4px; }
                }
            `}</style>

            <div className="otp-card">

                {/* ── Header ── */}
                <div className="otp-header" style={{
                    background: 'linear-gradient(135deg, #062e22 0%, #0a4f3a 100%)',
                    padding: '28px 28px 24px',
                    textAlign: 'center',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 60, height: 60,
                        borderRadius: 18,
                        background: 'rgba(255,255,255,.12)',
                        border: '1.5px solid rgba(255,255,255,.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, margin: '0 auto 14px',
                    }}>
                        📧
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display', serif", marginBottom: 6 }}>
                        Verify Your Email
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>
                        We sent a 6-digit code to
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#5DCAA5', marginTop: 3, letterSpacing: '.01em' }}>
                        {maskedEmail || email}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="otp-body" style={{ padding: '24px 24px 28px' }}>

                    {/* Progress dots */}
                    <div className="otp-dots">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className={`otp-dot ${i < filledCount ? 'active' : ''}`}/>
                        ))}
                    </div>

                    {/* Timer */}
                    {!isExpired ? (
                        <div className={`timer-box ${timeLeft <= 30 ? 'danger' : timeLeft <= 60 ? 'warning' : 'active'}`}>
                            {timeLeft <= 30
                                ? `⚠️ Hurry! OTP expires in ${formatTime(timeLeft)}`
                                : timeLeft <= 60
                                    ? `⏰ OTP expires in ${formatTime(timeLeft)}`
                                    : `⏱ OTP expires in ${formatTime(timeLeft)}`
                            }
                        </div>
                    ) : (
                        <div className="timer-box expired">
                            ⚠️ OTP expired — tap Resend OTP below
                        </div>
                    )}

                    {/* Success message */}
                    {resent && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', fontSize: 12, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>
                            ✅ New OTP sent! Check your inbox.
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* OTP input boxes */}
                    <div className="otp-wrap" onPaste={handlePaste}>
                        {otp.map((v, i) => (
                            <input
                                key={i}
                                ref={el => inputs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={v}
                                className={`otp-box ${isExpired ? 'expired' : error ? 'error-box' : v ? 'filled' : ''}`}
                                onChange={e => handleChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onFocus={e => e.target.select()}
                                disabled={isExpired || loading}
                                autoComplete="one-time-code"
                            />
                        ))}
                    </div>

                    {/* Hint text */}
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                        {isExpired
                            ? 'Request a new OTP to continue'
                            : filledCount === 0
                                ? 'Enter the 6-digit code from your email'
                                : filledCount < 6
                                    ? `${6 - filledCount} more digit${6 - filledCount !== 1 ? 's' : ''} needed`
                                    : loading ? 'Verifying...' : 'Auto-verifying...'}
                    </div>

                    {/* Verify Button */}
                    <button
                        type="button"
                        className="otp-btn"
                        onClick={handleVerify}
                        disabled={loading || isExpired || filledCount < 6}
                    >
                        {loading
                            ? <><span className="otp-spinner"/> Verifying...</>
                            : isExpired
                                ? 'OTP Expired'
                                : `Verify OTP ${filledCount < 6 ? `(${filledCount}/6)` : '→'}`
                        }
                    </button>

                    {/* Resend section */}
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
                            Didn't receive the code?
                        </div>
                        {resendCooldown > 0 ? (
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                                Resend available in{' '}
                                <span style={{ color: '#0a4f3a', fontVariantNumeric: 'tabular-nums' }}>
                                    {resendCooldown}s
                                </span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResend}
                                style={{
                                    background: 'none', border: 'none',
                                    color: '#0a4f3a', fontWeight: 700,
                                    fontSize: 13, cursor: 'pointer',
                                    fontFamily: "'DM Sans', sans-serif",
                                    textDecoration: 'underline',
                                }}
                            >
                                🔁 Resend OTP
                            </button>
                        )}
                    </div>

                    {/* Back to signup */}
                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <span
                            onClick={() => navigate('/', { state: { openModal: 'signup' } })}
                            style={{ fontSize: 12, color: '#0a4f3a', fontWeight: 600, cursor: 'pointer' }}
                        >
                            ← Back to signup
                        </span>
                    </div>

                    {/* Tips */}
                    <div className="otp-tips">
                        💡 <strong>Didn't get the email?</strong><br/>
                        • Check your <strong>Spam / Junk</strong> folder<br/>
                        • Make sure <strong>{maskedEmail}</strong> is correct<br/>
                        • Wait a few minutes then tap Resend<br/>
                        • You can paste the OTP directly into the boxes
                    </div>
                </div>
            </div>
        </div>
    );
}


















// import { useState, useRef, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../../auth/AuthContext';
// import AuthLayout from '../../components/AuthLayout';
// import api from '../../api/axios';
//
// export default function VerifyOtp() {
//     const [otp, setOtp]               = useState(Array(6).fill(''));
//     const [error, setError]           = useState('');
//     const [loading, setLoading]       = useState(false);
//     const [resent, setResent]         = useState(false);
//     const [timeLeft, setTimeLeft]     = useState(300);
//     const [resendCooldown, setResendCooldown] = useState(0);
//
//     const inputs   = useRef([]);
//     const navigate = useNavigate();
//     const { state } = useLocation();
//     const email    = state?.email || '';
//     const { login } = useAuth();
//
//     // ✅ If no email in state, redirect to landing page and open signup modal
//     useEffect(() => {
//         if (!email) navigate('/', { state: { openModal: 'signup' }, replace: true });
//     }, [email, navigate]);
//
//     // OTP expiry countdown
//     useEffect(() => {
//         if (timeLeft <= 0) return;
//         const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
//         return () => clearInterval(t);
//     }, [timeLeft]);
//
//     // Resend cooldown countdown
//     useEffect(() => {
//         if (resendCooldown <= 0) return;
//         const t = setInterval(() => setResendCooldown(p => p - 1), 1000);
//         return () => clearInterval(t);
//     }, [resendCooldown]);
//
//     function handleChange(i, val) {
//         if (!/^\d?$/.test(val)) return;
//         const next = [...otp];
//         next[i] = val;
//         setOtp(next);
//         if (val && i < 5) inputs.current[i + 1]?.focus();
//     }
//
//     function handleKeyDown(i, e) {
//         if (e.key === 'Backspace' && !otp[i] && i > 0)
//             inputs.current[i - 1]?.focus();
//     }
//
//     function handlePaste(e) {
//         e.preventDefault();
//         const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
//         if (!pasted) return;
//         const next = [...otp];
//         pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
//         setOtp(next);
//         inputs.current[Math.min(pasted.length, 5)]?.focus();
//     }
//
//     async function handleSubmit(e) {
//         e.preventDefault();
//         if (timeLeft <= 0) { setError('OTP expired. Please resend a new one.'); return; }
//         const code = otp.join('');
//         if (code.length < 6) { setError('Please enter all 6 digits'); return; }
//         setLoading(true); setError('');
//         try {
//             const { data } = await api.post('/auth/verify-otp', { email, otp: code });
//             login(data.jwt);
//             navigate('/role-redirect');
//         } catch (err) {
//             setError(err.response?.data?.message || 'Invalid or expired OTP');
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     async function handleResend() {
//         if (resendCooldown > 0) return;
//         try {
//             await api.post('/auth/resend-otp', null, { params: { email } });
//             setResent(true);
//             setTimeLeft(300);
//             setResendCooldown(60);
//             setOtp(Array(6).fill(''));
//             setError('');
//             inputs.current[0]?.focus();
//             setTimeout(() => setResent(false), 3000);
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to resend OTP');
//         }
//     }
//
//     const isExpired  = timeLeft <= 0;
//     const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
//     const timerColor = timeLeft <= 30 ? '#ef4444' : '#64748b';
//
//     return (
//         <AuthLayout variant="otp">
//
//             <div className="text-center mb-6">
//                 <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
//                      style={{ background: '#E1F5EE' }}>
//                     ✉️
//                 </div>
//                 <h2 className="text-2xl font-bold"
//                     style={{ fontFamily: "'Playfair Display', serif", color: '#0a4f3a' }}>
//                     Check your email
//                 </h2>
//                 <p className="text-xs text-gray-400 mt-2">
//                     We sent a 6-digit code to<br />
//                     <strong style={{ color: '#0a4f3a' }}>{email}</strong>
//                 </p>
//             </div>
//
//             {/* Timer */}
//             {!isExpired ? (
//                 <p className="text-xs text-center mb-4" style={{ color: timerColor, fontWeight: 600 }}>
//                     ⏱ OTP expires in {formatTime(timeLeft)}
//                     {timeLeft <= 60 && ' — hurry up!'}
//                 </p>
//             ) : (
//                 <div className="text-xs text-center mb-4 px-4 py-2 rounded-lg"
//                      style={{ background: '#fef2f2', color: '#ef4444', fontWeight: 600 }}>
//                     ⚠️ OTP expired — click Resend OTP below
//                 </div>
//             )}
//
//             <form onSubmit={handleSubmit}>
//                 <div className="flex justify-center gap-2 mb-3">
//                     {otp.map((v, i) => (
//                         <input
//                             key={i}
//                             ref={el => inputs.current[i] = el}
//                             maxLength={1}
//                             value={v}
//                             onChange={e => handleChange(i, e.target.value)}
//                             onKeyDown={e => handleKeyDown(i, e)}
//                             onPaste={handlePaste}
//                             inputMode="numeric"
//                             autoComplete="one-time-code"
//                             className="w-11 h-12 border-2 rounded-xl text-center text-lg font-bold outline-none transition-all"
//                             style={{
//                                 color: '#0a4f3a',
//                                 background: isExpired ? '#f9fafb' : '#f8fafc',
//                                 borderColor: v ? '#0a4f3a' : '#e2e8f0',
//                                 opacity: isExpired ? 0.5 : 1,
//                             }}
//                         />
//                     ))}
//                 </div>
//
//                 {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
//                 {resent && <p className="text-xs text-green-600 text-center mb-3">✅ New OTP sent successfully!</p>}
//
//                 <button
//                     type="submit"
//                     disabled={loading || isExpired}
//                     className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
//                     style={{
//                         background: loading || isExpired ? '#9ca3af' : '#0a4f3a',
//                         cursor: loading || isExpired ? 'not-allowed' : 'pointer',
//                     }}>
//                     {loading ? 'Verifying...' : 'Verify OTP'}
//                 </button>
//             </form>
//
//             {/* Resend */}
//             <p className="text-center text-xs text-gray-400 mt-4">
//                 Didn't receive it?{' '}
//                 <button
//                     onClick={handleResend}
//                     disabled={resendCooldown > 0}
//                     style={{
//                         color: resendCooldown > 0 ? '#9ca3af' : '#0a4f3a',
//                         fontWeight: 600,
//                         cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
//                         background: 'none', border: 'none', padding: 0,
//                     }}>
//                     {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
//                 </button>
//             </p>
//
//             {/* ✅ Fixed: navigates to '/' and opens signup modal via route state */}
//             <p className="text-center text-xs text-gray-400 mt-2">
//                 <span
//                     onClick={() => navigate('/', { state: { openModal: 'signup' } })}
//                     style={{ color: '#0a4f3a', cursor: 'pointer', fontWeight: 600 }}>
//                     ← Back to signup
//                 </span>
//             </p>
//
//         </AuthLayout>
//     );
// }