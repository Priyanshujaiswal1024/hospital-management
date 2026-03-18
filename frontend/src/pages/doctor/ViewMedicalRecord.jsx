import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function ViewMedicalRecord() {
    const { recordId } = useParams();
    const navigate = useNavigate();
    const [record,  setRecord]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        // Fetch all records and find matching one
        // (uses same endpoint as DoctorMedicalRecords page)
        api.get('/doctors/medical-records')
            .then(({ data }) => {
                const found = (data || []).find(r => String(r.id) === String(recordId));
                if (found) setRecord(found);
                else setError('Medical record not found.');
            })
            .catch(() => setError('Failed to load medical record.'))
            .finally(() => setLoading(false));
    }, [recordId]);

    const cardStyle = {
        background: '#fff', borderRadius: '16px', border: '1px solid #e8edf2',
        boxShadow: '0 1px 6px rgba(0,0,0,.05)', padding: '20px 24px', marginBottom: '16px',
    };

    function InfoRow({ label, value, highlight }) {
        if (!value) return null;
        return (
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '5px' }}>{label}</div>
                <div style={{
                    fontSize: '13px', color: '#374151', lineHeight: 1.7,
                    background: highlight ? '#f8fafc' : 'transparent',
                    borderRadius: highlight ? '10px' : 0,
                    padding: highlight ? '10px 12px' : 0,
                    fontWeight: highlight ? 600 : 400,
                }}>
                    {value}
                </div>
            </div>
        );
    }

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
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: "'Playfair Display',serif" }}>📋 Medical Record</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.55)' }}>
                            MR-{String(recordId).padStart(4, '0')}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '28px', marginBottom: '10px' }}>⏳</div>
                        Loading medical record...
                    </div>
                )}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', padding: '14px', fontSize: '13px' }}>
                        ⚠️ {error}
                    </div>
                )}
                {record && (
                    <>
                        {/* Patient & Meta */}
                        <div style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Patient</div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>{record.patientName || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Appointment</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '3px' }}>#{record.appointmentId}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Visit Date</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginTop: '3px' }}>
                                        {record.visitDate
                                            ? new Date(record.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Record ID</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d', marginTop: '3px' }}>MR-{String(record.id).padStart(4, '0')}</div>
                                </div>
                            </div>

                            {/* Linked prescription badge */}
                            {record.prescriptionId && (
                                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                                    <span
                                        onClick={() => navigate(`/doctor/prescriptions/${record.prescriptionId}`)}
                                        style={{ background: '#EFF6FF', color: '#185FA5', padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                        💊 Linked Prescription #{record.prescriptionId} →
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Clinical Details */}
                        <div style={cardStyle}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '18px' }}>Clinical Details</div>
                            <InfoRow label="Diagnosis"        value={record.diagnosis}        highlight />
                            <InfoRow label="Symptoms"         value={record.symptoms} />
                            <InfoRow label="Treatment Plan"   value={record.treatmentPlan} />
                            <InfoRow label="Tests Recommended" value={record.testsRecommended} />
                            <InfoRow label="Doctor Notes"     value={record.notes} />
                        </div>

                        {/* Quick actions */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => navigate('/doctor/appointments')}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                📅 Back to Appointments
                            </button>
                            <button
                                onClick={() => navigate('/doctor/records')}
                                style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#15803d', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                📋 All Records
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}