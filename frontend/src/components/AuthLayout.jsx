const features = {
    login: [
        { icon: '📅', text: 'Book appointments with top specialists' },
        { icon: '💊', text: 'View prescriptions & medical records' },
        { icon: '🛡️', text: 'Insurance & billing management' },
    ],
    signup: [
        { icon: '✅', text: 'OTP verified secure registration' },
        { icon: '🔒', text: 'Your data is private & encrypted' },
        { icon: '📱', text: 'Access anywhere, anytime' },
    ],
    otp: [
        { icon: '🔐', text: 'One-time password — valid for 10 minutes' },
        { icon: '📧', text: 'Check your spam folder if not received' },
        { icon: '🔄', text: 'Resend OTP if it expired' },
    ],
    forgot: [
        { icon: '📧', text: 'Reset link sent to your email' },
        { icon: '⏱️', text: 'Link expires in 15 minutes' },
        { icon: '🔒', text: 'Secure — only you can reset' },
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
             style={{ background: '#e8ede9' }}>
            <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden"
                 style={{ minHeight: '580px', boxShadow: '0 24px 60px rgba(0,0,0,.18)' }}>

                {/* ── LEFT PANEL ── */}
                <div className="relative flex flex-col justify-between p-10 overflow-hidden"
                     style={{ width: '52%', background: '#0a4f3a' }}>

                    {/* decorative circles */}
                    <div className="absolute rounded-full"
                         style={{ top: '-64px', right: '-64px', width: '256px', height: '256px',
                             background: 'rgba(255,255,255,.04)' }} />
                    <div className="absolute rounded-full"
                         style={{ bottom: '-80px', left: '-48px', width: '288px', height: '288px',
                             background: 'rgba(255,255,255,.05)' }} />

                    {/* top section */}
                    <div className="relative z-10">
                        {/* logo */}
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                                 style={{ background: 'rgba(255,255,255,.15)',
                                     border: '1px solid rgba(255,255,255,.2)' }}>
                                🏥
                            </div>
                            <div>
                                <div className="text-white font-semibold text-base leading-tight"
                                     style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Priyansh Care
                                </div>
                                <div className="text-xs mt-0.5 tracking-widest uppercase"
                                     style={{ color: 'rgba(255,255,255,.45)' }}>
                                    Hospital
                                </div>
                            </div>
                        </div>

                        {/* heading */}
                        <h1 className="text-3xl leading-tight mb-3"
                            style={{ fontFamily: "'Playfair Display', serif", color: '#fff' }}>
                            {h.line1}<br />
                            {h.line2}<span style={{ color: '#5DCAA5' }}>{h.accent}</span>
                        </h1>
                        <p className="text-sm leading-relaxed mb-8 max-w-xs"
                           style={{ color: 'rgba(255,255,255,.6)' }}>
                            Access your medical records, appointments, prescriptions and more — all in one place.
                        </p>

                        {/* features */}
                        <div className="flex flex-col gap-3">
                            {feats.map((f, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                                         style={{ background: 'rgba(255,255,255,.1)',
                                             border: '1px solid rgba(255,255,255,.15)' }}>
                                        {f.icon}
                                    </div>
                                    <span className="text-sm font-medium"
                                          style={{ color: 'rgba(255,255,255,.75)' }}>
                    {f.text}
                  </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* bottom trust stats */}
                    <div className="relative z-10 flex gap-6 pt-6"
                         style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
                        {[['500+', 'Doctors'], ['50K+', 'Patients'], ['20+', 'Departments']].map(([num, lbl]) => (
                            <div key={lbl}>
                                <div className="text-xl font-bold"
                                     style={{ fontFamily: "'Playfair Display', serif", color: '#5DCAA5' }}>
                                    {num}
                                </div>
                                <div className="text-xs mt-0.5 uppercase tracking-wider"
                                     style={{ color: 'rgba(255,255,255,.4)' }}>
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