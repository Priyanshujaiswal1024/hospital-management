import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function CreateMedicalRecord() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        diagnosis: '', notes: '', symptoms: '',
        treatmentPlan: '', testsRecommended: '', prescriptionId: ''
    });
    const [loading,  setLoading]  = useState(false);
    const [success,  setSuccess]  = useState(false);
    const [error,    setError]    = useState('');
    const [rxAutoFilled, setRxAutoFilled] = useState(false);

    // ── AUTO-FETCH prescription ID for this appointment ──
    useEffect(() => {
        api.get('/doctors/prescriptions')
            .then(r => {
                const match = (r.data || []).find(
                    p => String(p.appointmentId) === String(appointmentId)
                );
                if (match) {
                    setForm(f => ({ ...f, prescriptionId: match.id }));
                    setRxAutoFilled(true);
                }
            })
            .catch(() => {});
    }, [appointmentId]);

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.diagnosis.trim()) { setError('Diagnosis is required'); return; }
        setError(''); setLoading(true);
        try {
            await api.post('/medical-records', {
                appointmentId:    Number(appointmentId),
                prescriptionId:   form.prescriptionId ? Number(form.prescriptionId) : null,
                diagnosis:        form.diagnosis,
                notes:            form.notes,
                symptoms:         form.symptoms,
                treatmentPlan:    form.treatmentPlan,
                testsRecommended: form.testsRecommended,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create medical record');
        } finally { setLoading(false); }
    }

    const inp = {
        width:'100%', border:'1px solid #e5e7eb', borderRadius:'9px',
        padding:'9px 12px', fontSize:'12px', outline:'none',
        background:'#fafafa', fontFamily:'Outfit, sans-serif',
        boxSizing:'border-box',
    };

    if (success) return (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
            <div style={{ background:'#fff', borderRadius:'16px', padding:'40px', maxWidth:'400px', width:'100%', textAlign:'center', border:'1px solid #f0f0f0' }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 16px' }}>📋</div>
                <div style={{ fontSize:'18px', fontWeight:700, color:'#166534', marginBottom:'8px' }}>Medical Record Created!</div>
                <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'20px', lineHeight:1.7 }}>
                    Record saved for appointment #{appointmentId}.
                    {form.prescriptionId && <><br/>Linked to Prescription #{form.prescriptionId}.</>}
                </p>
                <button onClick={() => navigate('/doctor/appointments')}
                        style={{ width:'100%', padding:'11px', borderRadius:'10px', border:'none', background:'#185FA5', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                    Back to Appointments
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'Outfit,sans-serif' }}>
            <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
                <div>
                    <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>Create Medical Record</div>
                    <div style={{ fontSize:'11px', color:'#9ca3af' }}>Appointment #{appointmentId}</div>
                </div>
                <button onClick={() => navigate('/doctor/appointments')}
                        style={{ padding:'7px 14px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                    ← Back
                </button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                <div style={{ maxWidth:'600px' }}>
                    {error && (
                        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'9px', padding:'10px 14px', marginBottom:'14px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ background:'#fff', border:'1px solid #f0f0f0', borderRadius:'12px', padding:'20px' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'16px' }}>
                            Medical Record Details
                        </div>
                        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

                            <div>
                                <label style={{ fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block', textTransform:'uppercase', letterSpacing:'.04em' }}>Diagnosis *</label>
                                <input style={inp} placeholder="e.g. Acute Viral Fever..." value={form.diagnosis} onChange={set('diagnosis')} required />
                            </div>

                            <div>
                                <label style={{ fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block', textTransform:'uppercase', letterSpacing:'.04em' }}>Symptoms</label>
                                <input style={inp} placeholder="e.g. Headache, fever, fatigue..." value={form.symptoms} onChange={set('symptoms')} />
                            </div>

                            <div>
                                <label style={{ fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block', textTransform:'uppercase', letterSpacing:'.04em' }}>Treatment Plan</label>
                                <textarea style={{ ...inp, resize:'none', minHeight:'80px' }} placeholder="e.g. Rest, hydration..." value={form.treatmentPlan} onChange={set('treatmentPlan')} />
                            </div>

                            <div>
                                <label style={{ fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block', textTransform:'uppercase', letterSpacing:'.04em' }}>Tests Recommended</label>
                                <input style={inp} placeholder="e.g. CBC, Lipid profile..." value={form.testsRecommended} onChange={set('testsRecommended')} />
                            </div>

                            <div>
                                <label style={{ fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block', textTransform:'uppercase', letterSpacing:'.04em' }}>Doctor Notes</label>
                                <textarea style={{ ...inp, resize:'none', minHeight:'80px' }} placeholder="Additional notes..." value={form.notes} onChange={set('notes')} />
                            </div>

                            {/* Prescription ID — auto-filled, read-only if found */}
                            <div>
                                <label style={{ fontSize:'11px', fontWeight:600, color:'#374151', marginBottom:'4px', display:'block', textTransform:'uppercase', letterSpacing:'.04em' }}>
                                    Prescription ID
                                    {rxAutoFilled && (
                                        <span style={{ marginLeft:'8px', background:'#dcfce7', color:'#15803d', padding:'1px 7px', borderRadius:'10px', fontSize:'9px', fontWeight:700, textTransform:'none' }}>
                                            ✅ Auto-linked
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number" style={{
                                    ...inp,
                                    background: rxAutoFilled ? '#f0fdf4' : '#fafafa',
                                    border: rxAutoFilled ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                                    cursor: rxAutoFilled ? 'not-allowed' : 'text',
                                }}
                                    placeholder="Auto-filled if prescription exists"
                                    value={form.prescriptionId}
                                    onChange={rxAutoFilled ? undefined : set('prescriptionId')}
                                    readOnly={rxAutoFilled}
                                />
                                <div style={{ fontSize:'10px', color:'#9ca3af', marginTop:'3px' }}>
                                    {rxAutoFilled
                                        ? `Prescription #${form.prescriptionId} auto-linked from this appointment`
                                        : 'Leave blank if no prescription was created'
                                    }
                                </div>
                            </div>

                            <div style={{ background:'#EFF6FF', borderRadius:'9px', padding:'12px', fontSize:'11px', color:'#1e40af', lineHeight:1.7 }}>
                                <div style={{ fontWeight:600, marginBottom:'3px' }}>ℹ️ Appointment #{appointmentId}</div>
                                <div>This record will be visible to the patient and downloadable as PDF.</div>
                            </div>

                            <button type="submit" disabled={loading}
                                    style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'none', background: loading ? '#9ca3af' : '#185FA5', color:'#fff', fontSize:'13px', fontWeight:600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                                {loading ? 'Saving...' : '📋 Save Medical Record'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}