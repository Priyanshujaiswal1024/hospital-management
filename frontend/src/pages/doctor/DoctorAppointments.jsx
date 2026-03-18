import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DoctorAppointments() {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filter,       setFilter]       = useState('ALL');
    const [reassigning,  setReassigning]  = useState(null);
    const [completing,   setCompleting]   = useState(null);
    const [doctors,      setDoctors]      = useState([]);
    const [selectedDoc,  setSelectedDoc]  = useState('');
    const [error,        setError]        = useState('');
    const [success,      setSuccess]      = useState('');

    useEffect(() => {
        fetchAppointments();
        api.get('/public/doctors', { params: { size: 100 } })
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

    async function handleMarkComplete(appointmentId) {
        if (!window.confirm('Mark this appointment as completed?')) return;
        setCompleting(appointmentId);
        try {
            await api.patch(`/doctors/appointments/${appointmentId}/complete`);
            setSuccess('Appointment marked as completed!');
            fetchAppointments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete appointment');
        } finally {
            setCompleting(null);
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
            setSuccess('Appointment reassigned!');
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

    const statusConfig = {
        BOOKED:    { bg:'#fef9c3', color:'#854d0e', dot:'#eab308', label:'Booked'    },
        CONFIRMED: { bg:'#dcfce7', color:'#14532d', dot:'#22c55e', label:'Confirmed' },
        COMPLETED: { bg:'#f1f5f9', color:'#374151', dot:'#94a3b8', label:'Completed' },
        CANCELLED: { bg:'#fee2e2', color:'#7f1d1d', dot:'#ef4444', label:'Cancelled' },
    };

    const avatarPalette = [
        ['#EFF6FF','#185FA5'],['#FDF4FF','#7e22ce'],
        ['#FFF7ED','#c2410c'],['#F0FDF4','#15803d'],
        ['#FEF2F2','#dc2626'],['#F0F9FF','#0369a1'],
    ];

    const s = {
        th: {
            textAlign:'left', fontSize:'10px', fontWeight:700, color:'#94a3b8',
            padding:'10px 14px', borderBottom:'2px solid #f1f5f9',
            textTransform:'uppercase', letterSpacing:'.06em', background:'#f8fafc',
        },
        td: {
            padding:'12px 14px', borderBottom:'1px solid #f8fafc',
            fontSize:'12px', color:'#374151', verticalAlign:'middle',
        },
    };

    function ActionButtons({ appt }) {
        const isActive         = ['BOOKED','CONFIRMED'].includes(appt.status);
        const isCancelled      = appt.status === 'CANCELLED';
        const hasPrescription  = !!appt.prescriptionId;
        const hasMedicalRecord = !!appt.medicalRecordId;

        if (isCancelled) {
            return (
                <span style={{ fontSize:'11px', color:'#cbd5e1', fontStyle:'italic' }}>
                    No actions
                </span>
            );
        }

        return (
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>

                {isActive && (
                    <button
                        onClick={() => handleMarkComplete(appt.id)}
                        disabled={completing === appt.id}
                        style={{
                            padding:'5px 10px', borderRadius:'7px', border:'none',
                            background:'#f0fdf4', color:'#15803d',
                            fontSize:'11px', fontWeight:600,
                            cursor: completing === appt.id ? 'not-allowed' : 'pointer',
                            display:'flex', alignItems:'center', gap:'4px',
                            opacity: completing === appt.id ? .6 : 1,
                        }}>
                        {completing === appt.id ? '⏳' : '✓'} Done
                    </button>
                )}

                <button
                    onClick={() => navigate(
                        hasPrescription
                            ? `/doctor/prescriptions/${appt.prescriptionId}`
                            : `/doctor/appointments/${appt.id}/prescription`
                    )}
                    style={{
                        padding:'5px 10px', borderRadius:'7px',
                        border: hasPrescription ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                        background: hasPrescription ? '#f0fdf4' : '#EFF6FF',
                        color: hasPrescription ? '#15803d' : '#185FA5',
                        fontSize:'11px', fontWeight:600, cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'4px',
                    }}>
                    💊 {hasPrescription ? 'View Rx' : 'Write Rx'}
                </button>

                <button
                    onClick={() => navigate(
                        hasMedicalRecord
                            ? `/doctor/medical-records/${appt.medicalRecordId}`
                            : `/doctor/appointments/${appt.id}/record`
                    )}
                    style={{
                        padding:'5px 10px', borderRadius:'7px',
                        border: hasMedicalRecord ? '1px solid #bbf7d0' : '1px solid #fed7aa',
                        background: hasMedicalRecord ? '#f0fdf4' : '#fff7ed',
                        color: hasMedicalRecord ? '#15803d' : '#c2410c',
                        fontSize:'11px', fontWeight:600, cursor:'pointer',
                        display:'flex', alignItems:'center', gap:'4px',
                    }}>
                    📋 {hasMedicalRecord ? 'View Record' : 'Add Record'}
                </button>

                {isActive && (
                    <button
                        onClick={() => {
                            setReassigning(reassigning === appt.id ? null : appt.id);
                            setSelectedDoc('');
                        }}
                        style={{
                            padding:'5px 10px', borderRadius:'7px',
                            border:'1px solid #e2e8f0', background:'#fff',
                            color:'#374151', fontSize:'11px', fontWeight:600, cursor:'pointer',
                        }}>
                        🔄 Reassign
                    </button>
                )}
            </div>
        );
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
                .appt-row:hover { background:#f8faff!important; }
            `}</style>

            {/* Hero */}
            <div style={{ background:'linear-gradient(135deg,#0f3460,#185FA5)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <div>
                    <div style={{ fontSize:'18px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>📅 Appointments</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>
                        {loading ? 'Loading...' : `${appointments.length} total appointments`}
                    </div>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                    {[
                        { label:'Booked',    color:'#fbbf24', count: appointments.filter(a=>a.status==='BOOKED').length    },
                        { label:'Confirmed', color:'#34d399', count: appointments.filter(a=>a.status==='CONFIRMED').length  },
                        { label:'Completed', color:'#94a3b8', count: appointments.filter(a=>a.status==='COMPLETED').length  },
                        { label:'Cancelled', color:'#f87171', count: appointments.filter(a=>a.status==='CANCELLED').length  },
                    ].map(c => (
                        <div key={c.label} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:'10px', padding:'6px 14px', textAlign:'center' }}>
                            <div style={{ fontSize:'16px', fontWeight:800, color:c.color }}>{c.count}</div>
                            <div style={{ fontSize:'9px', color:'rgba(255,255,255,.5)', fontWeight:600 }}>{c.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 24px' }}>

                {error && (
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'12px' }}>
                        ⚠️ {error}
                    </div>
                )}
                {success && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'12px' }}>
                        ✅ {success}
                    </div>
                )}

                {/* Filter tabs */}
                <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' }}>
                    {['ALL','BOOKED','CONFIRMED','COMPLETED','CANCELLED'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding:'6px 16px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer',
                            border: filter===f ? 'none' : '1px solid #e2e8f0',
                            background: filter===f ? '#185FA5' : '#fff',
                            color: filter===f ? '#fff' : '#6b7280',
                            boxShadow: filter===f ? '0 2px 8px rgba(24,95,165,.25)' : 'none',
                            transition:'all .15s',
                        }}>
                            {f === 'ALL'
                                ? `All (${appointments.length})`
                                : `${f.charAt(0)+f.slice(1).toLowerCase()} (${appointments.filter(a=>a.status===f).length})`
                            }
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div style={{ background:'#fff', borderRadius:'16px', border:'1px solid #e8edf2', boxShadow:'0 1px 6px rgba(0,0,0,.04)', overflow:'hidden' }}>
                    {loading ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>
                            <div style={{ fontSize:'28px', marginBottom:'10px' }}>⏳</div>
                            Loading appointments...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding:'60px', textAlign:'center', color:'#94a3b8', fontSize:'13px' }}>
                            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🗓️</div>
                            No appointments found.
                        </div>
                    ) : (
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                            <tr>
                                {['Patient','Date & Time','Reason','Status','Actions'].map(h => (
                                    <th key={h} style={s.th}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {filtered.map((appt, idx) => {
                                const sc = statusConfig[appt.status] || statusConfig.BOOKED;
                                const [abg, atc] = avatarPalette[idx % avatarPalette.length];
                                const ini = appt.patientName?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';
                                const dt = appt.appointmentTime ? new Date(appt.appointmentTime) : null;

                                return (
                                    <React.Fragment key={appt.id}>
                                        <tr className="appt-row" style={{ transition:'background .12s' }}>

                                            <td style={s.td}>
                                                <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                                                    <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:abg, color:atc, fontSize:'11px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                        {ini}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight:600, color:'#0f172a', fontSize:'12px' }}>{appt.patientName || '—'}</div>
                                                        <div style={{ fontSize:'10px', color:'#94a3b8' }}>
                                                            #{appt.id}
                                                            {appt.prescriptionId && (
                                                                <span style={{ marginLeft:'5px', background:'#EFF6FF', color:'#185FA5', padding:'1px 5px', borderRadius:'4px', fontSize:'9px', fontWeight:600 }}>💊 Rx</span>
                                                            )}
                                                            {appt.medicalRecordId && (
                                                                <span style={{ marginLeft:'3px', background:'#f0fdf4', color:'#15803d', padding:'1px 5px', borderRadius:'4px', fontSize:'9px', fontWeight:600 }}>📋 MR</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={s.td}>
                                                {dt ? (
                                                    <div>
                                                        <div style={{ fontWeight:600, color:'#0f172a', fontSize:'12px' }}>
                                                            {dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                                                        </div>
                                                        <div style={{ fontSize:'11px', color:'#185FA5', marginTop:'2px', fontWeight:500 }}>
                                                            🕐 {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                                                        </div>
                                                    </div>
                                                ) : '—'}
                                            </td>

                                            <td style={{ ...s.td, maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                                {appt.reason
                                                    ? <span>{appt.reason}</span>
                                                    : <span style={{ color:'#cbd5e1', fontStyle:'italic' }}>No reason</span>
                                                }
                                            </td>

                                            <td style={s.td}>
                                                    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:sc.bg, color:sc.color, padding:'4px 11px', borderRadius:'20px', fontSize:'10px', fontWeight:600 }}>
                                                        <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:sc.dot, flexShrink:0 }}/>
                                                        {sc.label}
                                                    </span>
                                            </td>

                                            <td style={s.td}>
                                                <ActionButtons appt={appt} />
                                            </td>
                                        </tr>

                                        {reassigning === appt.id && (
                                            <tr>
                                                <td colSpan={5} style={{ padding:'12px 16px', background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                                                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                                                        <select
                                                            style={{ flex:1, border:'1px solid #e2e8f0', borderRadius:'9px', padding:'8px 12px', fontSize:'12px', outline:'none', background:'#fff' }}
                                                            value={selectedDoc}
                                                            onChange={e => setSelectedDoc(e.target.value)}>
                                                            <option value="">Select doctor...</option>
                                                            {doctors.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleReassign(appt.id)}
                                                            disabled={!selectedDoc}
                                                            style={{ padding:'8px 16px', borderRadius:'9px', border:'none', background: selectedDoc ? '#185FA5' : '#9ca3af', color:'#fff', fontSize:'12px', fontWeight:600, cursor: selectedDoc ? 'pointer' : 'not-allowed' }}>
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setReassigning(null)}
                                                            style={{ padding:'8px 16px', borderRadius:'9px', border:'1px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Bottom tip */}
                <div style={{ marginTop:'14px', padding:'12px 16px', background:'#eff6ff', borderRadius:'10px', fontSize:'11px', color:'#1e40af', lineHeight:1.7, display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span style={{ fontSize:'16px', flexShrink:0 }}>💡</span>
                    <div>
                        <strong>Tip:</strong> Click <strong>Write Rx</strong> to add prescription,
                        <strong> Add Record</strong> for medical record.
                        Once added, buttons change to <strong>View Rx</strong> / <strong>View Record</strong>.
                        Use <strong>✓ Done</strong> to mark appointment completed.
                    </div>
                </div>
            </div>
        </div>
    );
}