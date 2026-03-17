import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../../api/axios';

const deptColors = [
    { bg:'#E1F5EE', color:'#0a4f3a' },
    { bg:'#EFF6FF', color:'#1e40af' },
    { bg:'#FFFBEB', color:'#92400e' },
    { bg:'#FDF2F8', color:'#9d174d' },
    { bg:'#F5F3FF', color:'#5b21b6' },
    { bg:'#FFF1F2', color:'#9f1239' },
];

export default function Departments() {
    const navigate = useNavigate();
    const [departments, setDepartments]   = useState([]);
    const [loading, setLoading]           = useState(true);
    const [openDept, setOpenDept]         = useState(null);
    const [deptDoctors, setDeptDoctors]   = useState({});
    const [loadingDept, setLoadingDept]   = useState(null);

    useEffect(() => {
        api.get('/public/departments')
            .then(({ data }) => setDepartments(data))
            .finally(() => setLoading(false));
    }, []);

    async function toggleDept(deptId) {
        if (openDept === deptId) { setOpenDept(null); return; }
        setOpenDept(deptId);
        if (!deptDoctors[deptId]) {
            setLoadingDept(deptId);
            try {
                const { data } = await api.get(`/public/departments/${deptId}/doctors`);
                setDeptDoctors(prev => ({ ...prev, [deptId]: data }));
            } finally {
                setLoadingDept(null);
            }
        }
    }

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'12px 20px',
                position:'sticky', top:0, zIndex:10,
            }}>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>Departments</div>
                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                    Browse our medical specialties
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>
                {loading ? (
                    <div style={{ textAlign:'center', padding:'60px', color:'#9ca3af', fontSize:'13px' }}>
                        Loading departments...
                    </div>
                ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        {departments.map((dept, idx) => {
                            const clr     = deptColors[idx % deptColors.length];
                            const isOpen  = openDept === dept.id;
                            const doctors = deptDoctors[dept.id] || [];
                            return (
                                <div key={dept.id} style={{
                                    background:'#fff', border:'1px solid #f0f0f0',
                                    borderRadius:'12px', overflow:'hidden',
                                }}>
                                    {/* header */}
                                    <div
                                        onClick={() => toggleDept(dept.id)}
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
                                                background: clr.bg, color: clr.color,
                                                fontSize:'16px', fontWeight:700,
                                                display:'flex', alignItems:'center', justifyContent:'center',
                                                flexShrink:0,
                                            }}>
                                                {dept.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontSize:'13px', fontWeight:600, color:'#111' }}>
                                                    {dept.name}
                                                </div>
                                                <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                                                    Head:{' '}
                                                    <span style={{ color: dept.headDoctorName ? '#0a4f3a' : '#d1d5db' }}>
                                                        {dept.headDoctorName || 'Not assigned'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                            <span style={{
                                                background: clr.bg, color: clr.color,
                                                padding:'3px 10px', borderRadius:'8px',
                                                fontSize:'10px', fontWeight:600,
                                            }}>
                                                {isOpen && doctors.length > 0
                                                    ? `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''}`
                                                    : 'View doctors'}
                                            </span>
                                            <span style={{ color:'#d1d5db', fontSize:'12px' }}>
                                                {isOpen ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* expanded doctors */}
                                    {isOpen && (
                                        <div style={{
                                            borderTop:'1px solid #f9fafb',
                                            padding:'12px 16px',
                                            background:'#fafafa',
                                        }}>
                                            {loadingDept === dept.id ? (
                                                <div style={{ textAlign:'center', padding:'16px', color:'#9ca3af', fontSize:'12px' }}>
                                                    Loading doctors...
                                                </div>
                                            ) : doctors.length === 0 ? (
                                                <div style={{ textAlign:'center', padding:'16px', color:'#9ca3af', fontSize:'12px' }}>
                                                    No doctors assigned yet.
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display:'grid',
                                                    gridTemplateColumns:'repeat(3,1fr)',
                                                    gap:'10px',
                                                }}>
                                                    {doctors.map(doc => {
                                                        const initials = doc.name
                                                            ?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                                        return (
                                                            <div
                                                                key={doc.id}
                                                                style={{
                                                                    background:'#fff', border:'1px solid #f0f0f0',
                                                                    borderRadius:'10px', padding:'12px',
                                                                    cursor:'pointer', transition:'all .12s',
                                                                }}
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.borderColor = '#0a4f3a';
                                                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,79,58,.08)';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.borderColor = '#f0f0f0';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                }}
                                                            >
                                                                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                                                                    <div style={{
                                                                        width:'32px', height:'32px', borderRadius:'8px',
                                                                        background: clr.bg, color: clr.color,
                                                                        fontSize:'11px', fontWeight:700,
                                                                        display:'flex', alignItems:'center', justifyContent:'center',
                                                                        flexShrink:0,
                                                                    }}>{initials}</div>
                                                                    <div>
                                                                        <div style={{ fontSize:'12px', fontWeight:600, color:'#111' }}>
                                                                            {doc.name}
                                                                        </div>
                                                                        <div style={{ fontSize:'10px', color:'#6b7280' }}>
                                                                            {doc.specialization}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize:'10px', color:'#6b7280', marginBottom:'8px', lineHeight:1.7 }}>
                                                                    <div>⏳ {doc.experienceYears} yrs</div>
                                                                    <div>💰 ₹{doc.consultationFee}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => navigate(`/patient/doctors/${doc.id}/book`)}
                                                                    style={{
                                                                        width:'100%', padding:'6px',
                                                                        borderRadius:'7px', border:'none',
                                                                        background:'#0a4f3a', color:'#fff',
                                                                        fontSize:'10px', fontWeight:600, cursor:'pointer',
                                                                    }}
                                                                >
                                                                    Book →
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}