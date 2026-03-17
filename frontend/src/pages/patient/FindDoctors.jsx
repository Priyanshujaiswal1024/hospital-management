import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import api                     from '../../api/axios';

export default function FindDoctors() {
    const navigate = useNavigate();
    const [doctors, setDoctors]           = useState([]);
    const [departments, setDepartments]   = useState([]);
    const [loading, setLoading]           = useState(false);
    const [search, setSearch]             = useState('');
    const [spec, setSpec]                 = useState('');
    const [page, setPage]                 = useState(0);
    const [totalPages, setTotalPages]     = useState(1);
    const [totalDoctors, setTotalDoctors] = useState(0);

    // ✅ Departments DB se
    useEffect(() => {
        api.get('/public/departments')
            .then(({ data }) => setDepartments(data))
            .catch(() => setDepartments([]));
    }, []);

    useEffect(() => { fetchDoctors(); }, [page, search, spec]);

    async function fetchDoctors() {
        setLoading(true);
        try {
            const params = { page, size: 9 };
            if (search) params.name           = search;
            if (spec)   params.specialization = spec;
            const { data } = await api.get('/public/doctors', { params });
            setDoctors(data.content || []);
            setTotalPages(data.totalPages || 1);
            setTotalDoctors(data.totalElements || 0);
        } catch {
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    }

    const specializations = [...new Set(departments.map(d => d.name))];

    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

            {/* topbar */}
            <div style={{
                background:'#fff', borderBottom:'1px solid #f0f0f0',
                padding:'12px 20px', position:'sticky', top:0, zIndex:10,
            }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                        <div style={{ fontSize:'15px', fontWeight:700, color:'#111' }}>
                            Find Doctors
                        </div>
                        <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'1px' }}>
                            Search and book appointments
                        </div>
                    </div>
                    {totalDoctors > 0 && (
                        <div style={{
                            background:'#E1F5EE', color:'#0a4f3a',
                            fontSize:'11px', fontWeight:600,
                            padding:'4px 10px', borderRadius:'20px',
                        }}>
                            {totalDoctors} Doctor{totalDoctors !== 1 ? 's' : ''} Available
                        </div>
                    )}
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', padding:'18px 20px' }}>

                {/* ✅ Sirf search bar — no dropdown */}
                <div style={{
                    background:'#fff', border:'1px solid #f0f0f0',
                    borderRadius:'12px', padding:'14px 16px', marginBottom:'12px',
                }}>
                    <div style={{ position:'relative' }}>
                        <span style={{
                            position:'absolute', left:'12px', top:'50%',
                            transform:'translateY(-50%)', fontSize:'13px',
                        }}>🔍</span>
                        <input
                            style={{
                                width:'100%', border:'1px solid #e5e7eb',
                                borderRadius:'9px', padding:'9px 14px 9px 34px',
                                fontSize:'12px', outline:'none', background:'#fafafa',
                                fontFamily:'Outfit, sans-serif', boxSizing:'border-box',
                            }}
                            placeholder="Search by doctor name..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            onFocus={e => e.target.style.borderColor = '#0a4f3a'}
                            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                        />
                    </div>

                    {/* result text */}
                    <div style={{
                        fontSize:'11px', color:'#9ca3af',
                        marginTop:'8px', marginLeft:'2px',
                    }}>
                        {loading ? 'Searching...' : (
                            <>
                                Showing <b style={{ color:'#374151' }}>{totalDoctors}</b> doctor{totalDoctors !== 1 ? 's' : ''}
                                {spec ? <> in <b style={{ color:'#0a4f3a' }}>{spec}</b></> : ''}
                                {search ? <> matching "<b style={{ color:'#0a4f3a' }}>{search}</b>"</> : ''}
                            </>
                        )}
                    </div>
                </div>

                {/* ✅ Chips only — no dropdown */}
                <div style={{
                    display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px',
                }}>
                    <button
                        onClick={() => { setSpec(''); setPage(0); }}
                        style={{
                            padding:'6px 14px', borderRadius:'20px', fontSize:'11px',
                            fontWeight:600, cursor:'pointer', transition:'all .15s',
                            border: spec === '' ? 'none' : '1px solid #e5e7eb',
                            background: spec === '' ? '#0a4f3a' : '#fff',
                            color: spec === '' ? '#fff' : '#6b7280',
                        }}
                    >
                        All
                    </button>
                    {specializations.map(s => (
                        <button
                            key={s}
                            onClick={() => { setSpec(s === spec ? '' : s); setPage(0); }}
                            style={{
                                padding:'6px 14px', borderRadius:'20px', fontSize:'11px',
                                fontWeight:600, cursor:'pointer', transition:'all .15s',
                                border: spec === s ? 'none' : '1px solid #e5e7eb',
                                background: spec === s ? '#0a4f3a' : '#fff',
                                color: spec === s ? '#fff' : '#6b7280',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* doctors grid */}
                {loading ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                background:'#f9fafb', borderRadius:'12px',
                                height:'180px', animation:'pulse 1.5s infinite',
                            }} />
                        ))}
                    </div>
                ) : doctors.length === 0 ? (
                    <div style={{
                        textAlign:'center', padding:'60px',
                        color:'#9ca3af', fontSize:'13px',
                    }}>
                        <div style={{ fontSize:'40px', marginBottom:'12px' }}>🔍</div>
                        <div style={{ fontWeight:600, color:'#374151', marginBottom:'4px' }}>
                            No doctors found
                        </div>
                        <div>Try a different name or specialization</div>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                            gap:'12px', marginBottom:'16px',
                        }}>
                            {doctors.map(doc => {
                                const initials = doc.name
                                    ?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                                return (
                                    <div key={doc.id} style={{
                                        background:'#fff', border:'1px solid #f0f0f0',
                                        borderRadius:'12px', padding:'16px',
                                        transition:'all .15s',
                                    }}
                                         onMouseEnter={e => {
                                             e.currentTarget.style.borderColor = '#0a4f3a';
                                             e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,79,58,.08)';
                                             e.currentTarget.style.transform = 'translateY(-2px)';
                                         }}
                                         onMouseLeave={e => {
                                             e.currentTarget.style.borderColor = '#f0f0f0';
                                             e.currentTarget.style.boxShadow = 'none';
                                             e.currentTarget.style.transform = 'none';
                                         }}
                                    >
                                        {/* header */}
                                        <div style={{
                                            display:'flex', alignItems:'center',
                                            gap:'10px', marginBottom:'12px',
                                        }}>
                                            <div style={{
                                                width:'44px', height:'44px', borderRadius:'10px',
                                                background:'linear-gradient(135deg,#0a4f3a,#1D9E75)',
                                                color:'#fff', fontSize:'15px', fontWeight:700,
                                                display:'flex', alignItems:'center',
                                                justifyContent:'center', flexShrink:0,
                                            }}>
                                                {initials}
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{
                                                    fontSize:'13px', fontWeight:700, color:'#111',
                                                    whiteSpace:'nowrap', overflow:'hidden',
                                                    textOverflow:'ellipsis',
                                                }}>
                                                    {doc.name}
                                                </div>
                                                <div style={{
                                                    fontSize:'11px', color:'#0a4f3a',
                                                    fontWeight:600, marginTop:'1px',
                                                }}>
                                                    {doc.specialization}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ borderTop:'1px solid #f3f4f6', marginBottom:'10px' }} />

                                        {/* stats */}
                                        <div style={{
                                            display:'grid', gridTemplateColumns:'1fr 1fr',
                                            gap:'8px', marginBottom:'10px',
                                        }}>
                                            <div style={{
                                                background:'#f9fafb', borderRadius:'8px',
                                                padding:'7px 10px', textAlign:'center',
                                            }}>
                                                <div style={{ fontSize:'13px', fontWeight:700, color:'#111' }}>
                                                    {doc.experienceYears} yrs
                                                </div>
                                                <div style={{ fontSize:'10px', color:'#9ca3af' }}>
                                                    Experience
                                                </div>
                                            </div>
                                            <div style={{
                                                background:'#f9fafb', borderRadius:'8px',
                                                padding:'7px 10px', textAlign:'center',
                                            }}>
                                                <div style={{ fontSize:'13px', fontWeight:700, color:'#0a4f3a' }}>
                                                    ₹{doc.consultationFee}
                                                </div>
                                                <div style={{ fontSize:'10px', color:'#9ca3af' }}>
                                                    Consult Fee
                                                </div>
                                            </div>
                                        </div>

                                        {/* department badge */}
                                        {doc.departmentName && (
                                            <div style={{
                                                background:'#E1F5EE', color:'#065f46',
                                                fontSize:'10px', fontWeight:600,
                                                padding:'3px 8px', borderRadius:'6px',
                                                display:'inline-block', marginBottom:'10px',
                                            }}>
                                                🏥 {doc.departmentName}
                                            </div>
                                        )}

                                        {/* book button */}
                                        <button
                                            onClick={() => navigate(`/patient/doctors/${doc.id}/book`)}
                                            style={{
                                                width:'100%', padding:'9px', borderRadius:'8px',
                                                border:'none', background:'#0a4f3a', color:'#fff',
                                                fontSize:'12px', fontWeight:600, cursor:'pointer',
                                                transition:'background .15s',
                                            }}
                                            onMouseEnter={e => e.target.style.background = '#1D9E75'}
                                            onMouseLeave={e => e.target.style.background = '#0a4f3a'}
                                        >
                                            View &amp; Book →
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display:'flex', justifyContent:'center',
                                alignItems:'center', gap:'6px', marginTop:'8px',
                            }}>
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    style={{
                                        padding:'6px 12px', borderRadius:'8px',
                                        border:'1px solid #e5e7eb', background:'#fff',
                                        fontSize:'12px',
                                        cursor: page === 0 ? 'not-allowed' : 'pointer',
                                        color: page === 0 ? '#d1d5db' : '#374151',
                                    }}
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i} onClick={() => setPage(i)} style={{
                                        width:'32px', height:'32px', borderRadius:'50%',
                                        border: page === i ? 'none' : '1px solid #e5e7eb',
                                        background: page === i ? '#0a4f3a' : '#fff',
                                        color: page === i ? '#fff' : '#6b7280',
                                        fontSize:'12px', fontWeight:600, cursor:'pointer',
                                    }}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page === totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{
                                        padding:'6px 12px', borderRadius:'8px',
                                        border:'1px solid #e5e7eb', background:'#fff',
                                        fontSize:'12px',
                                        cursor: page === totalPages-1 ? 'not-allowed' : 'pointer',
                                        color: page === totalPages-1 ? '#d1d5db' : '#374151',
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`@keyframes pulse {
                0%,100% { opacity:1; } 50% { opacity:.5; }
            }`}</style>
        </div>
    );
}