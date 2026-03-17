import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

function WeeklyChart({ data, color = '#60a5fa' }) {
    const ref = useRef();
    useEffect(() => {
        const canvas = ref.current;
        if (!canvas || !data?.length) return;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const max = Math.max(...data.map(d => d.value), 1);
        const barW = (W - 20) / data.length;
        data.forEach((d, i) => {
            const bh = ((d.value / max) * (H - 30)) || 4;
            const x = 10 + i * barW + barW * .15;
            const y = H - 20 - bh;
            const bwActual = barW * .7;
            const radius = Math.min(4, bwActual / 2);
            const grad = ctx.createLinearGradient(0, y, 0, H - 20);
            grad.addColorStop(0, color);
            grad.addColorStop(1, color + '44');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + bwActual - radius, y);
            ctx.quadraticCurveTo(x + bwActual, y, x + bwActual, y + radius);
            ctx.lineTo(x + bwActual, H - 20);
            ctx.lineTo(x, H - 20);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.45)';
            ctx.font = '9px DM Sans, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + bwActual / 2, H - 6);
            if (d.value > 0) {
                ctx.fillStyle = 'rgba(255,255,255,.85)';
                ctx.font = 'bold 9px DM Sans, sans-serif';
                ctx.fillText(d.value, x + bwActual / 2, y - 4);
            }
        });
    }, [data, color]);
    return <canvas ref={ref} width={320} height={110} style={{ width:'100%', height:'110px' }} />;
}

function Sparkline({ values = [], color = '#34d399' }) {
    if (values.length < 2) return null;
    const W = 72, H = 26;
    const max = Math.max(...values, 1);
    const pts = values.map((v, i) => [
        (i / (values.length - 1)) * W,
        H - 4 - ((v / max) * (H - 8)),
    ]);
    const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    const gid = `sg${color.replace('#','')}`;
    return (
        <svg width={W} height={H} style={{ display:'block' }}>
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity=".3"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={`${d} L${pts[pts.length-1][0]},${H} L0,${H} Z`} fill={`url(#${gid})`}/>
            <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
        </svg>
    );
}

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const { user }  = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [upcoming,     setUpcoming]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [time,         setTime]         = useState(new Date());
    const [doctor,       setDoctor]       = useState(null);

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        Promise.all([
            api.get('/doctors/appointments'),
            api.get('/doctors/appointments/upcoming'),
            api.get('/doctors/profile'),
        ]).then(([all, up, prof]) => {
            setAppointments(all.data || []);
            setUpcoming(up.data || []);
            setDoctor(prof.data || null);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    // ✅ Strip any existing "Dr." so we never get "Dr. Dr."
    const rawName        = doctor?.name?.replace(/^Dr\.?\s*/i, '').trim() || '';
    const doctorFullName = rawName || user?.sub?.split('@')[0] || 'Doctor';

    const today     = appointments.filter(a => a.appointmentTime &&
        new Date(a.appointmentTime).toDateString() === new Date().toDateString());
    const completed = appointments.filter(a => a.status === 'COMPLETED');
    const cancelled = appointments.filter(a => a.status === 'CANCELLED');
    const pending   = appointments.filter(a => ['BOOKED','CONFIRMED'].includes(a.status));

    const weekData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = d.toDateString();
        return {
            label: d.toLocaleDateString('en-IN', { weekday:'short' }).slice(0,2),
            value: appointments.filter(a =>
                a.appointmentTime && new Date(a.appointmentTime).toDateString() === ds).length,
        };
    });

    const statusData = [
        { label:'Completed', value: completed.length, color:'#34d399' },
        { label:'Pending',   value: pending.length,   color:'#fbbf24' },
        { label:'Cancelled', value: cancelled.length, color:'#f87171' },
    ];
    const totalForPie = statusData.reduce((s,d) => s + d.value, 0) || 1;

    const hour = time.getHours();
    const greeting      = hour < 5 ? 'Good Night' : hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetingEmoji = hour < 5 ? '🌙' : hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';

    const statusStyle = {
        BOOKED:    { bg:'#fef9c3', color:'#854d0e', dot:'#eab308' },
        CONFIRMED: { bg:'#dcfce7', color:'#14532d', dot:'#22c55e' },
        COMPLETED: { bg:'#f1f5f9', color:'#374151', dot:'#94a3b8' },
        CANCELLED: { bg:'#fee2e2', color:'#7f1d1d', dot:'#ef4444' },
    };

    const sparkTrend = weekData.map(d => d.value);

    const statCards = [
        { icon:'📅', label:'Today',     value: today.length,      color:'#60a5fa', border:'rgba(96,165,250,.4)'   },
        { icon:'📆', label:'Upcoming',  value: upcoming.length,   color:'#c084fc', border:'rgba(192,132,252,.4)'  },
        { icon:'⏳', label:'Pending',   value: pending.length,    color:'#fbbf24', border:'rgba(251,191,36,.4)'   },
        { icon:'✅', label:'Completed', value: completed.length,  color:'#34d399', border:'rgba(52,211,153,.4)'   },
        { icon:'❌', label:'Cancelled', value: cancelled.length,  color:'#f87171', border:'rgba(248,113,113,.4)'  },
    ];

    const recentAppts = [...appointments]
        .sort((a,b) => new Date(b.appointmentTime) - new Date(a.appointmentTime))
        .slice(0, 8);

    const avatarPalette = [
        ['#EFF6FF','#185FA5'], ['#FDF4FF','#7e22ce'], ['#FFF7ED','#c2410c'],
        ['#F0FDF4','#15803d'], ['#FEF2F2','#dc2626'], ['#F0F9FF','#0369a1'],
    ];

    return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:'#eef2f7', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@600;700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:.3} }
                .sc { animation:fadeUp .4s ease both }
                .sc:nth-child(1){animation-delay:.05s}
                .sc:nth-child(2){animation-delay:.10s}
                .sc:nth-child(3){animation-delay:.15s}
                .sc:nth-child(4){animation-delay:.20s}
                .sc:nth-child(5){animation-delay:.25s}
                .qa:hover      { transform:translateY(-3px)!important; box-shadow:0 12px 30px rgba(0,0,0,.12)!important; }
                .appt-tr:hover { background:#f0f6ff!important; cursor:pointer; }
                .hbtn:hover    { background:rgba(255,255,255,.22)!important; }
            `}</style>

            {/* ══════════ HERO ══════════ */}
            <div style={{
                background:'linear-gradient(135deg,#0a2342 0%,#0f3460 50%,#185FA5 100%)',
                padding:'24px 32px 36px',
                position:'relative', overflow:'hidden', flexShrink:0,
            }}>
                <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'rgba(255,255,255,.04)', top:-90, right:-60, pointerEvents:'none' }}/>
                <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.03)', top:30, right:200, pointerEvents:'none' }}/>
                <div style={{ position:'absolute', width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,.03)', bottom:-30, left:100, pointerEvents:'none' }}/>

                {/* top row */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', marginBottom:'28px', animation:'fadeIn .5s ease' }}>
                    <div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'6px' }}>
                            {greetingEmoji} {greeting}
                        </div>
                        {/* ✅ FIXED — only one "Dr." prefix */}
                        <div style={{ fontSize:'28px', fontWeight:700, color:'#fff', fontFamily:"'Lora',serif", lineHeight:1.1, marginBottom:'6px' }}>
                            Dr. {doctorFullName}
                        </div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.4)', display:'flex', alignItems:'center', gap:'8px', fontVariantNumeric:'tabular-nums' }}>
                            <span>{time.toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}</span>
                            <span style={{ opacity:.4 }}>·</span>
                            <span>{time.toLocaleTimeString('en-IN',{ hour:'2-digit', minute:'2-digit', second:'2-digit' })}</span>
                        </div>
                        {(doctor?.specialization || doctor?.departments?.[0]) && (
                            <div style={{ marginTop:'10px', display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', padding:'4px 14px', borderRadius:'20px', fontSize:'10px', color:'rgba(255,255,255,.75)', fontWeight:600 }}>
                                🩺 {doctor.specialization}{doctor?.departments?.[0] ? ` · ${doctor.departments[0]}` : ''}
                            </div>
                        )}
                    </div>
                    <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                        <button className="hbtn" onClick={() => navigate('/doctor/availability')} style={{ padding:'9px 18px', borderRadius:'10px', border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all .18s', backdropFilter:'blur(8px)' }}>
                            ⏰ Availability
                        </button>
                        <button className="hbtn" onClick={() => navigate('/doctor/appointments')} style={{ padding:'9px 18px', borderRadius:'10px', border:'1px solid rgba(96,165,250,.4)', background:'rgba(96,165,250,.15)', color:'#93c5fd', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all .18s', backdropFilter:'blur(8px)' }}>
                            📅 Appointments
                        </button>
                    </div>
                </div>

                {/* stat cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'12px', position:'relative' }}>
                    {statCards.map(c => (
                        <div key={c.label} className="sc" style={{
                            background:'rgba(255,255,255,.09)',
                            backdropFilter:'blur(16px)',
                            border:`1px solid ${c.border}`,
                            borderRadius:'16px', padding:'16px 18px',
                        }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                                <span style={{ fontSize:'22px' }}>{c.icon}</span>
                                <Sparkline values={sparkTrend} color={c.color}/>
                            </div>
                            <div style={{ fontSize:'32px', fontWeight:800, color:c.color, lineHeight:1, letterSpacing:'-1px' }}>
                                {loading
                                    ? <span style={{ animation:'blink 1.4s infinite', display:'inline-block' }}>—</span>
                                    : c.value}
                            </div>
                            <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)', marginTop:'5px', fontWeight:500 }}>
                                {c.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════ BODY ══════════ */}
            <div style={{ flex:1, padding:'22px 32px', display:'flex', flexDirection:'column', gap:'18px' }}>

                {/* Quick Actions */}
                <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:'10px' }}>Quick Actions</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px' }}>
                        {[
                            { icon:'💊', label:'Prescriptions',   sub:'Write & manage',  to:'/doctor/prescriptions', bg:'#e0f2fe' },
                            { icon:'📋', label:'Medical Records', sub:'Patient history',  to:'/doctor/records',       bg:'#ede9fe' },
                            { icon:'⏰', label:'Availability',    sub:'Set your slots',   to:'/doctor/availability',  bg:'#fef3c7' },
                            { icon:'💊', label:'Medicines',       sub:'Drug database',    to:'/doctor/medicines',     bg:'#d1fae5' },
                        ].map(q => (
                            <button key={q.label} className="qa" onClick={() => navigate(q.to)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'15px 18px', borderRadius:'14px', border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', transition:'all .2s', boxShadow:'0 1px 4px rgba(0,0,0,.04)', textAlign:'left' }}>
                                <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:q.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>{q.icon}</div>
                                <div>
                                    <div style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{q.label}</div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'2px' }}>{q.sub}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart + Status */}
                <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:'14px' }}>
                    <div style={{ background:'linear-gradient(135deg,#0f2744,#1a3a5c)', borderRadius:'18px', padding:'22px 24px', border:'1px solid rgba(96,165,250,.15)', boxShadow:'0 4px 24px rgba(15,39,68,.25)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' }}>
                            <div>
                                <div style={{ fontSize:'15px', fontWeight:700, color:'#fff', marginBottom:'3px' }}>Weekly Appointments</div>
                                <div style={{ fontSize:'11px', color:'rgba(255,255,255,.4)' }}>Last 7 days activity</div>
                            </div>
                            <div style={{ background:'rgba(96,165,250,.15)', border:'1px solid rgba(96,165,250,.25)', borderRadius:'8px', padding:'5px 12px', fontSize:'12px', fontWeight:700, color:'#60a5fa' }}>
                                Total: {weekData.reduce((s,d)=>s+d.value,0)}
                            </div>
                        </div>
                        <WeeklyChart data={weekData} color="#60a5fa"/>
                    </div>

                    <div style={{ background:'#fff', borderRadius:'18px', padding:'22px 24px', border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
                        <div style={{ fontSize:'15px', fontWeight:700, color:'#0f172a', marginBottom:'3px' }}>Appointment Status</div>
                        <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'20px' }}>All-time breakdown</div>
                        {statusData.map(d => (
                            <div key={d.label} style={{ marginBottom:'16px' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                                    <span style={{ fontSize:'12px', fontWeight:600, color:'#374151', display:'flex', alignItems:'center', gap:'7px' }}>
                                        <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:d.color, display:'inline-block' }}/>
                                        {d.label}
                                    </span>
                                    <span style={{ fontSize:'12px', fontWeight:700, color:'#0f172a' }}>{d.value}</span>
                                </div>
                                <div style={{ background:'#f1f5f9', borderRadius:'99px', height:'8px', overflow:'hidden' }}>
                                    <div style={{ height:'100%', borderRadius:'99px', background:d.color, width:`${(d.value/totalForPie)*100}%`, transition:'width .7s ease', minWidth: d.value > 0 ? '8px' : '0' }}/>
                                </div>
                            </div>
                        ))}
                        <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px dashed #f1f5f9', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', textAlign:'center' }}>
                            {[
                                { val: appointments.length, label:'Total',        color:'#0f172a' },
                                { val: `${appointments.length ? Math.round((completed.length/appointments.length)*100) : 0}%`, label:'Success Rate', color:'#34d399' },
                                { val: upcoming.length,     label:'Upcoming',     color:'#185FA5' },
                            ].map(s => (
                                <div key={s.label}>
                                    <div style={{ fontSize:'22px', fontWeight:800, color:s.color }}>{s.val}</div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'2px' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Appointments Table */}
                <div style={{ background:'#fff', borderRadius:'18px', border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden', animation:'fadeUp .4s .3s ease both' }}>
                    <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                            <div style={{ fontSize:'15px', fontWeight:700, color:'#0f172a' }}>Recent Appointments</div>
                            <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>Latest patient visits</div>
                        </div>
                        <button onClick={() => navigate('/doctor/appointments')} style={{ padding:'8px 16px', borderRadius:'9px', border:'1px solid #e2e8f0', background:'#f8fafc', color:'#185FA5', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                            View All →
                        </button>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1fr 1fr', padding:'9px 24px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                        {['Patient','Reason','Date & Time','Status','Action'].map(h => (
                            <div key={h} style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</div>
                        ))}
                    </div>
                    {loading ? (
                        <div style={{ padding:'48px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>
                            <div style={{ fontSize:'28px', marginBottom:'10px' }}>⏳</div>Loading appointments...
                        </div>
                    ) : recentAppts.length === 0 ? (
                        <div style={{ padding:'56px 20px', textAlign:'center' }}>
                            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🗓️</div>
                            <div style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>No appointments yet</div>
                        </div>
                    ) : recentAppts.map((appt, idx) => {
                        const sc  = statusStyle[appt.status] || statusStyle.BOOKED;
                        const [bg, tc] = avatarPalette[idx % avatarPalette.length];
                        const ini = appt.patientName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
                        const dt  = new Date(appt.appointmentTime);
                        return (
                            <div key={appt.id} className="appt-tr"
                                 style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1fr 1fr', padding:'12px 24px', borderBottom:'1px solid #f8fafc', alignItems:'center', transition:'background .12s' }}
                                 onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
                            >
                                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                    <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:bg, color:tc, fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{ini}</div>
                                    <div>
                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{appt.patientName || '—'}</div>
                                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>#{appt.id}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize:'12px', color:'#475569', paddingRight:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                    {appt.reason || 'General Consultation'}
                                </div>
                                <div>
                                    <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>
                                        {dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                                    </div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px' }}>
                                        {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                                    </div>
                                </div>
                                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:sc.bg, color:sc.color, padding:'3px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:600, width:'fit-content' }}>
                                    <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:sc.dot, flexShrink:0 }}/>
                                    {appt.status}
                                </span>
                                <div>
                                    {(appt.status === 'BOOKED' || appt.status === 'CONFIRMED') && (
                                        <button onClick={e => { e.stopPropagation(); navigate(`/doctor/appointments/${appt.id}/prescription`); }}
                                                style={{ padding:'5px 11px', borderRadius:'7px', border:'none', background:'#EFF6FF', color:'#185FA5', fontSize:'10px', fontWeight:600, cursor:'pointer' }}>
                                            💊 Prescribe
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}