import { useEffect, useState } from 'react';
import { downloadPdf } from '../../utils/downloadPdf';
import api from '../../api/axios';

export default function Prescriptions() {

    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    async function fetchPrescriptions() {
        try {
            const res = await api.get('/patient/prescriptions');
            console.log("DATA:", res.data);
            setPrescriptions(res.data || []);
        } catch (err) {
            console.log("ERROR:", err);
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(id) {
        try {
            setDownloading(id);

            await downloadPdf(
                `/prescriptions/${id}/download`,
                `prescription-${id}.pdf`
            );

        } catch (err) {
            console.log("Download error:", err);
        } finally {
            setDownloading(null);
        }
    }

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        },
        header: {
            background: '#fff',
            borderBottom: '1px solid #eee',
            padding: '12px 20px',
        },
        title: {
            fontSize: '16px',
            fontWeight: '700',
        },
        subtitle: {
            fontSize: '12px',
            color: '#888',
        },
        card: {
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '15px',
            margin: '20px',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        th: {
            textAlign: 'left',
            fontSize: '11px',
            padding: '8px',
            color: '#999',
        },
        td: {
            padding: '10px',
            fontSize: '13px',
            verticalAlign: 'top',
        },
        button: {
            padding: '5px 10px',
            fontSize: '11px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
        }
    };

    return (
        <div style={styles.container}>

            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.title}>My Prescriptions</div>
                <div style={styles.subtitle}>
                    All prescriptions from your doctors
                </div>
            </div>

            {/* CONTENT */}
            <div style={{ flex: 1 }}>
                <div style={styles.card}>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            Loading prescriptions...
                        </div>

                    ) : prescriptions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            No prescriptions yet.
                        </div>

                    ) : (

                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Medicine</th>
                                <th style={styles.th}>Doctor</th>
                                <th style={styles.th}>Dosage</th>
                                <th style={styles.th}>Duration</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Download</th>
                            </tr>
                            </thead>

                            <tbody>
                            {prescriptions.map((rx) => (

                                <tr key={rx.id}>

                                    {/* MEDICINES */}
                                    <td style={styles.td}>
                                        {rx.medicines?.length > 0
                                            ? rx.medicines.map((m, i) => (
                                                <div key={i}>
                                                    <b>{m.medicineName}</b>
                                                </div>
                                            ))
                                            : '—'}
                                    </td>

                                    {/* DOCTOR */}
                                    <td style={styles.td}>
                                        {rx.doctorName || '—'}
                                    </td>

                                    {/* DOSAGE */}
                                    <td style={styles.td}>
                                        {rx.medicines?.length > 0
                                            ? rx.medicines.map((m, i) => (
                                                <div key={i}>
                                                    {m.frequency || '—'}
                                                </div>
                                            ))
                                            : '—'}
                                    </td>

                                    {/* DURATION */}
                                    <td style={styles.td}>
                                        {rx.medicines?.length > 0
                                            ? rx.medicines.map((m, i) => (
                                                <div key={i}>
                                                    {m.durationDays
                                                        ? `${m.durationDays} days`
                                                        : '—'}
                                                </div>
                                            ))
                                            : '—'}
                                    </td>

                                    {/* DATE */}
                                    <td style={styles.td}>
                                        {rx.createdAt
                                            ? new Date(rx.createdAt).toLocaleDateString('en-IN')
                                            : '—'}
                                    </td>

                                    {/* STATUS */}
                                    <td style={styles.td}>
                                            <span style={{
                                                background: rx.active ? '#dcfce7' : '#f3f4f6',
                                                color: rx.active ? '#166534' : '#374151',
                                                padding: '3px 8px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: '600'
                                            }}>
                                                {rx.active ? 'Active' : 'Done'}
                                            </span>
                                    </td>

                                    {/* DOWNLOAD */}
                                    <td style={styles.td}>
                                        <button
                                            style={styles.button}
                                            onClick={() => handleDownload(rx.id)}
                                            disabled={downloading === rx.id}
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