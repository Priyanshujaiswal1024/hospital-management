import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function ViewPrescription() {
    const { prescriptionId } = useParams();
    const navigate = useNavigate();
    const [rx,      setRx]      = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        // Fetch all prescriptions list and find matching one
        // (uses same endpoint as DoctorPrescriptions page)
        api.get('/doctors/prescriptions')
            .then(({ data }) => {
                const found = (data || []).find(p => String(p.id) === String(prescriptionId));
                if (found) setRx(found);
                else setError('Prescription not found.');
            })
            .catch(() => setError('Failed to load prescription.'))
            .finally(() => setLoading(false));
    }, [prescriptionId]);

    async function downloadPdf() {
        try {
            const res = await api.get(`/prescriptions/${prescriptionId}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a');
            a.href = url; a.download = `prescription-${prescriptionId}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
    }

    const cardStyle = {
        background: '#fff', borderRadius: '16px', border: '1px solid #e8edf2',
        boxShadow: '0 1px 6px rgba(0,0,0,.05)', padding: '20px 24px', marginBottom: '16px',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f0f4f8', fontFamily: "'DM Sans','Outfit',sans-serif" }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#0f3460,#185FA5)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '9px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        ← Back
                    </button>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',serif" }}>💊 Prescription</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.55)' }}>Rx #{prescriptionId}</div>
                    </div>
                </div>
                {rx && (
                    <button onClick={downloadPdf} style={{ padding: '8px 16px', borderRadius: '9px', border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        ⬇ Download PDF
                    </button>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>
                        Loading prescription...
                    </div>
                )}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', padding: '14px', fontSize: '13px' }}>
                        ⚠️ {error}
                    </div>
                )}
                {rx && (
                    <>
                        {/* Patient & Meta */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Patient</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{rx.patientName || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Appointment</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '3px' }}>#{rx.appointmentId}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Date</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '3px' }}>
                                        {rx.createdAt
                                            ? new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Rx ID</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#185FA5', marginTop: '3px' }}>#{rx.id}</div>
                                </div>
                            </div>
                        </div>

                        {/* Medicines Table */}
                        <div style={cardStyle}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '14px' }}>
                                Prescribed Medicines
                                <span style={{ marginLeft: '8px', background: '#EFF6FF', color: '#185FA5', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
                                    {rx.medicines?.length || 0} {rx.medicines?.length === 1 ? 'medicine' : 'medicines'}
                                </span>
                            </div>

                            {rx.medicines && rx.medicines.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                    <tr>
                                        {['#', 'Medicine', 'Frequency', 'Duration', 'Qty', 'Instructions'].map(h => (
                                            <th key={h} style={{
                                                textAlign: 'left', fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                                                padding: '8px 12px', borderBottom: '2px solid #f1f5f9',
                                                textTransform: 'uppercase', letterSpacing: '.06em', background: '#f8fafc',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {rx.medicines.map((m, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '11px 12px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{i + 1}</td>
                                            <td style={{ padding: '11px 12px' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{m.medicineName || m.name || '—'}</div>
                                                {m.type && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{m.type}</div>}
                                            </td>
                                            <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{m.frequency || '—'}</td>
                                            <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>
                                                {m.durationDays ? `${m.durationDays} days` : '—'}
                                            </td>
                                            <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{m.quantity || '—'}</td>
                                            <td style={{ padding: '11px 12px', fontSize: '12px', color: '#374151' }}>{m.instructions || '—'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                                    No medicines listed.
                                </div>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                📅 Back to Appointments
                            </button>
                            <button
                                onClick={() => navigate('/doctor/prescriptions')}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#185FA5', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                💊 All Prescriptions
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}