import { Calendar, Pill, ShieldCheck, CheckCircle2, Lock, Smartphone, KeyRound, Mail, RefreshCw, Clock } from 'lucide-react';

/* ── Stylized P Logo ── */
function Logo({ size = 36, radius = 9 }) {
    return (
        <div style={{
            width: size, height: size,
            background: 'linear-gradient(135deg, #0d9488 0%, #0f172a 100%)',
            borderRadius: radius, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff', fontWeight: 800, fontSize: size * 0.52,
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            P
        </div>
    );
}

const features = {
    login: [
        { icon: Calendar, text: 'Book appointments with top specialists' },
        { icon: Pill, text: 'View prescriptions & medical records' },
        { icon: ShieldCheck, text: 'Insurance & billing management' },
    ],
    signup: [
        { icon: CheckCircle2, text: 'OTP verified secure registration' },
        { icon: Lock, text: 'Your data is private & encrypted' },
        { icon: Smartphone, text: 'Access anywhere, anytime' },
    ],
    otp: [
        { icon: KeyRound, text: 'One-time password — valid for 10 minutes' },
        { icon: Mail, text: 'Check your spam folder if not received' },
        { icon: RefreshCw, text: 'Resend OTP if it expired' },
    ],
    forgot: [
        { icon: Mail, text: 'Reset link sent to your email' },
        { icon: Clock, text: 'Link expires in 15 minutes' },
        { icon: Lock, text: 'Secure — only you can reset' },
    ],
};

const headings = {
    login:  { line1: 'Your Health,', line2: 'Our ', accent: 'Priority' },
    signup: { line1: 'Join', line2: 'Priyansh Care ', accent: 'Hospital' },
    otp:    { line1: 'Almost', line2: 'there ', accent: '!' },
    forgot: { line1: 'Reset your', line2: '', accent: 'Password' },
};

export default function AuthLayout({ variant = 'login', children }) {
    const feats = features[variant] || features.login;
    const h     = headings[variant] || headings.login;

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
             style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 50%, #f0fdf4 100%)' }}>
            <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80"
                 style={{ minHeight: '580px', boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.18)' }}>

                {/* ── LEFT PANEL ── */}
                <div className="relative flex flex-col justify-between p-10 overflow-hidden"
                     style={{ width: '52%', background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f766e 100%)' }}>

                    {/* decorative circles */}
                    <div className="absolute rounded-full"
                         style={{ top: '-64px', right: '-64px', width: '256px', height: '256px',
                             background: 'rgba(255,255,255,.04)' }} />
                    <div className="absolute rounded-full"
                         style={{ bottom: '-80px', left: '-48px', width: '288px', height: '288px',
                             background: 'rgba(255,255,255,.05)' }} />
                    <div className="absolute rounded-full"
                         style={{ top: '50%', right: '-20px', width: '100px', height: '100px',
                             background: 'rgba(13,148,136,.15)' }} />

                    {/* top section */}
                    <div className="relative z-10">
                        {/* SVG Logo */}
                        <div className="flex items-center gap-3 mb-12">
                            <Logo size={42} />
                            <div>
                                <div className="text-white font-bold text-lg leading-tight tracking-tight">
                                    Priyansh Care
                                </div>
                                <div className="text-xs mt-0.5 tracking-widest uppercase font-medium"
                                     style={{ color: 'rgba(255,255,255,.55)' }}>
                                    Hospital Portal
                                </div>
                            </div>
                        </div>

                        {/* heading */}
                        <h1 className="text-3xl font-bold leading-tight mb-3 text-white tracking-tight">
                            {h.line1}<br />
                            {h.line2}<span style={{ color: '#2dd4bf' }}>{h.accent}</span>
                        </h1>
                        <p className="text-sm leading-relaxed mb-8 max-w-xs"
                           style={{ color: 'rgba(255,255,255,.65)' }}>
                            Access your medical records, appointments, prescriptions and more — all in one secure portal.
                        </p>

                        {/* features */}
                        <div className="flex flex-col gap-3.5">
                            {feats.map((f, i) => {
                                const IconComponent = f.icon;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                                             style={{ background: 'rgba(255,255,255,.1)',
                                                 border: '1px solid rgba(255,255,255,.15)', color: '#2dd4bf' }}>
                                            <IconComponent size={16} />
                                        </div>
                                        <span className="text-sm font-medium"
                                              style={{ color: 'rgba(255,255,255,.85)' }}>
                                            {f.text}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* bottom trust stats */}
                    <div className="relative z-10 flex gap-6 pt-6"
                         style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}>
                        {[['500+', 'Doctors'], ['50K+', 'Patients'], ['20+', 'Departments']].map(([num, lbl]) => (
                            <div key={lbl}>
                                <div className="text-xl font-extrabold text-teal-300">
                                    {num}
                                </div>
                                <div className="text-[10px] mt-0.5 uppercase tracking-wider font-semibold"
                                     style={{ color: 'rgba(255,255,255,.45)' }}>
                                    {lbl}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="flex-1 bg-white flex flex-col justify-center px-10 py-10">
                    {children}
                </div>

            </div>
        </div>
    );
}