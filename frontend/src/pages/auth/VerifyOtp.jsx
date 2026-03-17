import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import api from '../../api/axios';

export default function VerifyOtp() {
    const [otp, setOtp]         = useState(Array(6).fill(''));
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const [resent, setResent]   = useState(false);
    const inputs                = useRef([]);
    const navigate              = useNavigate();
    const { state }             = useLocation();
    const email                 = state?.email || '';

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

    async function handleSubmit(e) {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Enter all 6 digits'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verify-otp', { email, otp: code });
            navigate('/login', { state: { verified: true } });
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        try {
            await api.post('/auth/resend-otp', null, { params: { email } });
            setResent(true);
            setTimeout(() => setResent(false), 3000);
        } catch {}
    }

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
                    <strong style={{ color: '#0a4f3a' }}>{email || 'your email'}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex justify-center gap-2 mb-2">
                    {otp.map((v, i) => (
                        <input key={i}
                               ref={el => inputs.current[i] = el}
                               maxLength={1}
                               value={v}
                               onChange={e => handleChange(i, e.target.value)}
                               onKeyDown={e => handleKeyDown(i, e)}
                               className="w-11 h-12 border-2 border-gray-200 rounded-xl text-center
                         text-lg font-bold outline-none bg-gray-50 transition-all"
                               style={{ color: '#0a4f3a', fontFamily: 'Outfit, sans-serif' }}
                               onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                               onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    ))}
                </div>

                {error  && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
                {resent && <p className="text-xs text-center mb-3" style={{ color: '#0a4f3a' }}>OTP resent!</p>}

                <p className="text-xs text-gray-400 text-center mb-5">Enter the 6-digit code above</p>

                <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white
                     transition-all disabled:opacity-60"
                        style={{ background: '#0a4f3a' }}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
                Didn't receive it?{' '}
                <button onClick={handleResend}
                        className="font-semibold" style={{ color: '#0a4f3a' }}>
                    Resend OTP
                </button>
            </p>
            <p className="text-center text-xs text-gray-400 mt-2">
                <Link to="/signup" style={{ color: '#0a4f3a' }}>← Back to signup</Link>
            </p>
        </AuthLayout>
    );
}