import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

/* ─── Bar Chart ──────────────────────────────────────────────────── */
function BarChart({ data, color = '#185FA5' }) {
    const ref     = useRef();
    const [hov, setHov] = useState(null);

    const draw = useCallback(() => {
        const canvas = ref.current;
        if (!canvas || !data?.length) return;
        const ctx  = canvas.getContext('2d');
        const dpr  = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        ctx.clearRect(0, 0, W, H);
        const max  = Math.max(...data.map(d => d.value), 1);
        const barW = (W - 24) / data.length;
        data.forEach((d, i) => {
            const bh  = Math.max(((d.value / max) * (H - 40)), 4);
            const x   = 12 + i * barW + barW * .1;
            const bwA = barW * .8;
            const y   = H - 24 - bh;
            const r   = Math.min(6, bwA / 2);
            const hi  = hov === i;
            const grad = ctx.createLinearGradient(0, y, 0, H - 24);
            grad.addColorStop(0, hi ? '#2563eb' : color);
            grad.addColorStop(1, (hi ? '#2563eb' : color) + '22');
            ctx.fillStyle = grad;
            if (hi) { ctx.shadowColor = color + '66'; ctx.shadowBlur = 12; }
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + bwA - r, y);
            ctx.quadraticCurveTo(x + bwA, y, x + bwA, y + r);
            ctx.lineTo(x + bwA, H - 24);
            ctx.lineTo(x, H - 24);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = hi ? '#1e40af' : 'rgba(0,0,0,.38)';
            ctx.font = `${hi ? 'bold ' : ''}10px DM Sans,sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + bwA / 2, H - 6);
            if (d.value > 0) {
                ctx.fillStyle = hi ? '#1e40af' : color;
                ctx.font = 'bold 10px DM Sans,sans-serif';
                ctx.fillText(d.value, x + bwA / 2, y - 5);
            }
        });
    }, [data, color, hov]);

    useEffect(() => {
        draw();
        const ro = new ResizeObserver(draw);
        if (ref.current) ro.observe(ref.current);
        return () => ro.disconnect();
    }, [draw]);

    function onMouseMove(e) {
        const rect = ref.current.getBoundingClientRect();
        const barW = (rect.width - 24) / (data?.length || 1);
        const idx  = Math.floor((e.clientX - rect.left - 12) / barW);
        setHov(idx >= 0 && idx < (data?.length||0) ? idx : null);
    }

    return (
        <canvas ref={ref} onMouseMove={onMouseMove} onMouseLeave={() => setHov(null)}
                style={{ width:'100%', height:'130px', cursor:'crosshair', display:'block' }}/>
    );
}

/* ─── Donut Chart ────────────────────────────────────────────────── */
function DonutChart({ segments, size = 110 }) {
    const [hov, setHov] = useState(null);
    const total = segments.reduce((s, d) => s + d.value, 0) || 1;
    let angle   = -Math.PI / 2;
    const cx = size / 2, cy = size / 2;
    const r  = size * .38, inner = size * .26;
    const paths = segments.map((seg, idx) => {
        const slice = (seg.value / total) * Math.PI * 2;
        const rr  = hov === idx ? r * 1.07 : r;
        const x1  = cx + rr * Math.cos(angle),  y1  = cy + rr * Math.sin(angle);
        angle += slice;
        const x2  = cx + rr * Math.cos(angle),  y2  = cy + rr * Math.sin(angle);
        const ix1 = cx + inner * Math.cos(angle - slice), iy1 = cy + inner * Math.sin(angle - slice);
        const ix2 = cx + inner * Math.cos(angle),         iy2 = cy + inner * Math.sin(angle);
        const lg  = slice > Math.PI ? 1 : 0;
        return { ...seg, idx, d: `M${x1},${y1} A${rr},${rr} 0 ${lg},1 ${x2},${y2} L${ix2},${iy2} A${inner},${inner} 0 ${lg},0 ${ix1},${iy1} Z` };
    });
    const hovSeg = hov !== null ? segments[hov] : null;
    const pct    = hovSeg ? Math.round((hovSeg.value/total)*100) : Math.round(((segments[0]?.value||0)/total)*100);
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow:'visible', flexShrink:0 }}>
            {paths.map(p => (
                <path key={p.idx} d={p.d} fill={p.color} style={{ cursor:'pointer', transition:'all .18s' }}
                      onMouseEnter={()=>setHov(p.idx)} onMouseLeave={()=>setHov(null)}/>
            ))}
            <text x={cx} y={cy-5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">{pct}%</text>
            <text x={cx} y={cy+9} textAnchor="middle" fontSize="7"  fill="#94a3b8">{hovSeg?.label||'Completed'}</text>
        </svg>
    );
}

/* ─── Animated Counter ───────────────────────────────────────────── */
function Counter({ value }) {
    const [n, setN] = useState(0);
    const raf = useRef();
    useEffect(() => {
        const target = typeof value === 'number' ? value : 0;
        const start  = Date.now();
        function step() {
            const p = Math.min((Date.now()-start)/900, 1);
            setN(Math.round((1-Math.pow(1-p,3))*target));
            if (p < 1) raf.current = requestAnimationFrame(step);
        }
        raf.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf.current);
    }, [value]);
    return <>{n.toLocaleString('en-IN')}</>;
}

/* ─── Sparkline ──────────────────────────────────────────────────── */
function Sparkline({ data, color }) {
    if (!data?.length) return null;
    const max = Math.max(...data,1), min = Math.min(...data,0);
    const W = 56, H = 22;
    const pts = data.map((v,i) => `${(i/(data.length-1))*W},${H-((v-min)/(max-min||1))*H}`).join(' ');
    return (
        <svg width={W} height={H} style={{ display:'block', flexShrink:0 }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round" opacity=".65"/>
        </svg>
    );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function Skel({ w, h, r = 8 }) {
    return <div style={{ width:w, height:h, borderRadius:r, background:'linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)', backgroundSize:'200% auto', animation:'shimmer 1.4s linear infinite', flexShrink:0 }}/>;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════ */
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
            api.get('/admin/doctors',      { params:{ page:0, size:5 } }),
            api.get('/admin/appointments', { params:{ page:0, size:200 } }),
            api.get('/medicines/low-stock'),
        ]).then(([s,d,a,ls]) => {
            setStats(s.data);
            setDoctors(d.data || []);
            setAppts(a.data?.content || a.data || []);
            setLowStock(ls.data || []);
        }).catch(()=>{}).finally(()=>setLoading(false));
    }, []);

    const hour     = time.getHours();
    const greeting = hour<12?'Good Morning':hour<17?'Good Afternoon':'Good Evening';
    const greetIcon= hour<12?'🌅':hour<17?'☀️':'🌙';

    const weekData = Array.from({length:7},(_,i) => {
        const d = new Date(); d.setDate(d.getDate()-(6-i));
        return { label:d.toLocaleDateString('en-IN',{weekday:'short'}), value:appts.filter(a=>new Date(a.appointmentTime).toDateString()===d.toDateString()).length };
    });

    const donutSegs = [
        { label:'Completed', value:stats?.completedAppointments||0, color:'#22c55e' },
        { label:'Booked',    value:stats?.bookedAppointments||0,    color:'#3b82f6' },
        { label:'Confirmed', value:stats?.confirmedAppointments||0, color:'#a78bfa' },
        { label:'Cancelled', value:stats?.cancelledAppointments||0, color:'#f87171' },
    ];

    const statCards = [
        { icon:'👨‍⚕️', label:'Total Doctors',  raw:stats?.totalDoctors,          display:null,  color:'#3b82f6', border:'rgba(59,130,246,.25)',  bg:'rgba(59,130,246,.13)',  to:'/admin/doctors',      trend:[3,5,4,7,6,8,stats?.totalDoctors||0] },
        { icon:'🧑',   label:'Total Patients', raw:stats?.totalPatients,         display:null,  color:'#8b5cf6', border:'rgba(139,92,246,.25)',  bg:'rgba(139,92,246,.13)',  to:'/admin/patients',     trend:[10,14,12,18,15,20,stats?.totalPatients||0] },
        { icon:'💰',   label:'Revenue',        raw:null, display: stats?.totalRevenue!=null?`₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`:'₹0', color:'#059669', border:'rgba(5,150,105,.25)', bg:'rgba(5,150,105,.13)', to:'/admin/bills', trend:[200,350,280,420,380,500,stats?.totalRevenue||0] },
        { icon:'📅',   label:"Today's Appts",  raw:stats?.todayAppointments,     display:null,  color:'#f59e0b', border:'rgba(245,158,11,.25)',  bg:'rgba(245,158,11,.13)',  to:'/admin/appointments', trend:[2,4,3,5,4,6,stats?.todayAppointments||0] },
        { icon:'🏥',   label:'Departments',    raw:stats?.totalDepartments,      display:null,  color:'#06b6d4', border:'rgba(6,182,212,.25)',   bg:'rgba(6,182,212,.13)',   to:'/admin/departments',  trend:[4,4,5,5,6,6,stats?.totalDepartments||0] },
        { icon:'💊',   label:'Low Stock',      raw:stats?.lowStockMedicineCount, display:null,  color:'#ef4444', border:'rgba(239,68,68,.25)',   bg:'rgba(239,68,68,.13)',   to:'/admin/medicines',    trend:[2,1,3,2,4,3,stats?.lowStockMedicineCount||0] },
    ];

    const quickActions = [
        { icon:'👨‍⚕️', label:'Add Doctor',    sub:'Register new doctor', to:'/admin/doctors',     bg:'#eff6ff' },
        { icon:'🏥',   label:'Department',    sub:'Manage departments',   to:'/admin/departments', bg:'#ecfeff' },
        { icon:'💊',   label:'Medicines',     sub:'Stock & formulary',    to:'/admin/medicines',   bg:'#f0fdf4' },
        { icon:'💰',   label:'Billing',       sub:'Revenue & invoices',   to:'/admin/bills',       bg:'#fffbeb' },
    ];

    const avatarColors = [['#EFF6FF','#185FA5'],['#FDF4FF','#7e22ce'],['#F0FDF4','#15803d'],['#FFF7ED','#c2410c'],['#FEF2F2','#dc2626']];

    function safeName(n) { if(!n) return '—'; return n.toLowerCase().startsWith('dr')?n:`Dr. ${n}`; }
    function safeDept(d) {
        if(!d) return '—';
        const a = [...d].filter(x=>typeof x==='string'&&!x.includes('@')&&!x.includes('.'));
        return a.length>0?a.join(', '):'—';
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif",
            /* KEY: prevent this element from growing wider than its container */
            width:'100%', minWidth:0, boxSizing:'border-box', overflowX:'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@700&display=swap');
                @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
                @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
                @keyframes pdot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }

                /* stat card stagger */
                .adsc { animation:fadeUp .4s ease both; }
                .adsc:nth-child(1){animation-delay:.04s}.adsc:nth-child(2){animation-delay:.08s}
                .adsc:nth-child(3){animation-delay:.12s}.adsc:nth-child(4){animation-delay:.16s}
                .adsc:nth-child(5){animation-delay:.20s}.adsc:nth-child(6){animation-delay:.24s}

                .adsc:hover { transform:translateY(-3px) scale(1.02)!important; cursor:pointer; }
                .adsc { transition:transform .18s,box-shadow .18s; }

                .adqa { transition:transform .18s,box-shadow .18s; cursor:pointer; }
                .adqa:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,.1)!important; }

                .addrow:hover { background:#f0f7ff!important; }
                .adls:hover   { background:#fff7ed!important; }
                .addrow,.adls { transition:background .12s; cursor:pointer; }

                .ad-section { animation:fadeUp .38s ease both; }
                .ad-section:nth-child(1){animation-delay:.08s}
                .ad-section:nth-child(2){animation-delay:.14s}
                .ad-section:nth-child(3){animation-delay:.20s}

                /*
                  KEY RESPONSIVE STRATEGY:
                  Use repeat(auto-fit, minmax(Xpx, 1fr)) so grids
                  collapse automatically based on available width —
                  not based on viewport width (which breaks inside sidebars).
                */
                .ad-stat-grid  { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px; }
                .ad-qa-grid    { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:10px; }
                .ad-chart-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:14px; }
                .ad-bot-grid   { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:14px; }

                /* Hero top row */
                .ad-hero-top { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; flex-wrap:wrap; }
                .ad-hero-btns{ display:flex; gap:8px; flex-shrink:0; flex-wrap:wrap; }
            `}</style>

            {/* ══════════════════════════════════════════════════
                HERO
            ══════════════════════════════════════════════════ */}
            <div style={{
                background:'linear-gradient(140deg,#06152b 0%,#0a2342 35%,#0f3460 68%,#185FA5 100%)',
                padding:'22px 24px 28px', position:'relative', overflow:'hidden', flexShrink:0,
                /* CRITICAL: prevent hero from exceeding container */
                width:'100%', boxSizing:'border-box', minWidth:0,
            }}>
                {/* decorative blobs */}
                <div style={{ position:'absolute',width:300,height:300,borderRadius:'50%',background:'rgba(255,255,255,.03)',top:-90,right:-60,pointerEvents:'none' }}/>
                <div style={{ position:'absolute',width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,.03)',bottom:-50,left:'22%',pointerEvents:'none' }}/>

                {/* top row */}
                <div className="ad-hero-top" style={{ marginBottom:20, animation:'fadeIn .5s ease' }}>
                    <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:10,color:'rgba(255,255,255,.45)',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:4 }}>
                            {greetIcon} {greeting}
                        </div>
                        <div style={{ fontSize:22,fontWeight:700,color:'#fff',fontFamily:"'Lora',serif",lineHeight:1.15,marginBottom:5 }}>
                            Admin Dashboard
                        </div>
                        <div style={{ fontSize:10,color:'rgba(255,255,255,.38)',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
                            <span>{time.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span>
                            <span style={{ opacity:.3 }}>·</span>
                            <span style={{ fontFamily:'monospace',fontSize:10,fontVariantNumeric:'tabular-nums' }}>
                                {time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
                            </span>
                            <span style={{ display:'flex',alignItems:'center',gap:4 }}>
                                <span style={{ width:6,height:6,borderRadius:'50%',background:'#4ade80',display:'inline-block',animation:'pdot 2s infinite' }}/>
                                <span style={{ color:'#4ade80' }}>Operational</span>
                            </span>
                        </div>
                    </div>
                    <div className="ad-hero-btns">
                        <button onClick={()=>navigate('/admin/doctors')}
                                style={{ padding:'8px 16px',borderRadius:9,border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.1)',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'background .15s' }}
                                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.2)'}
                                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
                            + Add Doctor
                        </button>
                        <button onClick={()=>navigate('/admin/appointments')}
                                style={{ padding:'8px 16px',borderRadius:9,border:'1px solid rgba(96,165,250,.35)',background:'rgba(96,165,250,.12)',color:'#93c5fd',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'background .15s' }}
                                onMouseEnter={e=>e.currentTarget.style.background='rgba(96,165,250,.22)'}
                                onMouseLeave={e=>e.currentTarget.style.background='rgba(96,165,250,.12)'}>
                            📅 Appointments
                        </button>
                    </div>
                </div>

                {/* stat cards — auto-fit grid */}
                <div className="ad-stat-grid">
                    {statCards.map((c,i) => (
                        <div key={c.label} className="adsc"
                             onClick={()=>navigate(c.to)}
                             style={{ background:'rgba(255,255,255,.08)',backdropFilter:'blur(14px)',border:`1px solid ${c.border}`,borderRadius:14,padding:'13px 14px',position:'relative',overflow:'hidden',boxSizing:'border-box',minWidth:0 }}>
                            {/* top accent line */}
                            <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${c.color},transparent)`,borderRadius:'14px 14px 0 0' }}/>
                            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                                <div style={{ width:32,height:32,borderRadius:9,background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0 }}>{c.icon}</div>
                                <Sparkline data={c.trend} color={c.color}/>
                            </div>
                            <div style={{ fontSize:20,fontWeight:800,color:'#fff',lineHeight:1,letterSpacing:'-0.5px',marginBottom:3 }}>
                                {loading ? <Skel w={44} h={20}/> : c.raw!=null ? <Counter value={c.raw}/> : c.display}
                            </div>
                            <div style={{ fontSize:9,color:'rgba(255,255,255,.45)',fontWeight:500 }}>{c.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                BODY — all sections overflow-safe
            ══════════════════════════════════════════════════ */}
            <div style={{ flex:1,padding:'18px 24px',display:'flex',flexDirection:'column',gap:16,
                width:'100%',boxSizing:'border-box',minWidth:0,overflowX:'hidden' }}>

                {/* Quick Actions */}
                <div className="ad-section">
                    <div style={{ fontSize:10,fontWeight:700,color:'#94a3b8',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:10 }}>Quick Actions</div>
                    <div className="ad-qa-grid">
                        {quickActions.map(q => (
                            <button key={q.label} className="adqa"
                                    onClick={()=>navigate(q.to)}
                                    style={{ display:'flex',alignItems:'center',gap:11,padding:'13px 15px',borderRadius:14,border:'1px solid #e2e8f0',background:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,.04)',textAlign:'left',width:'100%',boxSizing:'border-box',minWidth:0 }}>
                                <div style={{ width:40,height:40,borderRadius:11,background:q.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0 }}>{q.icon}</div>
                                <div style={{ minWidth:0 }}>
                                    <div style={{ fontSize:12,fontWeight:700,color:'#0f172a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{q.label}</div>
                                    <div style={{ fontSize:10,color:'#94a3b8',marginTop:1 }}>{q.sub}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div className="ad-chart-grid ad-section">

                    {/* Bar */}
                    <div style={{ background:'#fff',borderRadius:18,padding:'18px 20px',border:'1px solid #e8edf2',boxShadow:'0 1px 6px rgba(0,0,0,.04)',minWidth:0,boxSizing:'border-box' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,gap:8,flexWrap:'wrap' }}>
                            <div>
                                <div style={{ fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:2 }}>This Week — Appointments</div>
                                <div style={{ fontSize:10,color:'#94a3b8' }}>Daily count · hover bars</div>
                            </div>
                            <span style={{ background:'#EFF6FF',border:'1px solid #bfdbfe',borderRadius:8,padding:'4px 10px',fontSize:11,fontWeight:700,color:'#185FA5',whiteSpace:'nowrap',flexShrink:0 }}>
                                Total: {weekData.reduce((s,d)=>s+d.value,0)}
                            </span>
                        </div>
                        <BarChart data={weekData} color="#185FA5"/>
                    </div>

                    {/* Donut */}
                    <div style={{ background:'#fff',borderRadius:18,padding:'18px 20px',border:'1px solid #e8edf2',boxShadow:'0 1px 6px rgba(0,0,0,.04)',minWidth:0,boxSizing:'border-box' }}>
                        <div style={{ fontSize:14,fontWeight:700,color:'#0f172a',marginBottom:2 }}>Appointment Status</div>
                        <div style={{ fontSize:10,color:'#94a3b8',marginBottom:14 }}>All-time · hover to inspect</div>
                        <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
                            <DonutChart segments={donutSegs} size={100}/>
                            <div style={{ flex:1,minWidth:110 }}>
                                {donutSegs.map(s => (
                                    <div key={s.label}
                                         style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7,padding:'3px 7px',borderRadius:7,transition:'background .12s',cursor:'default' }}
                                         onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                                         onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                                        <span style={{ fontSize:11,color:'#374151',display:'flex',alignItems:'center',gap:6 }}>
                                            <span style={{ width:7,height:7,borderRadius:'50%',background:s.color,display:'inline-block',flexShrink:0 }}/>
                                            {s.label}
                                        </span>
                                        <span style={{ fontSize:12,fontWeight:700,color:'#0f172a' }}>
                                            {loading ? <Skel w={22} h={13}/> : s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: Doctors | Today | Low Stock */}
                <div className="ad-bot-grid ad-section">

                    {/* Doctors list */}
                    <div style={{ background:'#fff',borderRadius:18,border:'1px solid #e8edf2',boxShadow:'0 1px 6px rgba(0,0,0,.04)',overflow:'hidden',display:'flex',flexDirection:'column',minWidth:0,boxSizing:'border-box' }}>
                        <div style={{ padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>Doctors</div>
                                <div style={{ fontSize:10,color:'#94a3b8',marginTop:1 }}>Recently added</div>
                            </div>
                            <button onClick={()=>navigate('/admin/doctors')}
                                    style={{ fontSize:11,color:'#185FA5',fontWeight:600,cursor:'pointer',border:'none',background:'none',padding:'3px 7px',borderRadius:6,transition:'background .12s' }}
                                    onMouseEnter={e=>e.currentTarget.style.background='#eff6ff'}
                                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                                View all →
                            </button>
                        </div>
                        <div style={{ flex:1 }}>
                            {loading
                                ? Array(4).fill(0).map((_,i) => (
                                    <div key={i} style={{ display:'flex',alignItems:'center',gap:9,padding:'10px 16px',borderBottom:'1px solid #f8fafc' }}>
                                        <Skel w={30} h={30} r={9}/>
                                        <div style={{ flex:1,display:'flex',flexDirection:'column',gap:4 }}>
                                            <Skel w="65%" h={11}/><Skel w="45%" h={9}/>
                                        </div>
                                    </div>
                                ))
                                : doctors.slice(0,5).map((d,idx) => {
                                    const [bg,tc] = avatarColors[idx%avatarColors.length];
                                    const ini = d.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'??';
                                    return (
                                        <div key={d.id} className="addrow"
                                             onClick={()=>navigate('/admin/doctors')}
                                             style={{ display:'flex',alignItems:'center',gap:9,padding:'10px 16px',borderBottom:'1px solid #f8fafc' }}>
                                            <div style={{ width:30,height:30,borderRadius:9,background:bg,color:tc,fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{ini}</div>
                                            <div style={{ flex:1,minWidth:0 }}>
                                                <div style={{ fontSize:12,fontWeight:600,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{safeName(d.name)}</div>
                                                <div style={{ fontSize:10,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{d.specialization||safeDept(d.departments)}</div>
                                            </div>
                                            <div style={{ fontSize:11,fontWeight:700,color:'#059669',whiteSpace:'nowrap',flexShrink:0 }}>₹{d.consultationFee||'—'}</div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Today's appointments */}
                    <div style={{ background:'#fff',borderRadius:18,border:'1px solid #e8edf2',boxShadow:'0 1px 6px rgba(0,0,0,.04)',overflow:'hidden',minWidth:0,boxSizing:'border-box' }}>
                        <div style={{ padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>Today's Appointments</div>
                                <div style={{ fontSize:10,color:'#94a3b8',marginTop:1 }}>{new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
                            </div>
                            <span style={{ background:'#EFF6FF',color:'#185FA5',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700 }}>
                                {loading?'—':stats?.todayAppointments||0}
                            </span>
                        </div>
                        <div style={{ padding:'16px',display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                            <div style={{ fontSize:48,fontWeight:800,color:'#185FA5',lineHeight:1,letterSpacing:'-2px' }}>
                                {loading ? <Skel w={60} h={48} r={10}/> : <Counter value={stats?.todayAppointments||0}/>}
                            </div>
                            <div style={{ fontSize:11,color:'#94a3b8' }}>appointments today</div>
                            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,width:'100%',marginTop:6 }}>
                                {[
                                    { bg:'#f0fdf4',border:'#dcfce7',val:stats?.completedAppointments||0,  color:'#059669',label:'Completed'  },
                                    { bg:'#fffbeb',border:'#fde68a',val:(stats?.bookedAppointments||0)+(stats?.confirmedAppointments||0), color:'#d97706',label:'Pending' },
                                    { bg:'#fef2f2',border:'#fecaca',val:stats?.cancelledAppointments||0,  color:'#dc2626',label:'Cancelled'  },
                                    { bg:'#eff6ff',border:'#bfdbfe',val:stats?.confirmedAppointments||0,  color:'#185FA5',label:'Confirmed'  },
                                ].map(x => (
                                    <div key={x.label} style={{ background:x.bg,borderRadius:11,padding:'9px 10px',textAlign:'center',border:`1px solid ${x.border}` }}>
                                        <div style={{ fontSize:18,fontWeight:800,color:x.color }}>
                                            {loading?'—':<Counter value={x.val}/>}
                                        </div>
                                        <div style={{ fontSize:9,color:'#94a3b8',marginTop:2 }}>{x.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Low Stock */}
                    <div style={{ background:'#fff',borderRadius:18,border:'1px solid #e8edf2',boxShadow:'0 1px 6px rgba(0,0,0,.04)',overflow:'hidden',display:'flex',flexDirection:'column',minWidth:0,boxSizing:'border-box' }}>
                        <div style={{ padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                            <div>
                                <div style={{ fontSize:13,fontWeight:700,color:'#0f172a' }}>Low Stock Alert</div>
                                <div style={{ fontSize:10,color:'#94a3b8',marginTop:1 }}>{lowStock.length} item{lowStock.length!==1?'s':''} below threshold</div>
                            </div>
                            <button onClick={()=>navigate('/admin/medicines')}
                                    style={{ fontSize:11,color:'#ef4444',fontWeight:600,cursor:'pointer',border:'none',background:'none',padding:'3px 7px',borderRadius:6,transition:'background .12s' }}
                                    onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                                View all →
                            </button>
                        </div>
                        <div style={{ flex:1 }}>
                            {lowStock.length===0
                                ? <div style={{ padding:'28px',textAlign:'center',color:'#94a3b8',fontSize:12 }}>
                                    <div style={{ fontSize:24,marginBottom:6 }}>✅</div>All medicines in stock
                                </div>
                                : lowStock.slice(0,6).map((m,idx) => (
                                    <div key={m.id||idx} className="adls"
                                         onClick={()=>navigate('/admin/medicines')}
                                         style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 16px',borderBottom:'1px solid #f8fafc' }}>
                                        <div style={{ width:28,height:28,borderRadius:8,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0 }}>💊</div>
                                        <div style={{ flex:1,minWidth:0 }}>
                                            <div style={{ fontSize:11,fontWeight:600,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.name}</div>
                                            <div style={{ fontSize:10,color:'#94a3b8' }}>{m.type}</div>
                                        </div>
                                        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3,flexShrink:0 }}>
                                            <span style={{ background:m.stock<=5?'#fee2e2':'#fef9c3',color:m.stock<=5?'#dc2626':'#854d0e',padding:'2px 7px',borderRadius:6,fontSize:10,fontWeight:700 }}>
                                                {m.stock} left
                                            </span>
                                            <div style={{ width:48,height:3,background:'#f1f5f9',borderRadius:2,overflow:'hidden' }}>
                                                <div style={{ height:'100%',width:`${Math.min((m.stock/20)*100,100)}%`,background:m.stock<=5?'#ef4444':'#f59e0b',borderRadius:2 }}/>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}