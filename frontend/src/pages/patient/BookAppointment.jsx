import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function BookAppointment() {
    const { doctorId } = useParams();
    const navigate     = useNavigate();

    const [doctor, setDoctor]           = useState(null);
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [slots, setSlots]             = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [reason, setReason]           = useState('');
    const [loading, setLoading]         = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [success, setSuccess]         = useState(false);
    const [error, setError]             = useState('');

    useEffect(() => {
        api.get('/public/doctors', { params: { size: 100 } })
            .then(({ data }) => {
                const found = data.content?.find(d => String(d.id) === String(doctorId));
                setDoctor(found || null);
            });
    }, [doctorId]);

    useEffect(() => {
        if (!selectedDate) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        api.get(`/public/doctors/${doctorId}/slots`, { params: { date: selectedDate } })
            .then(({ data }) => setSlots(data))
            .catch(() => setSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [selectedDate, doctorId]);

    async function handleBook() {
        if (!selectedSlot) return;
        setError('');
        setLoading(true);
        try {
            const appointmentTime = `${selectedDate}T${selectedSlot.startTime}`;
            await api.post('/patient/appointments', {
                doctorId: Number(doctorId),
                appointmentTime,
                reason,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (success) return (
        <div style={{
            flex:1, display:'flex', alignItems:'center',
            justifyContent:'center', padding:'24px',
        }}>
            <div style={{
                background:'#fff', borderRadius:'16px', padding:'40px',
                maxWidth:'400px', width:'100%', textAlign:'center',
                border:'1px solid #f0f0f0',
            }}>
                <div style={{
                    width:'64px', height:'64px', borderRadius:'50%',
                    background:'#E1F5EE', display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:'28px', margin:'0 auto 16px',
                }}>✅</div>
                <div style={{
                    fontSize:'20px', fontWeight:700, color:'#0a4f3a', marginBottom:'8px',
                    fontFamily:"'Playfair Display', serif",
                }}>Appointment Booked!</div>
                <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'20px', lineHeight:1.7 }}>
                    Your appointment with <strong>{doctor?.name}</strong> on{' '}
                    <strong>{selectedDate}</strong> at{' '}
                    <strong>{selectedSlot?.startTime}</strong> is confirmed.
                </p>
                <button
                    onClick={() => navigate('/patient/appointments')}
                    style={{
                        width:'100%', padding:'11px', borderRadius:'10px',
                        border:'none', background:'#0a4f3a', color:'#fff',
                        fontSize:'13px', fontWeight:600, cursor:'pointer',
                    }}
                >
                    View My Appointments →
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

            {/* topbar */}
            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px',
                display:'flex', alignItems:'center', justifyContent:'space-between',
                position:'sticky', top:0, zIndex:10,
            }}>
                <div>
                    <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>Book Appointment</div>
                    <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                        {doctor ? `${doctor.name} · ${doctor.specialization}` : 'Loading...'}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/patient/doctors')}
                    style={{
                        padding:'7px 14px', borderRadius:'8px',
                        border:'1px solid #e5e7eb', background:'#fff',
                        color:'#374151', fontSize:'12px', fontWeight:600, cursor:'pointer',
                    }}
                >
                    ← Back
                </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

                    {/* LEFT */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

                        {/* date picker */}
                        <div style={{
                            background:'#fff', border:'1px solid #f0f0f0',
                            borderRadius:'10px', padding:'14px',
                        }}>
                            <div style={{
                                fontSize:'10px', fontWeight:700, color:'#9ca3af',
                                textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'10px',
                            }}>Select Date</div>
                            <input
                                type="date"
                                min={todayStr()}
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                style={{
                                    width:'100%', border:'1px solid #e5e7eb', borderRadius:'9px',
                                    padding:'9px 12px', fontSize:'12px', outline:'none',
                                    background:'#fafafa', fontFamily:'Outfit, sans-serif',
                                }}
                                onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {/* slots */}
                        <div style={{
                            background:'#fff', border:'1px solid #f0f0f0',
                            borderRadius:'10px', padding:'14px',
                        }}>
                            <div style={{
                                fontSize:'10px', fontWeight:700, color:'#9ca3af',
                                textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'10px',
                            }}>
                                Available Slots
                            </div>

                            {slotsLoading ? (
                                <div style={{ textAlign:'center', padding:'20px', color:'#9ca3af', fontSize:'12px' }}>
                                    Loading slots...
                                </div>
                            ) : slots.length === 0 ? (
                                <div style={{ textAlign:'center', padding:'20px', color:'#9ca3af', fontSize:'12px' }}>
                                    No slots available. Try another date.
                                </div>
                            ) : (
                                <div style={{
                                    display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px',
                                }}>
                                    {slots.map((slot, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            style={{
                                                padding:'8px 4px', borderRadius:'7px',
                                                fontSize:'11px', fontWeight:500,
                                                textAlign:'center', cursor:'pointer',
                                                transition:'all .12s',
                                                border: selectedSlot === slot ? 'none' : '1px solid #e5e7eb',
                                                background: selectedSlot === slot ? '#0a4f3a' : '#fff',
                                                color: selectedSlot === slot ? '#fff' : '#374151',
                                            }}
                                        >
                                            {slot.startTime}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* legend */}
                            <div style={{ display:'flex', gap:'12px', marginTop:'10px' }}>
                                {[
                                    { bg:'#0a4f3a', color:'#fff', label:'Selected' },
                                    { bg:'#fff', color:'#374151', label:'Available' },
                                ].map(l => (
                                    <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                                        <div style={{
                                            width:'14px', height:'14px', borderRadius:'3px',
                                            background: l.bg, border:'1px solid #e5e7eb',
                                        }} />
                                        <span style={{ fontSize:'10px', color:'#6b7280' }}>{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

                        {/* doctor info */}
                        {doctor && (
                            <div style={{
                                background:'#fff', border:'1px solid #f0f0f0',
                                borderRadius:'10px', padding:'14px',
                            }}>
                                <div style={{
                                    fontSize:'10px', fontWeight:700, color:'#9ca3af',
                                    textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'10px',
                                }}>Doctor Info</div>
                                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                                    <div style={{
                                        width:'40px', height:'40px', borderRadius:'10px',
                                        background:'#E1F5EE', color:'#0a4f3a',
                                        fontSize:'14px', fontWeight:700,
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                    }}>
                                        {doctor.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize:'13px', fontWeight:600, color:'#111' }}>
                                            {doctor.name}
                                        </div>
                                        <div style={{ fontSize:'11px', color:'#0a4f3a' }}>
                                            {doctor.specialization}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize:'11px', color:'#6b7280', lineHeight:1.9 }}>
                                    <div>🏥 {doctor.departmentName || 'General'}</div>
                                    <div>⏳ {doctor.experienceYears} yrs experience</div>
                                    <div>💰 Consultation: <strong style={{ color:'#0a4f3a' }}>₹{doctor.consultationFee}</strong></div>
                                </div>
                            </div>
                        )}

                        {/* reason */}
                        <div style={{
                            background:'#fff', border:'1px solid #f0f0f0',
                            borderRadius:'10px', padding:'14px',
                        }}>
                            <div style={{
                                fontSize:'10px', fontWeight:700, color:'#9ca3af',
                                textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'10px',
                            }}>Reason for Visit</div>
                            <textarea
                                style={{
                                    width:'100%', border:'1px solid #e5e7eb', borderRadius:'9px',
                                    padding:'9px 12px', fontSize:'12px', outline:'none',
                                    background:'#fafafa', fontFamily:'Outfit, sans-serif',
                                    resize:'none', minHeight:'80px',
                                }}
                                placeholder="Describe your symptoms or reason..."
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>

                        {/* selected slot summary */}
                        {selectedSlot && (
                            <div style={{
                                background:'#E1F5EE', border:'1px solid #a7f3d0',
                                borderRadius:'10px', padding:'12px 14px',
                                display:'flex', alignItems:'center', justifyContent:'space-between',
                            }}>
                                <div>
                                    <div style={{ fontSize:'10px', color:'#065f46', fontWeight:700 }}>
                                        Selected Slot
                                    </div>
                                    <div style={{ fontSize:'13px', fontWeight:700, color:'#0a4f3a', marginTop:'2px' }}>
                                        {selectedDate} · {selectedSlot.startTime} – {selectedSlot.endTime}
                                    </div>
                                </div>
                                <div style={{ fontSize:'18px', fontWeight:700, color:'#0a4f3a' }}>
                                    ₹{doctor?.consultationFee}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div style={{
                                background:'#fef2f2', border:'1px solid #fecaca',
                                color:'#dc2626', fontSize:'12px', borderRadius:'9px',
                                padding:'10px 14px',
                            }}>⚠️ {error}</div>
                        )}

                        <button
                            onClick={handleBook}
                            disabled={!selectedSlot || loading}
                            style={{
                                width:'100%', padding:'12px', borderRadius:'10px',
                                border:'none', fontSize:'13px', fontWeight:600,
                                cursor: !selectedSlot || loading ? 'not-allowed' : 'pointer',
                                background: !selectedSlot || loading ? '#d1d5db' : '#0a4f3a',
                                color: !selectedSlot || loading ? '#9ca3af' : '#fff',
                                transition:'all .15s',
                            }}
                        >
                            {loading ? 'Booking...' : 'Confirm Appointment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function todayStr() {
    return new Date().toISOString().split('T')[0];
}