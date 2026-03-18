// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import AuthLayout from '../../components/AuthLayout';
// import api from '../../api/axios';
//
// export default function Signup() {
//     const [form, setForm] = useState({
//         username: '',     // this IS the email
//         password: '',
//         confirm: '',
//         fullName: '',
//         phone: '',
//     });
//     const [error, setError]           = useState('');
//     const [loading, setLoading]       = useState(false);
//     const [showPass, setShowPass]     = useState(false);
//     const [showConfirm, setShowConfirm] = useState(false);
//     const navigate = useNavigate();
//
//     async function handleSubmit(e) {
//         e.preventDefault();
//
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) {
//             setError('Please enter a valid email address'); return;
//         }
//         if (form.fullName.trim().length < 2) {
//             setError('Please enter your full name'); return;
//         }
//         if (form.phone.trim().length < 10) {
//             setError('Please enter a valid phone number'); return;
//         }
//         if (form.password.length < 6) {
//             setError('Password must be at least 6 characters'); return;
//         }
//         if (form.password !== form.confirm) {
//             setError('Passwords do not match'); return;
//         }
//
//         setError('');
//         setLoading(true);
//         try {
//             await api.post('/auth/signup', {
//                 username: form.username,   // email sent as username
//                 password: form.password,
//                 fullName: form.fullName,
//                 phone:    form.phone,
//             });
//             navigate('/verify-otp', { state: { email: form.username } });
//         } catch (err) {
//             setError(err.response?.data?.message || 'Signup failed. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     function getStrength(p) {
//         if (!p) return { label: '', color: '', width: '0%' };
//         if (p.length < 4)  return { label: 'Too weak', color: '#ef4444', width: '25%' };
//         if (p.length < 6)  return { label: 'Weak',     color: '#f97316', width: '45%' };
//         if (p.length < 8)  return { label: 'Fair',     color: '#eab308', width: '65%' };
//         if (p.length < 10) return { label: 'Good',     color: '#22c55e', width: '80%' };
//         return { label: 'Strong', color: '#0a4f3a', width: '100%' };
//     }
//
//     const strength = getStrength(form.password);
//     const inp = "border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-gray-50 w-full transition-all";
//
//     return (
//         <AuthLayout variant="signup">
//
//             <div className="mb-4">
//                 <h2 className="text-2xl font-bold"
//                     style={{ fontFamily: "'Playfair Display', serif", color: '#0a4f3a' }}>
//                     Create account
//                 </h2>
//                 <p className="text-xs text-gray-400 mt-1">
//                     Register as a new patient at Priyansh Care Hospital
//                 </p>
//             </div>
//
//             {/* tab switcher */}
//             <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
//                 <Link to="/login"
//                       className="flex-1 text-center py-2 rounded-lg text-sm font-semibold
//                                  text-gray-400 hover:text-gray-600 transition-colors">
//                     Sign In
//                 </Link>
//                 <div className="flex-1 text-center py-2 rounded-lg bg-white text-sm font-semibold shadow-sm"
//                      style={{ color: '#0a4f3a' }}>
//                     Create Account
//                 </div>
//             </div>
//
//             {/* error */}
//             {error && (
//                 <div className="flex items-center gap-2 bg-red-50 border border-red-100
//                                 text-red-600 text-xs rounded-xl px-3 py-2.5 mb-3">
//                     <span>⚠️</span>
//                     <span>{error}</span>
//                 </div>
//             )}
//
//             <form onSubmit={handleSubmit} className="flex flex-col gap-3">
//
//                 {/* full name + phone */}
//                 <div className="grid grid-cols-2 gap-3">
//                     <div className="flex flex-col gap-1">
//                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                             Full Name
//                         </label>
//                         <input
//                             className={inp}
//                             placeholder="Priyanshu Jaiswal"
//                             value={form.fullName}
//                             onChange={e => setForm({ ...form, fullName: e.target.value })}
//                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                             onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                             required
//                         />
//                     </div>
//                     <div className="flex flex-col gap-1">
//                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                             Phone
//                         </label>
//                         <input
//                             type="tel"
//                             className={inp}
//                             placeholder="+91 98765 43210"
//                             value={form.phone}
//                             onChange={e => setForm({ ...form, phone: e.target.value })}
//                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                             onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                             required
//                         />
//                     </div>
//                 </div>
//
//                 {/* email (username) */}
//                 <div className="flex flex-col gap-1">
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Email Address
//                     </label>
//                     <input
//                         type="email"
//                         className={inp}
//                         placeholder="your@email.com"
//                         value={form.username}
//                         onChange={e => setForm({ ...form, username: e.target.value })}
//                         onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                         onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                         required
//                     />
//                     <p className="text-xs text-gray-400 mt-0.5">
//                         This will be your login email
//                     </p>
//                 </div>
//
//                 {/* password */}
//                 <div className="flex flex-col gap-1">
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Password
//                     </label>
//                     <div className="relative">
//                         <input
//                             type={showPass ? 'text' : 'password'}
//                             className={inp}
//                             placeholder="Create a strong password"
//                             value={form.password}
//                             onChange={e => setForm({ ...form, password: e.target.value })}
//                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                             onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                             required
//                         />
//                         <button type="button"
//                                 onClick={() => setShowPass(p => !p)}
//                                 className="absolute right-3 top-1/2 -translate-y-1/2
//                                            text-gray-400 hover:text-gray-600 text-xs font-medium">
//                             {showPass ? 'Hide' : 'Show'}
//                         </button>
//                     </div>
//                     {form.password && (
//                         <div className="mt-1">
//                             <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
//                                 <div className="h-full rounded-full transition-all duration-300"
//                                      style={{ width: strength.width, background: strength.color }} />
//                             </div>
//                             <p className="text-xs mt-0.5 font-medium" style={{ color: strength.color }}>
//                                 {strength.label}
//                             </p>
//                         </div>
//                     )}
//                 </div>
//
//                 {/* confirm password */}
//                 <div className="flex flex-col gap-1">
//                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                         Confirm Password
//                     </label>
//                     <div className="relative">
//                         <input
//                             type={showConfirm ? 'text' : 'password'}
//                             className={inp}
//                             placeholder="Repeat your password"
//                             value={form.confirm}
//                             onChange={e => setForm({ ...form, confirm: e.target.value })}
//                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                             onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                             required
//                         />
//                         <button type="button"
//                                 onClick={() => setShowConfirm(p => !p)}
//                                 className="absolute right-3 top-1/2 -translate-y-1/2
//                                            text-gray-400 hover:text-gray-600 text-xs font-medium">
//                             {showConfirm ? 'Hide' : 'Show'}
//                         </button>
//                     </div>
//                     {form.confirm && (
//                         <p className="text-xs font-medium mt-0.5"
//                            style={{ color: form.password === form.confirm ? '#0a4f3a' : '#ef4444' }}>
//                             {form.password === form.confirm ? '✓ Passwords match' : '✗ Does not match'}
//                         </p>
//                     )}
//                 </div>
//
//                 {/* submit */}
//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-1
//                                transition-all disabled:opacity-60 disabled:cursor-not-allowed
//                                flex items-center justify-center gap-2"
//                     style={{ background: '#0a4f3a' }}
//                     onMouseEnter={e => { if (!loading) e.target.style.background = '#1D9E75'; }}
//                     onMouseLeave={e => { e.target.style.background = '#0a4f3a'; }}
//                 >
//                     {loading ? (
//                         <>
//                             <svg className="animate-spin h-4 w-4 text-white"
//                                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                                 <circle className="opacity-25" cx="12" cy="12" r="10"
//                                         stroke="currentColor" strokeWidth="4" />
//                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
//                             </svg>
//                             Creating account...
//                         </>
//                     ) : (
//                         'Create Account & Send OTP'
//                     )}
//                 </button>
//
//             </form>
//
//             <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
//                 By signing up you agree to our{' '}
//                 <span className="font-semibold cursor-pointer" style={{ color: '#0a4f3a' }}>
//                     Terms of Service
//                 </span>{' '}and{' '}
//                 <span className="font-semibold cursor-pointer" style={{ color: '#0a4f3a' }}>
//                     Privacy Policy
//                 </span>
//             </p>
//
//             <p className="text-center text-xs text-gray-400 mt-2">
//                 Already have an account?{' '}
//                 <Link to="/login" className="font-semibold" style={{ color: '#0a4f3a' }}>
//                     Sign in
//                 </Link>
//             </p>
//
//         </AuthLayout>
//     );
// }