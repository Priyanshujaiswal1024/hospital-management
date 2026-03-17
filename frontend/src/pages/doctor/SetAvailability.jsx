import { useState } from 'react';
import api from '../../api/axios';

export default function SetAvailability() {
    const [form, setForm] = useState({
        date:      '',
        startTime: '09:00',
        endTime:   '13:00',
    });
    const [loading,  setLoading]  = useState(false);
    const [success,  setSuccess]  = useState('');
    const [error,    setError]    = useState('');
    const [slots,    setSlots]    = useState([]);

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    // preview slots — 30 min each
    function getSlotTimes() {
        if (!form.startTime || !form.endTime) return [];
        const [sh, sm] = form.startTime.split(':').map(Number);
        const [eh, em] = form.endTime.split(':').map(Number);
        const result = [];
        let cur = sh * 60 + sm;
        const end = eh * 60 + em;
        while (cur + 30 <= end) {
            const hh = String(Math.floor(cur / 60)).padStart(2, '0');
            const mm = String(cur % 60).padStart(2, '0');
            result.push(`${hh}:${mm}`);
            cur += 30;
        }
        return result;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.date) { setError('Please select a date'); return; }
        if (form.startTime >= form.endTime) {
            setError('End time must be after start time'); return;
        }
        setError('');
        setLoading(true);
        try {
            await api.post('/doctors/availability', {
                date:      form.date,
                startTime: form.startTime + ':00',
                endTime:   form.endTime   + ':00',
            });
            setSuccess(`Availability added for ${new Date(form.date)
                .toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}!`);
            setSlots(getSlotTimes());
            setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
            const msg = err.response?.data?.message || '';
            if (msg.includes('already')) {
                setError('Availability already set for this date. Select another date or contact admin.');
            } else {
                setError(msg || 'Failed to add availability');
            }
        } finally {
            setLoading(false);
        }
    }

    const inp = {
        width:'100%', border:'1px solid #e5e7eb', borderRadius:'9px',
        padding:'9px 12px', fontSize:'12px', outline:'none',
        background:'#fafafa', fontFamily:'Outfit, sans-serif',
    };
    const lbl = {
        fontSize:'10px', fontWeight:600, color:'#374151',
        textTransform:'uppercase', letterSpacing:'.04em',
        marginBottom:'3px', display:'block',
    };

    const previewSlots = getSlotTimes();

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0',
                padding:'12px 20px', position:'sticky', top:0, zIndex:10,
                display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
                <div>
                    <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>
                        Set Availability
                    </div>
                    <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                        Add your available dates & time slots
                    </div>
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>

                    {/* LEFT — form */}
                    <div style={{
                        background:'#fff', border:'1px solid #f0f0f0',
                        borderRadius:'10px', padding:'16px',
                    }}>
                        <div style={{
                            fontSize:'10px', fontWeight:700, color:'#9ca3af',
                            textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px',
                        }}>Add Availability</div>

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

                        <form onSubmit={handleSubmit}>
                            {/* date */}
                            <div style={{ marginBottom:'12px' }}>
                                <label style={lbl}>Select Date</label>
                                <input
                                    type="date"
                                    style={inp}
                                    min={new Date().toISOString().split('T')[0]}
                                    value={form.date}
                                    onChange={set('date')}
                                    onFocus={e => e.target.style.borderColor = '#185FA5'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>

                            {/* time range */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                                <div>
                                    <label style={lbl}>Start Time</label>
                                    <input
                                        type="time"
                                        style={inp}
                                        value={form.startTime}
                                        onChange={set('startTime')}
                                        onFocus={e => e.target.style.borderColor = '#185FA5'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                                <div>
                                    <label style={lbl}>End Time</label>
                                    <input
                                        type="time"
                                        style={inp}
                                        value={form.endTime}
                                        onChange={set('endTime')}
                                        onFocus={e => e.target.style.borderColor = '#185FA5'}
                                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                    />
                                </div>
                            </div>

                            {/* slot duration info */}
                            <div style={{
                                background:'#EFF6FF', borderRadius:'8px',
                                padding:'10px 12px', marginBottom:'14px',
                                fontSize:'11px', color:'#1e40af',
                            }}>
                                ℹ️ Slots will be created in <strong>30 minute</strong> intervals
                                {previewSlots.length > 0 && (
                                    <span> — <strong>{previewSlots.length} slots</strong> will be created</span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width:'100%', padding:'11px', borderRadius:'10px',
                                    border:'none',
                                    background: loading ? '#9ca3af' : '#185FA5',
                                    color:'#fff', fontSize:'13px', fontWeight:600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display:'flex', alignItems:'center',
                                    justifyContent:'center', gap:'6px',
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg style={{ width:'16px', height:'16px', animation:'spin 1s linear infinite' }}
                                             xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle style={{ opacity:.25 }} cx="12" cy="12" r="10"
                                                    stroke="currentColor" strokeWidth="4"/>
                                            <path style={{ opacity:.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Adding...
                                    </>
                                ) : '+ Add Availability'}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT — preview */}
                    <div style={{
                        background:'#fff', border:'1px solid #f0f0f0',
                        borderRadius:'10px', padding:'16px',
                    }}>
                        <div style={{
                            fontSize:'10px', fontWeight:700, color:'#9ca3af',
                            textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px',
                        }}>Slot Preview</div>

                        {/* summary box */}
                        <div style={{
                            background:'#EFF6FF', borderRadius:'8px',
                            padding:'12px', marginBottom:'12px',
                        }}>
                            <div style={{ fontSize:'11px', color:'#1e40af', fontWeight:600, marginBottom:'4px' }}>
                                {form.date
                                    ? new Date(form.date + 'T00:00').toLocaleDateString('en-IN', {
                                        weekday:'long', day:'numeric', month:'long', year:'numeric'
                                    })
                                    : 'Select a date'
                                }
                            </div>
                            <div style={{ fontSize:'11px', color:'#1e40af' }}>
                                {form.startTime} – {form.endTime}
                                {previewSlots.length > 0 && (
                                    <span style={{ fontWeight:700 }}>
                                        {' '}· {previewSlots.length} slots × 30 min
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* slots grid */}
                        {previewSlots.length > 0 ? (
                            <div style={{
                                display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'6px',
                            }}>
                                {previewSlots.map((time, i) => (
                                    <div key={i} style={{
                                        padding:'7px 4px', borderRadius:'7px',
                                        fontSize:'11px', fontWeight:500, textAlign:'center',
                                        background:'#EFF6FF', color:'#185FA5',
                                        border:'1px solid #bfdbfe',
                                    }}>
                                        {time}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                textAlign:'center', padding:'30px',
                                color:'#9ca3af', fontSize:'12px',
                            }}>
                                Set start & end time to preview slots
                            </div>
                        )}

                        <div style={{
                            marginTop:'12px', padding:'10px', background:'#f9fafb',
                            borderRadius:'8px', fontSize:'11px', color:'#6b7280', lineHeight:1.7,
                        }}>
                            <div>✅ Patients can book these slots</div>
                            <div>📅 Shown on your public doctor profile</div>
                            <div>⏰ Add multiple dates separately</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}