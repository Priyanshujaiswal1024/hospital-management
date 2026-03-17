import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import api from '../../api/axios';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent]   = useState(false);
    const [form, setForm]   = useState({
        otp:             '',   // ✅ OTP field add kiya
        newPassword:     '',
        confirmPassword: '',
    });
    const [msg,   setMsg]   = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSend(e) {
        e.preventDefault();
        setError(''); setMsg('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', null, { params: { email } });
            setSent(true);
            setMsg('OTP sent! Check your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Email not found');
        } finally {
            setLoading(false);
        }
    }

    async function handleReset(e) {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setError('Passwords do not match'); return;
        }
        if (!form.otp) {
            setError('Please enter the OTP'); return;
        }
        setError(''); setMsg('');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                otp:             form.otp,           // ✅ OTP bhej raha hai
                newPassword:     form.newPassword,
                confirmPassword: form.confirmPassword,
            });
            setMsg('✅ Password reset successfully! You can now login.');
            setForm({ otp: '', newPassword: '', confirmPassword: '' });
            setSent(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    }

    const inp = `border border-gray-200 rounded-xl px-4 py-3 text-sm 
                 outline-none bg-gray-50 w-full transition-all`;

    return (
        <AuthLayout variant="forgot">
            <div className="mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3"
                     style={{ background: '#E1F5EE' }}>
                    🔑
                </div>
                <h2 className="text-2xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#0a4f3a' }}>
                    Forgot password?
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                    Enter your registered email to receive a reset OTP
                </p>
            </div>

            {msg && (
                <div className="bg-green-50 text-green-700 text-xs rounded-lg px-3 py-2 mb-4">
                    {msg}
                </div>
            )}
            {error && (
                <div className="bg-red-50 text-red-600 text-xs rounded-lg px-3 py-2 mb-4">
                    {error}
                </div>
            )}

            {/* Step 1 — Email */}
            <form onSubmit={handleSend} className="mb-5">
                <div className="flex flex-col gap-1 mb-3">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Registered Email
                    </label>
                    <input
                        type="email"
                        className={inp}
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        required
                        disabled={sent}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || sent}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: sent ? '#9ca3af' : '#0a4f3a', cursor: sent ? 'not-allowed' : 'pointer' }}
                >
                    {sent ? '✅ OTP Sent' : loading ? 'Sending...' : 'Send Reset OTP'}
                </button>

                {/* resend option */}
                {sent && (
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await api.post('/auth/resend-otp', null, { params: { email } });
                                setMsg('OTP resent! Check your email.');
                            } catch {
                                setError('Failed to resend OTP');
                            }
                        }}
                        className="w-full mt-2 text-xs font-semibold"
                        style={{ color: '#0a4f3a', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        Didn't receive? Resend OTP
                    </button>
                )}
            </form>

            {/* Step 2 — OTP + New Password */}
            {sent && (
                <form onSubmit={handleReset}
                      className="flex flex-col gap-3 pt-5"
                      style={{ borderTop: '1px solid #f3f4f6' }}>

                    <p className="text-xs text-gray-400">
                        Enter the OTP sent to <b>{email}</b> and your new password
                    </p>

                    {/* ✅ OTP field */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            OTP Code
                        </label>
                        <input
                            type="text"
                            className={inp}
                            placeholder="Enter 6-digit OTP"
                            value={form.otp}
                            onChange={e => setForm({ ...form, otp: e.target.value })}
                            onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            maxLength={6}
                            required
                        />
                    </div>

                    {/* New Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            New Password
                        </label>
                        <input
                            type="password"
                            className={inp}
                            placeholder="Min 8 characters"
                            value={form.newPassword}
                            onChange={e => setForm({ ...form, newPassword: e.target.value })}
                            onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            className={inp}
                            placeholder="Repeat new password"
                            value={form.confirmPassword}
                            onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                            onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                        style={{
                            background: loading ? '#9ca3af' : '#0a4f3a',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            )}

            <p className="text-center text-xs text-gray-400 mt-5">
                <Link to="/login" className="font-semibold" style={{ color: '#0a4f3a' }}>
                    ← Back to login
                </Link>
            </p>
        </AuthLayout>
    );
}