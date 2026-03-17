import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filter,       setFilter]       = useState('ALL');
    const [reassigning,  setReassigning]  = useState(null);
    const [doctors,      setDoctors]      = useState([]);
    const [selectedDoc,  setSelectedDoc]  = useState('');
    const [error,        setError]        = useState('');
    const [success,      setSuccess]      = useState('');

    useEffect(() => {
        fetchAppointments();
        // load all doctors for reassign dropdown
        api.get('/public/doctors', { params: { size:100 } })
            .then(({ data }) => setDoctors(data.content || []))
            .catch(() => {});
    }, []);

    async function fetchAppointments() {
        setLoading(true);
        try {
            const { data } = await api.get('/doctors/appointments');
            setAppointments(data || []);
        } catch {
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }

    async function handleReassign(appointmentId) {
        if (!selectedDoc) return;
        try {
            await api.patch(
                `/doctors/appointments/${appointmentId}/reassign`,
                null,
                { params: { doctorId: selectedDoc } }
            );
            setSuccess('Appointment reassigned successfully!');
            setReassigning(null);
            setSelectedDoc('');
            fetchAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reassign failed');
        }
    }

    const filtered = filter === 'ALL'
        ? appointments
        : appointments.filter(a => a.status === filter);

    const statusColors = {
        BOOKED:    { bg:'#fffbeb', color:'#92400e', label:'Booked' },
        CONFIRMED: { bg:'#f0fdf4', color:'#166534', label:'Confirmed' },
        COMPLETED: { bg:'#f3f4f6', color:'#374151', label:'Completed' },
        CANCELLED: { bg:'#fef2f2', color:'#dc2626', label:'Cancelled' },
    };

    const s = {
        th: { textAlign:'left', fontSize:'10px', fontWeight:700, color:'#9ca3af',
            padding:'7px 10px', borderBottom:'1px solid #f3f4f6',
            textTransform:'uppercase', letterSpacing:'.05em' },
        td: { padding:'10px 10px', borderBottom:'1px solid #f9fafb',
            fontSize:'12px', color:'#374151' },
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0',
                padding:'12px 20px', position:'sticky', top:0, zIndex:10,
            }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>
                    All Appointments
                </div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                    Your complete schedule
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

                {error && (
                    <div style={{
                        background:'#fef2f2', border:'1px solid #fecaca',
                        color:'#dc2626', fontSize:'12px', borderRadius:'9px',
                        padding:'10px 14px', marginBottom:'12px',
                    }}>⚠️ {error}</div>
                )}
                {success && (
                    <div style={{
                        background:'#f0fdf4', border:'1px solid #bbf7d0',
                        color:'#166534', fontSize:'12px', borderRadius:'9px',
                        padding:'10px 14px', marginBottom:'12px',
                    }}>✅ {success}</div>
                )}

                {/* filter tabs */}
                <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
                    {['ALL','BOOKED','CONFIRMED','COMPLETED','CANCELLED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding:'5px 14px', borderRadius:'16px', fontSize:'11px',
                                fontWeight:600, cursor:'pointer',
                                border: filter === f ? 'none' : '1px solid #e5e7eb',
                                background: filter === f ? '#185FA5' : '#fff',
                                color: filter === f ? '#fff' : '#6b7280',
                            }}
                        >
                            {f === 'ALL' ? `All (${appointments.length})` : f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* table */}
                <div style={{
                    background:'#fff', border:'1px solid #f0f0f0',
                    borderRadius:'10px', padding:'14px',
                }}>
                    {loading ? (
                        <div style={{ textAlign:'center', padding:'40px',
                            color:'#9ca3af', fontSize:'13px' }}>
                            Loading appointments...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'40px',
                            color:'#9ca3af', fontSize:'13px' }}>
                            No appointments found.
                        </div>
                    ) : (
                        <>
                            <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead>
                                <tr>
                                    {['Patient','Date & Time','Reason','Status','Action'].map(h => (
                                        <th key={h} style={s.th}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map(appt => {
                                    const sc = statusColors[appt.status] || statusColors.BOOKED;
                                    const initials = appt.patientName
                                        ?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                    return (
                                        <>
                                            <tr key={appt.id}>
                                                <td style={s.td}>
                                                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                                        <div style={{
                                                            width:'28px', height:'28px', borderRadius:'7px',
                                                            background:'#EFF6FF', color:'#185FA5',
                                                            fontSize:'10px', fontWeight:700,
                                                            display:'flex', alignItems:'center',
                                                            justifyContent:'center',
                                                        }}>{initials}</div>
                                                        <span style={{ fontWeight:500 }}>
                                                                {appt.patientName}
                                                            </span>
                                                    </div>
                                                </td>
                                                <td style={s.td}>
                                                    {appt.appointmentTime
                                                        ? new Date(appt.appointmentTime)
                                                            .toLocaleString('en-IN', {
                                                                day:'numeric', month:'short',
                                                                hour:'2-digit', minute:'2-digit'
                                                            })
                                                        : '—'}
                                                </td>
                                                <td style={{ ...s.td, maxWidth:'140px',
                                                    overflow:'hidden', textOverflow:'ellipsis',
                                                    whiteSpace:'nowrap' }}>
                                                    {appt.reason || '—'}
                                                </td>
                                                <td style={s.td}>
                                                        <span style={{
                                                            background: sc.bg, color: sc.color,
                                                            padding:'3px 9px', borderRadius:'8px',
                                                            fontSize:'10px', fontWeight:600,
                                                        }}>
                                                            {sc.label}
                                                        </span>
                                                </td>
                                                <td style={s.td}>
                                                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                                                        {['BOOKED','CONFIRMED'].includes(appt.status) && (
                                                            <>
                                                                <button
                                                                    onClick={() => navigate(`/doctor/appointments/${appt.id}/prescribe`)}
                                                                    style={{
                                                                        padding:'4px 9px', borderRadius:'6px', border:'none',
                                                                        background:'#EFF6FF', color:'#185FA5',
                                                                        fontSize:'11px', fontWeight:600, cursor:'pointer',
                                                                    }}
                                                                >
                                                                    💊 Prescribe
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/doctor/appointments/${appt.id}/record`)}
                                                                    style={{
                                                                        padding:'4px 9px', borderRadius:'6px', border:'none',
                                                                        background:'#f0fdf4', color:'#166534',
                                                                        fontSize:'11px', fontWeight:600, cursor:'pointer',
                                                                    }}
                                                                >
                                                                    📋 Record
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setReassigning(reassigning === appt.id ? null : appt.id);
                                                                        setSelectedDoc('');
                                                                    }}
                                                                    style={{
                                                                        padding:'4px 9px', borderRadius:'6px',
                                                                        border:'1px solid #e5e7eb', background:'#fff',
                                                                        color:'#374151', fontSize:'11px', fontWeight:600, cursor:'pointer',
                                                                    }}
                                                                >
                                                                    Reassign
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* inline reassign panel */}
                                            {reassigning === appt.id && (
                                                <tr key={`r-${appt.id}`}>
                                                    <td colSpan={5} style={{
                                                        padding:'10px 14px',
                                                        background:'#f9fafb',
                                                        borderBottom:'1px solid #f3f4f6',
                                                    }}>
                                                        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                                                            <select
                                                                style={{
                                                                    flex:1, border:'1px solid #e5e7eb',
                                                                    borderRadius:'8px', padding:'7px 10px',
                                                                    fontSize:'12px', outline:'none',
                                                                }}
                                                                value={selectedDoc}
                                                                onChange={e => setSelectedDoc(e.target.value)}
                                                            >
                                                                <option value="">Select doctor...</option>
                                                                {doctors.map(d => (
                                                                    <option key={d.id} value={d.id}>
                                                                        {d.name} — {d.specialization}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                onClick={() => handleReassign(appt.id)}
                                                                disabled={!selectedDoc}
                                                                style={{
                                                                    padding:'7px 14px', borderRadius:'8px',
                                                                    border:'none', background:'#185FA5',
                                                                    color:'#fff', fontSize:'12px',
                                                                    fontWeight:600, cursor:'pointer',
                                                                }}
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => setReassigning(null)}
                                                                style={{
                                                                    padding:'7px 14px', borderRadius:'8px',
                                                                    border:'1px solid #e5e7eb', background:'#fff',
                                                                    color:'#374151', fontSize:'12px',
                                                                    fontWeight:600, cursor:'pointer',
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}