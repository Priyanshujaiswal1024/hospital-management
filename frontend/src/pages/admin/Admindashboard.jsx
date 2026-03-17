import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function BarChart({ data, color='#185FA5' }) {
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
            const bh = Math.max(((d.value / max) * (H - 36)), 4);
            const x = 10 + i * barW + barW * .12;
            const y = H - 22 - bh;
            const bwA = barW * .76;
            const r = Math.min(5, bwA / 2);
            const grad = ctx.createLinearGradient(0, y, 0, H - 22);
            grad.addColorStop(0, color);
            grad.addColorStop(1, color + '33');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + bwA - r, y);
            ctx.quadraticCurveTo(x + bwA, y, x + bwA, y + r);
            ctx.lineTo(x + bwA, H - 22);
            ctx.lineTo(x, H - 22);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,.4)';
            ctx.font = '10px DM Sans,sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + bwA / 2, H - 6);
            if (d.value > 0) {
                ctx.fillStyle = color;
                ctx.font = 'bold 10px DM Sans,sans-serif';
                ctx.fillText(d.value, x + bwA / 2, y - 5);
            }
        });
    }, [data, color]);
    return (
        <canvas ref={ref} width={500} height={140}
                style={{ width:'100%', height:'140px' }}/>
    );
}

function DonutChart({ segments, size=120 }) {
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    const cx = size / 2, cy = size / 2;
    const r = size * .38, innerR = size * .25;
    const paths = segments.map(seg => {
        const slice = (seg.value / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += slice;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const ix1 = cx + innerR * Math.cos(angle - slice);
        const iy1 = cy + innerR * Math.sin(angle - slice);
        const ix2 = cx + innerR * Math.cos(angle);
        const iy2 = cy + innerR * Math.sin(angle);
        const lg = slice > Math.PI ? 1 : 0;
        return {
            ...seg,
            d: `M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix2},${iy2} A${innerR},${innerR} 0 ${lg},0 ${ix1},${iy1} Z`,
        };
    });
    const completed = segments[0]?.value || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {paths.map((p, i) => <path key={i} d={p.d} fill={p.color}/>)}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14"
                  fontWeight="700" fill="#0f172a">{pct}%</text>
            <text x={cx} y={cy + 10} textAnchor="middle"
                  fontSize="7" fill="#94a3b8">Success</text>
        </svg>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats,    setStats]    = useState(null);
    const [doctors,  setDoctors]  = useState([]);
    const [appts,    setAppts]    = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [time,     setTime]     = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        Promise.all([
            api.get('/admin/dashboard'),
            api.get('/admin/doctors', { params:{ page:0, size:5 } }),
            api.get('/admin/appointments', { params:{ page:0, size:200 } }),
            api.get('/medicines/low-stock'),
        ]).then(([s, d, a, ls]) => {
            setStats(s.data);
            setDoctors(d.data || []);
            setAppts(a.data?.content || a.data || []);
            setLowStock(ls.data || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const hour = time.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const greetIcon = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

    // ✅ Real weekly data from actual appointments
    const weekData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ds = d.toDateString();
        const count = appts.filter(a =>
            new Date(a.appointmentTime).toDateString() === ds
        ).length;
        return {
            label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
            value: count,
        };
    });

    const donutSegments = [
        { label:'Completed', value: stats?.completedAppointments || 0, color:'#22c55e' },
        { label:'Booked',    value: stats?.bookedAppointments    || 0, color:'#3b82f6' },
        { label:'Confirmed', value: stats?.confirmedAppointments || 0, color:'#a78bfa' },
        { label:'Cancelled', value: stats?.cancelledAppointments || 0, color:'#f87171' },
    ];

    // ✅ Helper — no double Dr.
    function safeName(name) {
        if (!name) return '—';
        return name.toLowerCase().startsWith('dr') ? name : `Dr. ${name}`;
    }

    // ✅ Helper — safe departments
    function safeDepts(departments) {
        if (!departments) return '—';
        const arr = [...departments].filter(
            d => typeof d === 'string' && !d.includes('@') && !d.includes('.')
        );
        return arr.length > 0 ? arr.join(', ') : '—';
    }

    const statCards = [
        { icon:'👨‍⚕️', label:'Total Doctors',   value: stats?.totalDoctors,           color:'#3b82f6', to:'/admin/doctors'       },
        { icon:'🧑',   label:'Total Patients',  value: stats?.totalPatients,          color:'#8b5cf6', to:'/admin/patients'      },
        { icon:'💰',   label:'Total Revenue',   value: stats?.totalRevenue != null ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}` : '₹0', color:'#059669', to:'/admin/bills' },
        { icon:'📅',   label:"Today's Appts",   value: stats?.todayAppointments,      color:'#f59e0b', to:'/admin/appointments'  },
        { icon:'🏥',   label:'Departments',     value: stats?.totalDepartments,       color:'#06b6d4', to:'/admin/departments'   },
        { icon:'💊',   label:'Low Stock',       value: stats?.lowStockMedicineCount,  color:'#ef4444', to:'/admin/medicines'     },
    ];

    const colors = [
        ['#EFF6FF','#185FA5'],['#FDF4FF','#7e22ce'],
        ['#F0FDF4','#15803d'],['#FFF7ED','#c2410c'],['#FEF2F2','#dc2626'],
    ];

    return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:'100%',
            background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@700&display=swap');
                @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
                .sc{animation:fadeUp .4s ease both}
                .sc:nth-child(1){animation-delay:.05s}.sc:nth-child(2){animation-delay:.10s}
                .sc:nth-child(3){animation-delay:.15s}.sc:nth-child(4){animation-delay:.20s}
                .sc:nth-child(5){animation-delay:.25s}.sc:nth-child(6){animation-delay:.30s}
                .qa:hover{transform:translateY(-3px)!important;box-shadow:0 12px 30px rgba(0,0,0,.1)!important}
                .qa{transition:all .2s}
                .drow:hover{background:#f8faff!important}
                .ls-row:hover{background:#fff7ed!important}
                .sc-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)!important;cursor:pointer}
                .sc-card{transition:all .2s}
            `}</style>

            {/* HERO */}
            <div style={{ background:'linear-gradient(135deg,#0a2342 0%,#0f3460 50%,#185FA5 100%)',
                padding:'22px 32px 34px', position:'relative', overflow:'hidden',
                flexShrink:0 }}>
                <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
                    background:'rgba(255,255,255,.04)', top:-80, right:-60,
                    pointerEvents:'none' }}/>
                <div style={{ position:'absolute', width:160, height:160, borderRadius:'50%',
                    background:'rgba(255,255,255,.03)', bottom:-40, left:120,
                    pointerEvents:'none' }}/>

                <div style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'flex-start', position:'relative',
                    marginBottom:'26px', animation:'fadeIn .5s ease' }}>
                    <div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.5)',
                            fontWeight:600, letterSpacing:'.1em',
                            textTransform:'uppercase', marginBottom:'5px' }}>
                            {greetIcon} {greeting}
                        </div>
                        <div style={{ fontSize:'26px', fontWeight:700, color:'#fff',
                            fontFamily:"'Lora',serif", lineHeight:1.1,
                            marginBottom:'5px' }}>
                            Admin Dashboard
                        </div>
                        <div style={{ fontSize:'11px', color:'rgba(255,255,255,.4)',
                            display:'flex', alignItems:'center', gap:'8px' }}>
                            <span>{time.toLocaleDateString('en-IN',{
                                weekday:'long', day:'numeric',
                                month:'long', year:'numeric',
                            })}</span>
                            <span style={{ opacity:.4 }}>·</span>
                            <span style={{ fontVariantNumeric:'tabular-nums' }}>
                                {time.toLocaleTimeString('en-IN',{
                                    hour:'2-digit', minute:'2-digit', second:'2-digit',
                                })}
                            </span>
                            <span style={{ opacity:.4 }}>·</span>
                            <span style={{ color:'#4ade80' }}>● All systems operational</span>
                        </div>
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={() => navigate('/admin/doctors')} style={{
                            padding:'9px 18px', borderRadius:'10px',
                            border:'1px solid rgba(255,255,255,.2)',
                            background:'rgba(255,255,255,.1)', color:'#fff',
                            fontSize:'12px', fontWeight:600, cursor:'pointer',
                            backdropFilter:'blur(8px)' }}>
                            + Add Doctor
                        </button>
                        <button onClick={() => navigate('/admin/appointments')} style={{
                            padding:'9px 18px', borderRadius:'10px',
                            border:'1px solid rgba(96,165,250,.4)',
                            background:'rgba(96,165,250,.15)', color:'#93c5fd',
                            fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                            📅 Appointments
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)',
                    gap:'10px', position:'relative' }}>
                    {statCards.map(c => (
                        <div key={c.label} className="sc sc-card"
                             onClick={() => navigate(c.to)}
                             style={{ background:'rgba(255,255,255,.09)',
                                 backdropFilter:'blur(16px)',
                                 border:'1px solid rgba(255,255,255,.12)',
                                 borderRadius:'14px', padding:'14px 16px',
                                 boxShadow:'0 1px 4px rgba(0,0,0,.1)' }}>
                            <div style={{ fontSize:'20px', marginBottom:'8px' }}>
                                {c.icon}
                            </div>
                            <div style={{ fontSize:'24px', fontWeight:800,
                                color:'#fff', lineHeight:1, letterSpacing:'-1px' }}>
                                {loading
                                    ? <span style={{ animation:'blink 1.4s infinite',
                                        display:'inline-block', fontSize:'14px' }}>—</span>
                                    : c.value ?? 0}
                            </div>
                            <div style={{ fontSize:'10px',
                                color:'rgba(255,255,255,.5)',
                                marginTop:'4px', fontWeight:500 }}>
                                {c.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BODY */}
            <div style={{ flex:1, padding:'20px 32px',
                display:'flex', flexDirection:'column', gap:'16px' }}>

                {/* Quick Actions */}
                <div>
                    <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8',
                        letterSpacing:'.09em', textTransform:'uppercase',
                        marginBottom:'10px' }}>
                        Quick Actions
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                        gap:'10px' }}>
                        {[
                            { icon:'👨‍⚕️', label:'Add Doctor',     sub:'Register new doctor',   to:'/admin/doctors',      bg:'#eff6ff' },
                            { icon:'🏥',   label:'Add Department', sub:'Create department',      to:'/admin/departments',  bg:'#ecfeff' },
                            { icon:'💊',   label:'Add Medicine',   sub:'Add to formulary',       to:'/admin/medicines',    bg:'#f0fdf4' },
                            { icon:'💰',   label:'View Bills',     sub:'Manage payments',        to:'/admin/bills',        bg:'#fffbeb' },
                        ].map(q => (
                            <button key={q.label} className="qa"
                                    onClick={() => navigate(q.to)} style={{
                                display:'flex', alignItems:'center', gap:'12px',
                                padding:'15px 18px', borderRadius:'14px',
                                border:'1px solid #e2e8f0', background:'#fff',
                                cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,.04)',
                                textAlign:'left',
                            }}>
                                <div style={{ width:'42px', height:'42px',
                                    borderRadius:'12px', background:q.bg,
                                    display:'flex', alignItems:'center',
                                    justifyContent:'center', fontSize:'22px',
                                    flexShrink:0 }}>
                                    {q.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize:'13px', fontWeight:700,
                                        color:'#0f172a' }}>{q.label}</div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8',
                                        marginTop:'2px' }}>{q.sub}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Charts Row */}
                <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:'14px' }}>

                    {/* ✅ Real weekly data */}
                    <div style={{ background:'#fff', borderRadius:'18px',
                        padding:'22px 24px', border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                            alignItems:'flex-start', marginBottom:'18px' }}>
                            <div>
                                <div style={{ fontSize:'15px', fontWeight:700,
                                    color:'#0f172a', marginBottom:'3px' }}>
                                    This Week — Appointments
                                </div>
                                <div style={{ fontSize:'11px', color:'#94a3b8' }}>
                                    Daily appointment count
                                </div>
                            </div>
                            <div style={{ background:'#EFF6FF',
                                border:'1px solid #bfdbfe', borderRadius:'8px',
                                padding:'5px 12px', fontSize:'12px',
                                fontWeight:700, color:'#185FA5' }}>
                                Total: {weekData.reduce((s, d) => s + d.value, 0)}
                            </div>
                        </div>
                        <BarChart data={weekData} color="#185FA5"/>
                    </div>

                    {/* Donut */}
                    <div style={{ background:'#fff', borderRadius:'18px',
                        padding:'22px 24px', border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)' }}>
                        <div style={{ fontSize:'15px', fontWeight:700,
                            color:'#0f172a', marginBottom:'3px' }}>
                            Appointment Status
                        </div>
                        <div style={{ fontSize:'11px', color:'#94a3b8',
                            marginBottom:'16px' }}>All-time breakdown</div>
                        <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
                            <DonutChart segments={donutSegments} size={110}/>
                            <div style={{ flex:1 }}>
                                {donutSegments.map(s => (
                                    <div key={s.label} style={{ display:'flex',
                                        justifyContent:'space-between',
                                        alignItems:'center', marginBottom:'8px' }}>
                                        <span style={{ fontSize:'12px', color:'#374151',
                                            display:'flex', alignItems:'center', gap:'6px' }}>
                                            <span style={{ width:'8px', height:'8px',
                                                borderRadius:'50%', background:s.color,
                                                display:'inline-block' }}/>
                                            {s.label}
                                        </span>
                                        <span style={{ fontSize:'12px', fontWeight:700,
                                            color:'#0f172a' }}>
                                            {loading ? '—' : s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                    gap:'14px' }}>

                    {/* Doctors */}
                    <div style={{ background:'#fff', borderRadius:'18px',
                        border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>
                        <div style={{ padding:'16px 18px', borderBottom:'1px solid #f1f5f9',
                            display:'flex', justifyContent:'space-between',
                            alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:'14px', fontWeight:700,
                                    color:'#0f172a' }}>Doctors</div>
                                <div style={{ fontSize:'10px', color:'#94a3b8',
                                    marginTop:'1px' }}>Recently added</div>
                            </div>
                            <button onClick={() => navigate('/admin/doctors')} style={{
                                fontSize:'11px', color:'#185FA5', fontWeight:600,
                                cursor:'pointer', border:'none', background:'none' }}>
                                View all →
                            </button>
                        </div>
                        {loading
                            ? <div style={{ padding:'30px', textAlign:'center',
                                color:'#94a3b8', fontSize:'12px' }}>Loading...</div>
                            : doctors.slice(0, 5).map((d, idx) => {
                                const [bg, tc] = colors[idx % colors.length];
                                const ini = d.name?.split(' ')
                                    .map(n => n[0]).join('').slice(0,2).toUpperCase() || '??';
                                return (
                                    <div key={d.id} className="drow" style={{
                                        display:'flex', alignItems:'center', gap:'9px',
                                        padding:'10px 18px',
                                        borderBottom:'1px solid #f8fafc',
                                        transition:'background .12s' }}>
                                        <div style={{ width:'32px', height:'32px',
                                            borderRadius:'9px', background:bg, color:tc,
                                            fontSize:'10px', fontWeight:700,
                                            display:'flex', alignItems:'center',
                                            justifyContent:'center', flexShrink:0 }}>
                                            {ini}
                                        </div>
                                        <div style={{ flex:1, minWidth:0 }}>
                                            {/* ✅ No double Dr. */}
                                            <div style={{ fontSize:'12px', fontWeight:600,
                                                color:'#0f172a', overflow:'hidden',
                                                textOverflow:'ellipsis',
                                                whiteSpace:'nowrap' }}>
                                                {safeName(d.name)}
                                            </div>
                                            {/* ✅ Safe departments */}
                                            <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                                {d.specialization || safeDepts(d.departments)}
                                            </div>
                                        </div>
                                        <div style={{ fontSize:'11px', fontWeight:600,
                                            color:'#059669' }}>
                                            ₹{d.consultationFee || '—'}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Today's Appointments */}
                    <div style={{ background:'#fff', borderRadius:'18px',
                        border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>
                        <div style={{ padding:'16px 18px', borderBottom:'1px solid #f1f5f9',
                            display:'flex', justifyContent:'space-between',
                            alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:'14px', fontWeight:700,
                                    color:'#0f172a' }}>Today's Appointments</div>
                                <div style={{ fontSize:'10px', color:'#94a3b8',
                                    marginTop:'1px' }}>
                                    {new Date().toLocaleDateString('en-IN',{
                                        day:'numeric', month:'short',
                                    })}
                                </div>
                            </div>
                            <span style={{ background:'#EFF6FF', color:'#185FA5',
                                padding:'3px 10px', borderRadius:'20px',
                                fontSize:'11px', fontWeight:700 }}>
                                {loading ? '—' : stats?.todayAppointments || 0}
                            </span>
                        </div>
                        <div style={{ padding:'16px 18px', display:'flex',
                            flexDirection:'column', alignItems:'center',
                            justifyContent:'center', minHeight:'160px', gap:'8px' }}>
                            <div style={{ fontSize:'52px', fontWeight:800,
                                color:'#185FA5', lineHeight:1 }}>
                                {loading ? '—' : stats?.todayAppointments || 0}
                            </div>
                            <div style={{ fontSize:'12px', color:'#94a3b8' }}>
                                appointments today
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                                gap:'8px', width:'100%', marginTop:'8px' }}>
                                <div style={{ background:'#f0fdf4', borderRadius:'10px',
                                    padding:'8px', textAlign:'center' }}>
                                    <div style={{ fontSize:'18px', fontWeight:700,
                                        color:'#059669' }}>
                                        {loading ? '—' : stats?.completedAppointments || 0}
                                    </div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                        Completed
                                    </div>
                                </div>
                                <div style={{ background:'#fffbeb', borderRadius:'10px',
                                    padding:'8px', textAlign:'center' }}>
                                    <div style={{ fontSize:'18px', fontWeight:700,
                                        color:'#d97706' }}>
                                        {loading ? '—'
                                            : (stats?.bookedAppointments || 0)
                                            + (stats?.confirmedAppointments || 0)}
                                    </div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                        Pending
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock */}
                    <div style={{ background:'#fff', borderRadius:'18px',
                        border:'1px solid #e8edf2',
                        boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>
                        <div style={{ padding:'16px 18px', borderBottom:'1px solid #f1f5f9',
                            display:'flex', justifyContent:'space-between',
                            alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:'14px', fontWeight:700,
                                    color:'#0f172a' }}>Low Stock Alert</div>
                                <div style={{ fontSize:'10px', color:'#94a3b8',
                                    marginTop:'1px' }}>
                                    {lowStock.length} items below threshold
                                </div>
                            </div>
                            <button onClick={() => navigate('/admin/medicines')} style={{
                                fontSize:'11px', color:'#ef4444', fontWeight:600,
                                cursor:'pointer', border:'none', background:'none' }}>
                                View all →
                            </button>
                        </div>
                        {lowStock.length === 0 ? (
                            <div style={{ padding:'30px', textAlign:'center',
                                color:'#94a3b8', fontSize:'12px' }}>
                                <div style={{ fontSize:'24px', marginBottom:'6px' }}>✅</div>
                                All medicines in stock
                            </div>
                        ) : lowStock.slice(0, 5).map((m, idx) => (
                            <div key={m.id || idx} className="ls-row" style={{
                                display:'flex', alignItems:'center', gap:'9px',
                                padding:'9px 18px', borderBottom:'1px solid #f8fafc',
                                transition:'background .12s' }}>
                                <div style={{ width:'28px', height:'28px',
                                    borderRadius:'8px', background:'#fef2f2',
                                    display:'flex', alignItems:'center',
                                    justifyContent:'center', fontSize:'14px',
                                    flexShrink:0 }}>💊</div>
                                <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:'11px', fontWeight:600,
                                        color:'#0f172a', overflow:'hidden',
                                        textOverflow:'ellipsis',
                                        whiteSpace:'nowrap' }}>{m.name}</div>
                                    <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                        {m.type}
                                    </div>
                                </div>
                                <span style={{
                                    background: m.stock <= 5 ? '#fee2e2' : '#fef9c3',
                                    color: m.stock <= 5 ? '#dc2626' : '#854d0e',
                                    padding:'2px 7px', borderRadius:'6px',
                                    fontSize:'10px', fontWeight:700,
                                }}>
                                    {m.stock} left
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}