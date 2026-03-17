import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function AddPrescription() {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchRes,   setSearchRes]   = useState([]);
    const [selected,    setSelected]    = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [success,     setSuccess]     = useState(false);
    const [error,       setError]       = useState('');

    useEffect(() => {
        if (!searchQuery.trim()) { setSearchRes([]); return; }
        const t = setTimeout(async () => {
            try {
                const { data } = await api.get('/medicines/search', { params: { name: searchQuery } });
                setSearchRes(data);
            } catch { setSearchRes([]); }
        }, 400);
        return () => clearTimeout(t);
    }, [searchQuery]);

    function addMedicine(med) {
        if (selected.find(m => m.medicineId === med.id)) return;
        setSelected(prev => [...prev, {
            medicineId: med.id, medicineName: med.name, type: med.type,
            frequency: 'Twice daily', durationDays: 7,
            instructions: 'After meals', quantity: 14,
        }]);
        setSearchQuery(''); setSearchRes([]);
    }

    function removeMedicine(id) {
        setSelected(prev => prev.filter(m => m.medicineId !== id));
    }

    function updateMed(id, key, value) {
        setSelected(prev => prev.map(m => m.medicineId === id ? { ...m, [key]: value } : m));
    }

    async function handleSubmit() {
        if (!selected.length) { setError('Add at least one medicine'); return; }
        setLoading(true); setError('');
        try {
            // FIX: correct endpoint, NO diagnosis/notes (those go in MedicalRecord)
            await api.post(`/doctors/appointments/${appointmentId}/prescription`, {
                medicines: selected.map(m => ({
                    medicineId:   m.medicineId,
                    frequency:    m.frequency,
                    durationDays: Number(m.durationDays),
                    instructions: m.instructions,
                    quantity:     Number(m.quantity),
                })),
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create prescription');
        } finally { setLoading(false); }
    }

    const inp = {
        width: '100%', border: '1px solid #e2e8f0', borderRadius: '9px',
        padding: '9px 12px', fontSize: '12px', outline: 'none',
        background: '#fafbfc', fontFamily: "'DM Sans','Outfit',sans-serif",
        transition: 'border .15s', boxSizing: 'border-box',
    };

    const frequencyOptions = [
        'Once daily','Twice daily','Three times daily','Four times daily',
        'Every 6 hours','Every 8 hours','At bedtime','Before meals','After meals','As needed',
    ];

    if (success) return (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'#f0f4f8', minHeight:'100%' }}>
            <div style={{ background:'#fff', borderRadius:'20px', padding:'40px 36px', maxWidth:'440px', width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,.10)', border:'1px solid #e8edf2' }}>
                <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', margin:'0 auto 18px', border:'2px solid #bbf7d0' }}>✅</div>
                <div style={{ fontSize:'22px', fontWeight:700, color:'#166534', marginBottom:'6px', fontFamily:"'Playfair Display',serif" }}>Prescription Created!</div>
                <p style={{ fontSize:'12px', color:'#6b7280', marginBottom:'28px', lineHeight:1.8 }}>
                    Prescription saved for <strong>Appointment #{appointmentId}</strong>.<br/>
                    Now add the medical record with diagnosis and notes.
                </p>
                <button
                    onClick={() => navigate(`/doctor/appointments/${appointmentId}/record`)}
                    style={{ width:'100%', padding:'13px', borderRadius:'11px', border:'none', background:'linear-gradient(135deg,#185FA5,#0f3460)', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', marginBottom:'9px', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}>
                    📋 Add Medical Record Now
                </button>
                <button
                    onClick={() => navigate('/doctor/appointments')}
                    style={{ width:'100%', padding:'13px', borderRadius:'11px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'13px', fontWeight:600, cursor:'pointer', marginBottom:'9px', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}>
                    ⏭️ Skip — Do it Later
                </button>
                <button
                    onClick={() => navigate('/doctor/prescriptions')}
                    style={{ width:'100%', padding:'11px', borderRadius:'11px', border:'none', background:'#f8fafc', color:'#94a3b8', fontSize:'12px', fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}>
                    💊 View All Prescriptions
                </button>
                <div style={{ marginTop:'20px', padding:'12px 14px', background:'#eff6ff', borderRadius:'10px', fontSize:'11px', color:'#1e40af', lineHeight:1.7, textAlign:'left' }}>
                    💡 Diagnosis & notes go in <strong>Medical Record</strong>, not prescription.<br/>
                    Add it now or from <strong>Appointments → Add Record</strong>.
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                .med-inp:focus { border-color:#185FA5!important; }
                .search-item:hover { background:#f0f7ff!important; }
                .remove-btn:hover { background:#fee2e2!important; }
            `}</style>

            {/* Topbar */}
            <div style={{ background:'linear-gradient(135deg,#0f3460,#185FA5)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <div>
                    <div style={{ fontSize:'10px', color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Patient Care</div>
                    <div style={{ fontSize:'18px', fontWeight:700, color:'#fff', fontFamily:"'Playfair Display',serif" }}>💊 Write Prescription</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,.55)', marginTop:'2px' }}>Appointment #{appointmentId}</div>
                </div>
                <button onClick={() => navigate('/doctor/appointments')} style={{ padding:'8px 18px', borderRadius:'9px', border:'1px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.12)', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>← Back</button>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
                {error && (
                    <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontSize:'12px', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>⚠️ {error}</div>
                )}

                {/* Info banner — remind doctor diagnosis goes in medical record */}
                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'10px 14px', marginBottom:'14px', fontSize:'11px', color:'#92400e', display:'flex', alignItems:'center', gap:'8px' }}>
                    💡 <span>Only add <strong>medicines</strong> here. Diagnosis & notes go in the <strong>Medical Record</strong>.</span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', height:'calc(100% - 80px)' }}>

                    {/* LEFT — Medicine Search */}
                    <div style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:'14px', padding:'18px', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'14px' }}>🔍 Search & Add Medicines</div>
                        <div style={{ position:'relative' }}>
                            <input
                                className="med-inp" style={inp}
                                placeholder="Type medicine name... e.g. Paracetamol"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchRes.length > 0 && (
                                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', zIndex:50, marginTop:'4px', boxShadow:'0 8px 24px rgba(0,0,0,.12)', maxHeight:'220px', overflowY:'auto' }}>
                                    {searchRes.map(med => (
                                        <div key={med.id} className="search-item" onClick={() => addMedicine(med)}
                                             style={{ padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'background .12s' }}>
                                            <div>
                                                <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a' }}>{med.name}</div>
                                                <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px' }}>{med.type} · ₹{med.price}</div>
                                            </div>
                                            <span style={{ background:'#EFF6FF', color:'#185FA5', padding:'3px 10px', borderRadius:'6px', fontSize:'10px', fontWeight:700, flexShrink:0 }}>+ Add</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selected.length === 0 && (
                            <div style={{ textAlign:'center', padding:'20px', color:'#cbd5e1', fontSize:'12px', marginTop:'8px' }}>Search above to add medicines</div>
                        )}
                    </div>

                    {/* RIGHT — Selected Medicines */}
                    <div style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:'14px', padding:'18px', display:'flex', flexDirection:'column', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            Selected Medicines
                            {selected.length > 0 && (
                                <span style={{ background:'#185FA5', color:'#fff', padding:'2px 10px', borderRadius:'20px', fontSize:'10px', fontWeight:700 }}>{selected.length}</span>
                            )}
                        </div>

                        {selected.length === 0 ? (
                            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'8px', color:'#cbd5e1', fontSize:'12px', textAlign:'center', padding:'20px' }}>
                                <div style={{ fontSize:'40px' }}>💊</div>
                                <div style={{ fontWeight:600, color:'#94a3b8' }}>No medicines added yet</div>
                                <div style={{ fontSize:'11px' }}>Search and add from the left panel</div>
                            </div>
                        ) : (
                            <div style={{ display:'flex', flexDirection:'column', gap:'10px', flex:1, overflowY:'auto', marginBottom:'12px' }}>
                                {selected.map(med => (
                                    <div key={med.medicineId} style={{ background:'#f8fafc', borderRadius:'12px', padding:'13px', border:'1px solid #f1f5f9' }}>
                                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                                            <div>
                                                <div style={{ fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{med.medicineName}</div>
                                                <div style={{ fontSize:'10px', color:'#94a3b8', marginTop:'1px' }}>{med.type}</div>
                                            </div>
                                            <button className="remove-btn" onClick={() => removeMedicine(med.medicineId)}
                                                    style={{ background:'#fef2f2', border:'none', borderRadius:'7px', padding:'4px 10px', color:'#dc2626', fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'background .12s' }}>
                                                Remove
                                            </button>
                                        </div>
                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                                            <div>
                                                <label style={{ fontSize:'10px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'3px' }}>Frequency</label>
                                                <select className="med-inp" style={{ ...inp, padding:'6px 9px' }} value={med.frequency} onChange={e => updateMed(med.medicineId,'frequency',e.target.value)}>
                                                    {frequencyOptions.map(f => <option key={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize:'10px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'3px' }}>Duration (days)</label>
                                                <input type="number" className="med-inp" style={{ ...inp, padding:'6px 9px' }} value={med.durationDays} min="1" onChange={e => updateMed(med.medicineId,'durationDays',e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize:'10px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'3px' }}>Quantity</label>
                                                <input type="number" className="med-inp" style={{ ...inp, padding:'6px 9px' }} value={med.quantity} min="1" onChange={e => updateMed(med.medicineId,'quantity',e.target.value)} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize:'10px', fontWeight:600, color:'#64748b', display:'block', marginBottom:'3px' }}>Instructions</label>
                                                <input className="med-inp" style={{ ...inp, padding:'6px 9px' }} value={med.instructions} placeholder="e.g. After meals" onChange={e => updateMed(med.medicineId,'instructions',e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selected.length > 0 && (
                            <button onClick={handleSubmit} disabled={loading}
                                    style={{ width:'100%', padding:'13px', borderRadius:'11px', border:'none', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#185FA5,#0f3460)', color:'#fff', fontSize:'13px', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', transition:'opacity .15s' }}>
                                {loading ? '⏳ Creating...' : `✓ Create Prescription (${selected.length} medicine${selected.length > 1 ? 's' : ''})`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}