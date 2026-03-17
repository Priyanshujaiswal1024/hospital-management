import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { downloadPdf } from '../../utils/downloadPdf';

export default function DoctorMedicalRecords() {

    const navigate = useNavigate();

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null); // 🔥 modal

    useEffect(() => {
        api.get('/doctors/medical-records')
            .then(r => setRecords(r.data || []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = records.filter(r =>
        !search ||
        r.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        r.diagnosis?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f0f4f8' }}>

            {/* HEADER */}
            <div style={{
                background:'linear-gradient(135deg,#0f3460,#185FA5)',
                padding:'20px',
                color:'#fff'
            }}>
                <h2>📋 Medical Records</h2>
                <div>{loading ? 'Loading...' : `${records.length} records created`}</div>
            </div>

            {/* SEARCH */}
            <div style={{ padding:'20px' }}>
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by patient or diagnosis..."
                    style={{
                        width:'300px',
                        padding:'10px',
                        borderRadius:'8px',
                        border:'1px solid #ccc'
                    }}
                />
            </div>

            {/* LIST */}
            <div style={{ padding:'20px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'15px' }}>

                {loading ? (
                    <div>Loading...</div>
                ) : filtered.map((rec, idx) => (

                    <div
                        key={rec.id}
                        onClick={() => setSelectedRecord(rec)} // 🔥 CLICK
                        style={{
                            background:'#fff',
                            padding:'15px',
                            borderRadius:'12px',
                            cursor:'pointer',
                            boxShadow:'0 2px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        <h4>{rec.patientName}</h4>
                        <div>{rec.diagnosis}</div>
                        <div style={{ fontSize:'12px', color:'#888' }}>
                            {rec.visitDate && new Date(rec.visitDate).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* 🔥 MODAL */}
            {selectedRecord && (
                <div
                    onClick={() => setSelectedRecord(null)}
                    style={{
                        position:'fixed',
                        top:0,
                        left:0,
                        width:'100%',
                        height:'100%',
                        background:'rgba(0,0,0,0.5)',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        zIndex:1000
                    }}
                >

                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width:'800px',
                            maxHeight:'90%',
                            overflowY:'auto',
                            background:'#fff',
                            borderRadius:'16px',
                            padding:'25px'
                        }}
                    >

                        {/* CLOSE */}
                        <div style={{ textAlign:'right' }}>
                            <button onClick={() => setSelectedRecord(null)}>❌</button>
                        </div>

                        {/* TITLE */}
                        <h2>Medical Record</h2>

                        {/* INFO GRID */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                            <div><b>Patient:</b> {selectedRecord.patientName}</div>
                            <div><b>Doctor:</b> {selectedRecord.doctorName}</div>
                            <div><b>Department:</b> {selectedRecord.department}</div>
                            <div><b>Date:</b> {new Date(selectedRecord.visitDate).toLocaleString()}</div>
                        </div>

                        {/* DIAGNOSIS */}
                        <div style={{ marginTop:'15px' }}>
                            <h4>Diagnosis</h4>
                            <div style={{ background:'#f5f5f5', padding:'10px', borderRadius:'8px' }}>
                                {selectedRecord.diagnosis}
                            </div>
                        </div>

                        {/* NOTES */}
                        <div style={{ marginTop:'15px' }}>
                            <h4>Clinical Notes</h4>
                            <div style={{ background:'#f5f5f5', padding:'10px', borderRadius:'8px' }}>
                                {selectedRecord.notes || '—'}
                            </div>
                        </div>

                        {/* PRESCRIPTION */}
                        <div style={{ marginTop:'15px' }}>
                            <h4>Prescription</h4>

                            {selectedRecord.prescription?.medicines?.length > 0 ? (

                                <table style={{ width:'100%', marginTop:'10px', borderCollapse:'collapse' }}>
                                    <thead>
                                    <tr>
                                        <th>Medicine</th>
                                        <th>Dosage</th>
                                        <th>Duration</th>
                                        <th>Qty</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedRecord.prescription.medicines.map((m, i) => (
                                        <tr key={i}>
                                            <td>💊 {m.medicineName}</td>
                                            <td>{m.frequency}</td>
                                            <td>{m.durationDays} days</td>
                                            <td>{m.quantity}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>

                            ) : (
                                <div>No prescription</div>
                            )}
                        </div>

                        {/* DOWNLOAD */}
                        {selectedRecord.prescription && (
                            <button
                                onClick={() =>
                                    downloadPdf(
                                        `/prescriptions/${selectedRecord.prescription.id}/download`,
                                        `prescription-${selectedRecord.prescription.id}.pdf`
                                    )
                                }
                                style={{
                                    marginTop:'20px',
                                    padding:'10px 15px',
                                    borderRadius:'8px',
                                    border:'1px solid #ccc',
                                    cursor:'pointer'
                                }}
                            >
                                ⬇ Download Prescription PDF
                            </button>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}