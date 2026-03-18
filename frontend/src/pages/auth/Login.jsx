// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import AuthLayout from '../../components/AuthLayout';
// import { useAuth } from '../../auth/AuthContext';
// import api from '../../api/axios';
//
// export default function Login() {
//     const [form, setForm]         = useState({ username: '', password: '' });
//     const [error, setError]       = useState('');
//     const [loading, setLoading]   = useState(false);
//     const [showPass, setShowPass] = useState(false);
//     // const { login }               = useAuth();
//     const navigate                = useNavigate();
//
//     async function handleSubmit(e) {
//         e.preventDefault();
//
//         // basic validation
//         if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) {
//             setError('Please enter a valid email address'); return;
//         }
//         if (form.password.length < 1) {
//             setError('Please enter your password'); return;
//         }
//
//         setError('');
//         setLoading(true);
//         try {
//             const { data } = await api.post('/auth/login', {
//                 username: form.username,   // username = email in backend
//                 password: form.password,
//             });
//             login(data.jwt);
//             navigate('/');               // RoleRedirect handles where to go
//         } catch (err) {
//             setError(err.response?.data?.message || 'Invalid email or password');
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     const inp = `border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none
//                  bg-gray-50 w-full transition-all`;
//
//     return (
//         <AuthLayout variant="login">
//
//             {/* heading */}
//             <div className="mb-6">
//                 <h2 className="text-2xl font-bold"
//                     style={{ fontFamily: "'Playfair Display', serif", color: '#0a4f3a' }}>
//                     Welcome back
//                 </h2>
//                 <p className="text-xs text-gray-400 mt-1">
//                     Sign in to your Priyansh Care Hospital account
//                 </p>
//             </div>
//
//             {/* tab switcher */}
//             <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
//                 <div className="flex-1 text-center py-2 rounded-lg bg-white text-sm font-semibold shadow-sm"
//                      style={{ color: '#0a4f3a' }}>
//                     Sign In
//                 </div>
//                 <Link to="/signup"
//                       className="flex-1 text-center py-2 rounded-lg text-sm font-semibold
//                                  text-gray-400 hover:text-gray-600 transition-colors">
//                     Create Account
//                 </Link>
//             </div>
//
//             {/* error message */}
//             {error && (
//                 <div className="flex items-center gap-2 bg-red-50 border border-red-100
//                                 text-red-600 text-xs rounded-xl px-3 py-2.5 mb-4">
//                     <span>⚠️</span>
//                     <span>{error}</span>
//                 </div>
//             )}
//
//             <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//
//                 {/* email field — sent as "username" to backend */}
//                 <div className="flex flex-col gap-1">
//                     <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase">
//                         Email Address
//                     </label>
//                     <input
//                         type="email"
//                         className={inp}
//                         placeholder="Enter your email"
//                         value={form.username}
//                         onChange={e => setForm({ ...form, username: e.target.value })}
//                         onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                         onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                         required
//                     />
//                 </div>
//
//                 {/* password field */}
//                 <div className="flex flex-col gap-1">
//                     <div className="flex items-center justify-between">
//                         <label className="text-xs font-semibold text-gray-600 tracking-wide uppercase">
//                             Password
//                         </label>
//                         <Link to="/forgot-password"
//                               className="text-xs font-semibold"
//                               style={{ color: '#0a4f3a' }}>
//                             Forgot password?
//                         </Link>
//                     </div>
//                     <div className="relative">
//                         <input
//                             type={showPass ? 'text' : 'password'}
//                             className={inp}
//                             placeholder="Enter your password"
//                             value={form.password}
//                             onChange={e => setForm({ ...form, password: e.target.value })}
//                             onFocus={e => e.target.style.borderColor = '#0a4f3a'}
//                             onBlur={e => e.target.style.borderColor = '#e5e7eb'}
//                             required
//                         />
//                         <button
//                             type="button"
//                             onClick={() => setShowPass(p => !p)}
//                             className="absolute right-3 top-1/2 -translate-y-1/2
//                                        text-gray-400 hover:text-gray-600 text-xs font-medium"
//                         >
//                             {showPass ? 'Hide' : 'Show'}
//                         </button>
//                     </div>
//                 </div>
//
//                 {/* submit button */}
//                 <button
//                     type="submit"
//                     disabled={loading}
//                     className="w-full py-3 rounded-xl text-sm font-semibold text-white
//                                transition-all disabled:opacity-60 disabled:cursor-not-allowed
//                                flex items-center justify-center gap-2 mt-1"
//                     style={{ background: '#0a4f3a' }}
//                     onMouseEnter={e => { if (!loading) e.target.style.background = '#1D9E75'; }}
//                     onMouseLeave={e => { e.target.style.background = '#0a4f3a'; }}
//                 >
//                     {loading ? (
//                         <>
//                             <svg className="animate-spin h-4 w-4 text-white"
//                                  xmlns="http://www.w3.org/2000/svg"
//                                  fill="none" viewBox="0 0 24 24">
//                                 <circle className="opacity-25" cx="12" cy="12" r="10"
//                                         stroke="currentColor" strokeWidth="4" />
//                                 <path className="opacity-75" fill="currentColor"
//                                       d="M4 12a8 8 0 018-8v8z" />
//                             </svg>
//                             Signing in...
//                         </>
//                     ) : (
//                         'Sign In'
//                     )}
//                 </button>
//
//             </form>
//
//             {/* role hint */}
//             <div className="flex items-center gap-2 mt-6">
//                 <div className="flex-1 h-px bg-gray-100" />
//                 <span className="text-xs text-gray-400">redirects by role</span>
//                 <div className="flex-1 h-px bg-gray-100" />
//             </div>
//             <div className="flex justify-center gap-3 mt-3">
//                 {[
//                     ['#0a4f3a', 'Patient'],
//                     ['#185FA5', 'Doctor'],
//                     ['#854F0B', 'Admin'],
//                 ].map(([color, label]) => (
//                     <div key={label}
//                          className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
//                         <div className="w-2 h-2 rounded-full" style={{ background: color }} />
//                         <span className="text-xs font-semibold text-gray-500">{label}</span>
//                     </div>
//                 ))}
//             </div>
//
//             <p className="text-center text-xs text-gray-400 mt-5">
//                 New to Priyansh Care?{' '}
//                 <Link to="/signup" className="font-semibold" style={{ color: '#0a4f3a' }}>
//                     Create an account
//                 </Link>
//             </p>
//
//         </AuthLayout>
//     );
// }