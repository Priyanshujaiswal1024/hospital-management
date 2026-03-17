import { useEffect, useState } from 'react';
import { downloadPdf }         from '../../utils/downloadPdf';
import api                     from '../../api/axios';

export default function Prescriptions() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [downloading, setDownloading]     = useState(null);

    useEffect(() => {
        api.get('/patient/Prescription')
            .then(({ data }) => setPrescriptions(data))
            .catch(() => setPrescriptions([]))
            .finally(() => setLoading(false));
    }, []);

    async function handleDownload(id) {
        setDownloading(id);
        await downloadPdf(
            `/prescriptions/${id}/download`,
            `prescription-${id}.pdf`
        );
        setDownloading(null);
    }

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
                background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px',
                position:'sticky', top:0, zIndex:10,
            }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>My Prescriptions</div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                    All prescriptions from your doctors
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                <div style={{
                    background:'#fff', border:'1px solid #f0f0f0',
                    borderRadius:'10px', padding:'14px',
                }}>
                    {loading ? (
                        <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af', fontSize:'13px' }}>
                            Loading prescriptions...
                        </div>
                    ) : prescriptions.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af', fontSize:'13px' }}>
                            No prescriptions yet.
                        </div>
                    ) : (
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                            <tr>
                                {['Medicine','Doctor','Dosage','Duration','Date','Status','Download'].map(h => (
                                    <th key={h} style={s.th}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {prescriptions.map(rx => (
                                <tr key={rx.id}>
                                    <td style={s.td}>
                                        <strong>{rx.medicineName || rx.medicine || '—'}</strong>
                                    </td>
                                    <td style={s.td}>{rx.doctorName || '—'}</td>
                                    <td style={s.td}>{rx.dosage || '—'}</td>
                                    <td style={s.td}>{rx.duration || '—'}</td>
                                    <td style={s.td}>
                                        {rx.createdAt
                                            ? new Date(rx.createdAt).toLocaleDateString('en-IN')
                                            : '—'}
                                    </td>
                                    <td style={s.td}>
                                            <span style={{
                                                background: rx.active ? '#f0fdf4' : '#f3f4f6',
                                                color: rx.active ? '#166534' : '#374151',
                                                padding:'3px 9px', borderRadius:'8px',
                                                fontSize:'10px', fontWeight:600,
                                            }}>
                                                {rx.active ? 'Active' : 'Done'}
                                            </span>
                                    </td>
                                    <td style={s.td}>
                                        <button
                                            onClick={() => handleDownload(rx.id)}
                                            disabled={downloading === rx.id}
                                            style={{
                                                padding:'4px 10px', borderRadius:'6px',
                                                border:'1px solid #e5e7eb', background:'#fff',
                                                color:'#374151', fontSize:'11px',
                                                fontWeight:600, cursor:'pointer',
                                                display:'flex', alignItems:'center', gap:'4px',
                                            }}
                                        >
                                            {downloading === rx.id ? '...' : '⬇ PDF'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}