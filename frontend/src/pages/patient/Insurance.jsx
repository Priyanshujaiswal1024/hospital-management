import { useEffect, useState } from 'react';
import api                     from '../../api/axios';

export default function Insurance() {
    const [insurance, setInsurance] = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [success, setSuccess]     = useState('');
    const [error, setError]         = useState('');
    const [form, setForm]           = useState({
        provider:     '',
        policyNumber: '',
        validUntil:   '',
    });

    useEffect(() => { fetchInsurance(); }, []);

    async function fetchInsurance() {
        setLoading(true);
        try {
            const { data } = await api.get('/patient/insurance');
            setInsurance(data);
        } catch {
            setInsurance(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.provider || !form.policyNumber || !form.validUntil) {
            setError('All fields are required'); return;
        }
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/patient/insurance', form);
            setSuccess('Insurance saved successfully!');
            setForm({ provider:'', policyNumber:'', validUntil:'' });
            fetchInsurance();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save insurance');
        } finally {
            setSaving(false);
        }
    }

    const set  = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const inp  = {
        width:'100%', border:'1px solid #e5e7eb', borderRadius:'9px',
        padding:'9px 12px', fontSize:'12px', outline:'none',
        background:'#fafafa', fontFamily:'Outfit, sans-serif',
    };
    const lbl  = {
        fontSize:'10px', fontWeight:600, color:'#374151',
        textTransform:'uppercase', letterSpacing:'.04em',
        marginBottom:'3px', display:'block',
    };

    // check if insurance is active
    const isActive = insurance?.validUntil
        ? new Date(insurance.validUntil) >= new Date()
        : false;

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px',
                position:'sticky', top:0, zIndex:10,
            }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>Insurance</div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                    Your health insurance details
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                <div style={{ maxWidth:'520px' }}>

                    {/* current insurance card */}
                    {loading ? (
                        <div style={{
                            background:'#f9fafb', border:'1px solid #f0f0f0',
                            borderRadius:'14px', padding:'24px',
                            textAlign:'center', color:'#9ca3af', fontSize:'13px',
                            marginBottom:'16px',
                        }}>Loading insurance details...</div>
                    ) : insurance ? (
                        <div style={{
                            background:'linear-gradient(120deg,#0a4f3a,#1D9E75)',
                            borderRadius:'14px', padding:'22px 24px',
                            color:'#fff', marginBottom:'16px',
                            position:'relative', overflow:'hidden',
                        }}>
                            {/* decorative circle */}
                            <div style={{
                                position:'absolute', right:'-20px', top:'-20px',
                                width:'100px', height:'100px', borderRadius:'50%',
                                background:'rgba(255,255,255,.07)',
                            }} />

                            {/* status badge */}
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
                                <div style={{ fontSize:'10px', opacity:.7, textTransform:'uppercase', letterSpacing:'.08em' }}>
                                    Health Insurance
                                </div>
                                <span style={{
                                    background: isActive ? 'rgba(255,255,255,.2)' : 'rgba(239,68,68,.3)',
                                    border: isActive ? '1px solid rgba(255,255,255,.3)' : '1px solid rgba(239,68,68,.5)',
                                    padding:'3px 10px', borderRadius:'8px',
                                    fontSize:'10px', fontWeight:700,
                                    color: isActive ? '#fff' : '#fca5a5',
                                }}>
                                    {isActive ? '✓ Active' : '✗ Expired'}
                                </span>
                            </div>

                            <div style={{
                                fontSize:'18px', fontWeight:700,
                                fontFamily:"'Playfair Display', serif",
                                marginBottom:'14px',
                            }}>
                                {insurance.provider}
                            </div>

                            <div style={{
                                display:'grid', gridTemplateColumns:'1fr 1fr',
                                gap:'12px', fontSize:'11px',
                            }}>
                                <div>
                                    <div style={{ opacity:.65, marginBottom:'2px' }}>Policy Number</div>
                                    <div style={{ fontWeight:600 }}>{insurance.policyNumber}</div>
                                </div>
                                <div>
                                    <div style={{ opacity:.65, marginBottom:'2px' }}>Valid Until</div>
                                    <div style={{ fontWeight:600 }}>
                                        {new Date(insurance.validUntil).toLocaleDateString('en-IN', {
                                            day:'numeric', month:'long', year:'numeric',
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            background:'#fffbeb', border:'1px solid #fef3c7',
                            borderRadius:'12px', padding:'16px', marginBottom:'16px',
                            display:'flex', alignItems:'center', gap:'10px',
                        }}>
                            <span style={{ fontSize:'20px' }}>⚠️</span>
                            <div>
                                <div style={{ fontSize:'12px', fontWeight:600, color:'#92400e' }}>
                                    No insurance found
                                </div>
                                <div style={{ fontSize:'11px', color:'#92400e', opacity:.8, marginTop:'2px' }}>
                                    Add your insurance details below
                                </div>
                            </div>
                        </div>
                    )}

                    {/* add / update form */}
                    <div style={{
                        background:'#fff', border:'1px solid #f0f0f0',
                        borderRadius:'12px', padding:'16px',
                    }}>
                        <div style={{
                            fontSize:'10px', fontWeight:700, color:'#9ca3af',
                            textTransform:'uppercase', letterSpacing:'.07em', marginBottom:'14px',
                        }}>
                            {insurance ? 'Update Insurance' : 'Add Insurance'}
                        </div>

                        {success && (
                            <div style={{
                                background:'#f0fdf4', border:'1px solid #bbf7d0',
                                color:'#166534', fontSize:'12px', borderRadius:'9px',
                                padding:'10px 14px', marginBottom:'12px',
                            }}>✅ {success}</div>
                        )}
                        {error && (
                            <div style={{
                                background:'#fef2f2', border:'1px solid #fecaca',
                                color:'#dc2626', fontSize:'12px', borderRadius:'9px',
                                padding:'10px 14px', marginBottom:'12px',
                            }}>⚠️ {error}</div>
                        )}

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom:'10px' }}>
                                <label style={lbl}>Provider Name</label>
                                <input
                                    style={inp}
                                    placeholder="e.g. Star Health, HDFC Ergo"
                                    value={form.provider}
                                    onChange={set('provider')}
                                    onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                            <div style={{ marginBottom:'10px' }}>
                                <label style={lbl}>Policy Number</label>
                                <input
                                    style={inp}
                                    placeholder="e.g. SH-20240324-001"
                                    value={form.policyNumber}
                                    onChange={set('policyNumber')}
                                    onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                            <div style={{ marginBottom:'14px' }}>
                                <label style={lbl}>Valid Until</label>
                                <input
                                    type="date"
                                    style={inp}
                                    value={form.validUntil}
                                    onChange={set('validUntil')}
                                    onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    width:'100%', padding:'11px', borderRadius:'10px',
                                    border:'none', background: saving ? '#9ca3af' : '#0a4f3a',
                                    color:'#fff', fontSize:'13px', fontWeight:600,
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {saving ? 'Saving...' : insurance ? 'Update Insurance' : 'Add Insurance'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}