import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../../api/axios';

const statusConfig = {
    BOOKED:    { bg:'#fffbeb', color:'#92400e', border:'#fde68a', label:'Booked',    icon:'🕐' },
    CONFIRMED: { bg:'#f0fdf4', color:'#166534', border:'#bbf7d0', label:'Confirmed', icon:'✅' },
    COMPLETED: { bg:'#f3f4f6', color:'#374151', border:'#e5e7eb', label:'Completed', icon:'🏁' },
    CANCELLED: { bg:'#fef2f2', color:'#dc2626', border:'#fecaca', label:'Cancelled', icon:'❌' },
};

export default function Appointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [filter, setFilter]             = useState('ALL');
    const [cancelling, setCancelling]     = useState(null);
    const [error, setError]               = useState('');

    useEffect(() => { fetchAppointments(); }, []);

    async function fetchAppointments() {
        setLoading(true);
        try {
            const { data } = await api.get('/patient/appointments', {
                params: { page: 0, size: 50 },
            });
            setAppointments(data);
        } catch {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel(id) {
        if (!window.confirm('Cancel this appointment?')) return;
        setCancelling(id);
        try {
            await api.patch(`/patient/appointments/${id}/cancel`);
            setAppointments(prev =>
                prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a)
            );
        } catch {
            setError('Failed to cancel appointment');
        } finally {
            setCancelling(null);
        }
    }

    const filtered = filter === 'ALL'
        ? appointments
        : filter === 'UPCOMING'
            ? appointments.filter(a => ['BOOKED','CONFIRMED'].includes(a.status))
            : appointments.filter(a => a.status === filter);

    const counts = {
        total:     appointments.length,
        upcoming:  appointments.filter(a => ['BOOKED','CONFIRMED'].includes(a.status)).length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    };

    // next upcoming appointment
    const nextAppt = appointments
        .filter(a => ['BOOKED','CONFIRMED'].includes(a.status))
        .sort((a,b) => new Date(a.appointmentTime) - new Date(b.appointmentTime))[0];

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

            {/* topbar */}
            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                position:'sticky', top:0, zIndex:10,
            }}>
                <div>
                    <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>My Appointments</div>
                    <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>All past & upcoming visits</div>
                </div>
                <button
                    onClick={() => navigate('/patient/doctors')}
                    style={{
                        padding:'7px 16px', borderRadius:'8px', border:'none',
                        background:'#0a4f3a', color:'#fff', fontSize:'12px',
                        fontWeight:600, cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'6px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1D9E75'}
                    onMouseLeave={e => e.currentTarget.style.background = '#0a4f3a'}
                >
                    📅 + Book New
                </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

                {error && (
                    <div style={{
                        background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626',
                        fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px',
                    }}>⚠️ {error}</div>
                )}

                {/* ✅ Next appointment banner */}
                {nextAppt && (
                    <div style={{
                        background:'linear-gradient(120deg,#0a4f3a,#1D9E75)',
                        borderRadius:'12px', padding:'16px 20px', color:'#fff',
                        marginBottom:'14px', position:'relative', overflow:'hidden',
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                    }}>
                        {/* decorative */}
                        <div style={{
                            position:'absolute', right:'-20px', top:'-20px',
                            width:'100px', height:'100px', borderRadius:'50%',
                            background:'rgba(255,255,255,.07)',
                        }}/>
                        <div style={{
                            position:'absolute', right:'60px', bottom:'-30px',
                            width:'80px', height:'80px', borderRadius:'50%',
                            background:'rgba(255,255,255,.05)',
                        }}/>

                        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                            {/* pulse dot */}
                            <div style={{ position:'relative', flexShrink:0 }}>
                                <div style={{
                                    width:'44px', height:'44px', borderRadius:'12px',
                                    background:'rgba(255,255,255,.2)',
                                    display:'flex', alignItems:'center',
                                    justifyContent:'center', fontSize:'22px',
                                }}>📅</div>
                                <div style={{
                                    position:'absolute', top:'-3px', right:'-3px',
                                    width:'12px', height:'12px', borderRadius:'50%',
                                    background:'#4ade80',
                                    border:'2px solid #0a4f3a',
                                    animation:'pulse 2s infinite',
                                }}/>
                            </div>
                            <div>
                                <div style={{
                                    fontSize:'10px', opacity:.7,
                                    textTransform:'uppercase', letterSpacing:'.07em',
                                    marginBottom:'3px',
                                }}>
                                    🔔 Next Appointment
                                </div>
                                <div style={{ fontSize:'15px', fontWeight:700 }}>
                                    {nextAppt.doctorName}
                                </div>
                                <div style={{ fontSize:'11px', opacity:.8, marginTop:'2px' }}>
                                    {new Date(nextAppt.appointmentTime).toLocaleString('en-IN', {
                                        weekday:'long', day:'numeric', month:'long',
                                        hour:'2-digit', minute:'2-digit',
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* status badge */}
                        <div style={{
                            background:'rgba(255,255,255,.2)',
                            border:'1px solid rgba(255,255,255,.3)',
                            padding:'6px 14px', borderRadius:'20px',
                            fontSize:'11px', fontWeight:700, flexShrink:0,
                        }}>
                            {statusConfig[nextAppt.status]?.icon} {statusConfig[nextAppt.status]?.label}
                        </div>
                    </div>
                )}

                {/* ✅ Colorful stat cards */}
                <div style={{
                    display:'grid', gridTemplateColumns:'repeat(4,1fr)',
                    gap:'10px', marginBottom:'14px',
                }}>
                    {[
                        {
                            label:'Total Visits', value: counts.total,
                            icon:'🏥', bg:'linear-gradient(135deg,#0a4f3a,#1D9E75)',
                            color:'#fff', sub:'All time',
                        },
                        {
                            label:'Upcoming', value: counts.upcoming,
                            icon:'📅', bg:'linear-gradient(135deg,#1e40af,#3b82f6)',
                            color:'#fff', sub:'Scheduled',
                        },
                        {
                            label:'Completed', value: counts.completed,
                            icon:'✅', bg:'linear-gradient(135deg,#065f46,#059669)',
                            color:'#fff', sub:'Done',
                        },
                        {
                            label:'Cancelled', value: counts.cancelled,
                            icon:'❌', bg:'linear-gradient(135deg,#991b1b,#ef4444)',
                            color:'#fff', sub:'Cancelled',
                        },
                    ].map(card => (
                        <div key={card.label} style={{
                            background: card.bg, borderRadius:'12px',
                            padding:'14px 16px', position:'relative', overflow:'hidden',
                        }}>
                            {/* decorative circle */}
                            <div style={{
                                position:'absolute', right:'-10px', top:'-10px',
                                width:'60px', height:'60px', borderRadius:'50%',
                                background:'rgba(255,255,255,.1)',
                            }}/>
                            <div style={{
                                fontSize:'20px', marginBottom:'8px',
                            }}>{card.icon}</div>
                            <div style={{
                                fontSize:'26px', fontWeight:800, color:card.color,
                                lineHeight:1,
                            }}>{card.value}</div>
                            <div style={{
                                fontSize:'11px', fontWeight:600,
                                color:'rgba(255,255,255,.9)', marginTop:'4px',
                            }}>{card.label}</div>
                            <div style={{
                                fontSize:'10px',
                                color:'rgba(255,255,255,.6)', marginTop:'1px',
                            }}>{card.sub}</div>
                        </div>
                    ))}
                </div>

                {/* ✅ Filter tabs */}
                <div style={{
                    display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap',
                }}>
                    {[
                        { key:'ALL',       label:`All (${counts.total})` },
                        { key:'UPCOMING',  label:`🔜 Upcoming (${counts.upcoming})` },
                        { key:'BOOKED',    label:'🕐 Booked' },
                        { key:'CONFIRMED', label:'✅ Confirmed' },
                        { key:'COMPLETED', label:'🏁 Completed' },
                        { key:'CANCELLED', label:'❌ Cancelled' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            style={{
                                padding:'5px 14px', borderRadius:'16px', fontSize:'11px',
                                fontWeight:600, cursor:'pointer', transition:'all .12s',
                                border: filter === f.key ? 'none' : '1px solid #e5e7eb',
                                background: filter === f.key ? '#0a4f3a' : '#fff',
                                color: filter === f.key ? '#fff' : '#6b7280',
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ✅ Appointments list — cards instead of table */}
                {loading ? (
                    <div style={{
                        display:'flex', flexDirection:'column', gap:'10px',
                    }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} style={{
                                background:'#f9fafb', borderRadius:'12px',
                                height:'70px', animation:'pulse 1.5s infinite',
                            }}/>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        background:'#fff', border:'1px solid #f0f0f0',
                        borderRadius:'12px', padding:'50px',
                        textAlign:'center', color:'#9ca3af',
                    }}>
                        <div style={{ fontSize:'40px', marginBottom:'10px' }}>📭</div>
                        <div style={{ fontWeight:600, color:'#374151', marginBottom:'4px' }}>
                            No appointments found
                        </div>
                        <div style={{ fontSize:'12px', marginBottom:'14px' }}>
                            Book your first appointment today
                        </div>
                        <button
                            onClick={() => navigate('/patient/doctors')}
                            style={{
                                padding:'8px 18px', borderRadius:'8px', border:'none',
                                background:'#0a4f3a', color:'#fff',
                                fontSize:'12px', fontWeight:600, cursor:'pointer',
                            }}
                        >
                            Find Doctors →
                        </button>
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        {filtered.map(appt => {
                            const sc = statusConfig[appt.status] || statusConfig.BOOKED;
                            const initials = appt.doctorName
                                ?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                            const isUpcoming = ['BOOKED','CONFIRMED'].includes(appt.status);
                            const apptDate = new Date(appt.appointmentTime);
                            const isToday = new Date().toDateString() === apptDate.toDateString();

                            return (
                                <div key={appt.id} style={{
                                    background:'#fff',
                                    border: isUpcoming ? '1px solid #bbf7d0' : '1px solid #f0f0f0',
                                    borderRadius:'12px', padding:'14px 16px',
                                    display:'flex', alignItems:'center',
                                    gap:'14px', transition:'all .15s',
                                    boxShadow: isUpcoming ? '0 2px 8px rgba(10,79,58,.06)' : 'none',
                                }}
                                     onMouseEnter={e => {
                                         e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.06)';
                                         e.currentTarget.style.transform = 'translateY(-1px)';
                                     }}
                                     onMouseLeave={e => {
                                         e.currentTarget.style.boxShadow = isUpcoming ? '0 2px 8px rgba(10,79,58,.06)' : 'none';
                                         e.currentTarget.style.transform = 'none';
                                     }}
                                >
                                    {/* avatar */}
                                    <div style={{
                                        width:'44px', height:'44px', borderRadius:'11px',
                                        background:'linear-gradient(135deg,#0a4f3a,#1D9E75)',
                                        color:'#fff', fontSize:'14px', fontWeight:700,
                                        display:'flex', alignItems:'center',
                                        justifyContent:'center', flexShrink:0,
                                    }}>
                                        {initials}
                                    </div>

                                    {/* doctor + date */}
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{
                                            display:'flex', alignItems:'center', gap:'8px',
                                            marginBottom:'3px',
                                        }}>
                                            <div style={{
                                                fontSize:'13px', fontWeight:700, color:'#111',
                                            }}>
                                                {appt.doctorName}
                                            </div>
                                            {/* TODAY badge */}
                                            {isToday && (
                                                <span style={{
                                                    background:'#fef3c7', color:'#92400e',
                                                    fontSize:'9px', fontWeight:700,
                                                    padding:'2px 7px', borderRadius:'6px',
                                                    border:'1px solid #fde68a',
                                                }}>
                                                    TODAY
                                                </span>
                                            )}
                                            {/* UPCOMING badge */}
                                            {isUpcoming && !isToday && (
                                                <span style={{
                                                    background:'#E1F5EE', color:'#065f46',
                                                    fontSize:'9px', fontWeight:700,
                                                    padding:'2px 7px', borderRadius:'6px',
                                                }}>
                                                    UPCOMING
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize:'11px', color:'#6b7280',
                                            display:'flex', alignItems:'center', gap:'12px',
                                        }}>
                                            <span>🗓 {apptDate.toLocaleDateString('en-IN', {
                                                day:'numeric', month:'short', year:'numeric',
                                            })}</span>
                                            <span>🕐 {apptDate.toLocaleTimeString('en-IN', {
                                                hour:'2-digit', minute:'2-digit',
                                            })}</span>
                                            {appt.reason && (
                                                <span style={{
                                                    overflow:'hidden', textOverflow:'ellipsis',
                                                    whiteSpace:'nowrap', maxWidth:'120px',
                                                }}>
                                                    💬 {appt.reason}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* status */}
                                    <span style={{
                                        background: sc.bg, color: sc.color,
                                        border: `1px solid ${sc.border}`,
                                        padding:'4px 10px', borderRadius:'8px',
                                        fontSize:'10px', fontWeight:700, flexShrink:0,
                                    }}>
                                        {sc.icon} {sc.label}
                                    </span>

                                    {/* cancel button */}
                                    {isUpcoming && (
                                        <button
                                            onClick={() => handleCancel(appt.id)}
                                            disabled={cancelling === appt.id}
                                            style={{
                                                padding:'5px 12px', borderRadius:'7px',
                                                border:'1px solid #fecaca',
                                                background:'#fef2f2', color:'#dc2626',
                                                fontSize:'11px', fontWeight:600,
                                                cursor:'pointer', flexShrink:0,
                                                transition:'all .12s',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = '#dc2626';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = '#fef2f2';
                                                e.currentTarget.style.color = '#dc2626';
                                            }}
                                        >
                                            {cancelling === appt.id ? '...' : '✕ Cancel'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%,100% { opacity:1; } 50% { opacity:.5; }
                }
            `}</style>
        </div>
    );
}