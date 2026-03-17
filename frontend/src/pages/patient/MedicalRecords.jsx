import { useEffect, useState } from 'react';
import { downloadPdf }         from '../../utils/downloadPdf';
import api                     from '../../api/axios';

export default function MedicalRecords() {
    const [records, setRecords]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [downloading, setDownloading] = useState(null);
    const [expanded, setExpanded]       = useState(null);

    useEffect(() => {
        api.get('/medical-records/my')
            .then(({ data }) => setRecords(data))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []);

    async function handleDownload(id) {
        setDownloading(id);
        await downloadPdf(
            `/medical-records/${id}/download`,
            `medical-record-${id}.pdf`
        );
        setDownloading(null);
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px',
                position:'sticky', top:0, zIndex:10,
            }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>Medical Records</div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                    Your complete health history
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

                {loading ? (
                    <div style={{ textAlign:'center', padding:'60px', color:'#9ca3af', fontSize:'13px' }}>
                        Loading medical records...
                    </div>
                ) : records.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'60px', color:'#9ca3af', fontSize:'13px' }}>
                        No medical records found.
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        {records.map(rec => (
                            <div key={rec.id} style={{
                                background:'#fff', border:'1px solid #f0f0f0',
                                borderRadius:'12px', overflow:'hidden',
                            }}>
                                {/* record header */}
                                <div
                                    onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
                                    style={{
                                        padding:'14px 16px', display:'flex',
                                        alignItems:'center', justifyContent:'space-between',
                                        cursor:'pointer',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                >
                                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                        <div style={{
                                            width:'38px', height:'38px', borderRadius:'10px',
                                            background:'#E1F5EE', color:'#0a4f3a',
                                            fontSize:'16px', display:'flex',
                                            alignItems:'center', justifyContent:'center',
                                        }}>📋</div>
                                        <div>
                                            <div style={{ fontSize:'13px', fontWeight:600, color:'#111' }}>
                                                {rec.diagnosis || 'Medical Record'}
                                            </div>
                                            <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                                                {rec.visitDate
                                                    ? new Date(rec.visitDate).toLocaleDateString('en-IN', {
                                                        day:'numeric', month:'long', year:'numeric',
                                                    })
                                                    : '—'}
                                                {rec.doctorId && ` · Doctor #${rec.doctorId}`}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); handleDownload(rec.id); }}
                                            disabled={downloading === rec.id}
                                            style={{
                                                padding:'5px 10px', borderRadius:'7px',
                                                border:'1px solid #e5e7eb', background:'#fff',
                                                color:'#374151', fontSize:'11px',
                                                fontWeight:600, cursor:'pointer',
                                            }}
                                        >
                                            {downloading === rec.id ? '...' : '⬇ PDF'}
                                        </button>
                                        <span style={{ color:'#d1d5db', fontSize:'12px' }}>
                                            {expanded === rec.id ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {/* expanded details */}
                                {expanded === rec.id && (
                                    <div style={{
                                        borderTop:'1px solid #f9fafb',
                                        padding:'14px 16px',
                                        background:'#fafafa',
                                    }}>
                                        <div style={{
                                            display:'grid', gridTemplateColumns:'1fr 1fr',
                                            gap:'12px',
                                        }}>
                                            {[
                                                { label:'Diagnosis',          value: rec.diagnosis },
                                                { label:'Treatment',          value: rec.treatment },
                                                { label:'Symptoms',           value: rec.symptoms },
                                                { label:'Medicines',          value: rec.medicines },
                                                { label:'Tests Recommended',  value: rec.testsRecommended },
                                                { label:'Follow-up Date',     value: rec.followUpDate
                                                        ? new Date(rec.followUpDate).toLocaleDateString('en-IN')
                                                        : null },
                                            ].map(f => f.value ? (
                                                <div key={f.label}>
                                                    <div style={{
                                                        fontSize:'10px', fontWeight:700, color:'#9ca3af',
                                                        textTransform:'uppercase', letterSpacing:'.05em',
                                                        marginBottom:'3px',
                                                    }}>{f.label}</div>
                                                    <div style={{ fontSize:'12px', color:'#374151', lineHeight:1.6 }}>
                                                        {f.value}
                                                    </div>
                                                </div>
                                            ) : null)}

                                            {rec.notes && (
                                                <div style={{ gridColumn:'1/-1' }}>
                                                    <div style={{
                                                        fontSize:'10px', fontWeight:700, color:'#9ca3af',
                                                        textTransform:'uppercase', letterSpacing:'.05em',
                                                        marginBottom:'3px',
                                                    }}>Doctor Notes</div>
                                                    <div style={{
                                                        fontSize:'12px', color:'#374151',
                                                        lineHeight:1.7, background:'#fff',
                                                        border:'1px solid #f0f0f0', borderRadius:'8px',
                                                        padding:'10px 12px',
                                                    }}>
                                                        {rec.notes}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}