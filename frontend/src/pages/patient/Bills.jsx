import { useEffect, useState } from 'react';
import { downloadPdf }         from '../../utils/downloadPdf';
import api                     from '../../api/axios';

export default function Bills() {
    const [bills, setBills]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        api.get('/bills/patient')
            .then(({ data }) => setBills(data))
            .catch(() => setBills([]))
            .finally(() => setLoading(false));
    }, []);

    async function handleDownload(id) {
        setDownloading(id);
        await downloadPdf(`/bills/${id}/download`, `invoice-${id}.pdf`);
        setDownloading(null);
    }

    const totalBilled  = bills.reduce((s, b) => s + (b.totalAmount || 0), 0);
    const totalPaid    = bills.filter(b => b.status === 'PAID').reduce((s, b) => s + (b.totalAmount || 0), 0);
    const totalPending = bills.filter(b => b.status !== 'PAID').reduce((s, b) => s + (b.totalAmount || 0), 0);

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
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>My Bills</div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                    Payment history & pending dues
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

                {/* stat cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
                    {[
                        { label:'Total Billed',  value:`₹${totalBilled.toLocaleString('en-IN')}`,  color:'#111' },
                        { label:'Pending',       value:`₹${totalPending.toLocaleString('en-IN')}`, color:'#92400e' },
                        { label:'Paid',          value:`₹${totalPaid.toLocaleString('en-IN')}`,    color:'#166534' },
                    ].map(c => (
                        <div key={c.label} style={{
                            background:'#fff', border:'1px solid #f0f0f0',
                            borderRadius:'10px', padding:'12px 14px',
                        }}>
                            <div style={{ fontSize:'20px', fontWeight:700, color:c.color }}>{c.value}</div>
                            <div style={{ fontSize:'10px', color:'#9ca3af', marginTop:'3px' }}>{c.label}</div>
                        </div>
                    ))}
                </div>

                {/* bills table */}
                <div style={{
                    background:'#fff', border:'1px solid #f0f0f0',
                    borderRadius:'10px', padding:'14px',
                }}>
                    {loading ? (
                        <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af', fontSize:'13px' }}>
                            Loading bills...
                        </div>
                    ) : bills.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'40px', color:'#9ca3af', fontSize:'13px' }}>
                            No bills found.
                        </div>
                    ) : (
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                            <thead>
                            <tr>
                                {['Bill ID','Doctor','Consult Fee','GST 18%','Total','Date','Status','Invoice'].map(h => (
                                    <th key={h} style={s.th}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {bills.map(bill => (
                                <tr key={bill.id}>
                                    <td style={s.td}>#{bill.id}</td>
                                    <td style={s.td}>{bill.doctorName || '—'}</td>
                                    <td style={s.td}>₹{bill.consultationFee?.toLocaleString('en-IN')}</td>
                                    <td style={s.td}>₹{bill.gstAmount?.toLocaleString('en-IN')}</td>
                                    <td style={{ ...s.td, fontWeight:700 }}>
                                        ₹{bill.totalAmount?.toLocaleString('en-IN')}
                                    </td>
                                    <td style={s.td}>
                                        {bill.createdAt
                                            ? new Date(bill.createdAt).toLocaleDateString('en-IN')
                                            : '—'}
                                    </td>
                                    <td style={s.td}>
                                            <span style={{
                                                background: bill.status === 'PAID' ? '#f0fdf4' : '#fef2f2',
                                                color: bill.status === 'PAID' ? '#166534' : '#dc2626',
                                                padding:'3px 9px', borderRadius:'8px',
                                                fontSize:'10px', fontWeight:600,
                                            }}>
                                                {bill.status === 'PAID' ? 'Paid' : 'Unpaid'}
                                            </span>
                                    </td>
                                    <td style={s.td}>
                                        <button
                                            onClick={() => handleDownload(bill.id)}
                                            disabled={downloading === bill.id}
                                            style={{
                                                padding:'4px 10px', borderRadius:'6px',
                                                border:'1px solid #e5e7eb', background:'#fff',
                                                color:'#374151', fontSize:'11px',
                                                fontWeight:600, cursor:'pointer',
                                            }}
                                        >
                                            {downloading === bill.id ? '...' : '⬇ PDF'}
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