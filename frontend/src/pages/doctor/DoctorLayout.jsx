import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

const navItems = [
    {
        section: 'Work',
        items: [
            { to: '/doctor/dashboard',    icon: '🏠', label: 'Dashboard' },
            { to: '/doctor/appointments', icon: '📅', label: 'Appointments' },
            { to: '/doctor/availability', icon: '⏰', label: 'Set Availability' },
        ],
    },
    {
        section: 'Patient Care',
        items: [
            { to: '/doctor/prescriptions', icon: '💊', label: 'Prescriptions' },
            { to: '/doctor/records',       icon: '📋', label: 'Medical Records' },
        ],
    },
    {
        section: 'My Account',
        items: [
            { to: '/doctor/profile',   icon: '👤', label: 'My Profile' },
            { to: '/doctor/medicines', icon: '💊', label: 'Medicines' },
        ],
    },
];

export default function DoctorLayout() {
    const { user, logout } = useAuth();
    const navigate         = useNavigate();

    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            await api.post('/auth/logout', null, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {}
        logout();
        navigate('/login');
    }

    const initials = user?.sub
        ? user.sub.slice(0, 2).toUpperCase()
        : 'DR';

    return (
        <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                .nav-link-item:hover { background:#f1f5f9!important; color:#185FA5!important; }
                .logout-btn:hover { background:#fef2f2!important; }
            `}</style>

            {/* ── SIDEBAR ── */}
            <div style={{
                width:'220px', background:'#fff',
                borderRight:'1px solid #eef2f7',
                display:'flex', flexDirection:'column', flexShrink:0,
                boxShadow:'2px 0 12px rgba(0,0,0,.04)',
            }}>

                {/* Brand */}
                <div style={{
                    padding:'18px 16px 14px',
                    borderBottom:'1px solid #f1f5f9',
                    display:'flex', alignItems:'center', gap:'10px',
                }}>
                    <div style={{
                        width:'36px', height:'36px', background:'linear-gradient(135deg,#185FA5,#0f3460)',
                        borderRadius:'10px', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'18px', flexShrink:0,
                        boxShadow:'0 2px 8px rgba(24,95,165,.3)',
                    }}>🏥</div>
                    <div>
                        <div style={{
                            fontSize:'13px', fontWeight:700, color:'#185FA5',
                            fontFamily:"'Playfair Display', serif", lineHeight:1.1,
                        }}>Priyansh Care</div>
                        <div style={{
                            fontSize:'9px', color:'#94a3b8', textTransform:'uppercase',
                            letterSpacing:'.09em', marginTop:'2px',
                        }}>Hospital Portal</div>
                    </div>
                </div>

                {/* User info */}
                <div style={{
                    padding:'12px 14px',
                    borderBottom:'1px solid #f1f5f9',
                    display:'flex', alignItems:'center', gap:'10px',
                    background:'#fafbfc',
                }}>
                    <div style={{
                        width:'34px', height:'34px', borderRadius:'10px',
                        background:'linear-gradient(135deg,#EFF6FF,#dbeafe)',
                        color:'#185FA5', fontSize:'12px', fontWeight:800,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        flexShrink:0, border:'1.5px solid #bfdbfe',
                    }}>{initials}</div>
                    <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {user?.sub || 'Doctor'}
                        </div>
                        <div style={{ fontSize:'10px', color:'#94a3b8', display:'flex', alignItems:'center', gap:'4px', marginTop:'1px' }}>
                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
                            Online · Doctor
                        </div>
                    </div>
                </div>

                {/* Nav links */}
                <div style={{ padding:'10px 8px', flex:1, overflowY:'auto' }}>
                    {navItems.map(group => (
                        <div key={group.section} style={{ marginBottom:'4px' }}>
                            <div style={{
                                fontSize:'9px', fontWeight:700, color:'#cbd5e1',
                                letterSpacing:'.12em', textTransform:'uppercase',
                                padding:'8px 8px 4px',
                            }}>{group.section}</div>

                            {group.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className="nav-link-item"
                                    style={({ isActive }) => ({
                                        display:'flex', alignItems:'center', gap:'9px',
                                        padding:'8px 10px', borderRadius:'9px',
                                        fontSize:'12px', fontWeight: isActive ? 700 : 500,
                                        color: isActive ? '#185FA5' : '#64748b',
                                        background: isActive ? '#EFF6FF' : 'transparent',
                                        textDecoration:'none', marginBottom:'2px',
                                        transition:'all .15s',
                                        borderLeft: isActive ? '3px solid #185FA5' : '3px solid transparent',
                                    })}
                                >
                                    <span style={{ fontSize:'14px', width:'18px', textAlign:'center', flexShrink:0 }}>
                                        {item.icon}
                                    </span>
                                    <span style={{ flex:1 }}>{item.label}</span>
                                    {/* active dot */}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div style={{ padding:'10px 8px 12px', borderTop:'1px solid #f1f5f9' }}>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        style={{
                            display:'flex', alignItems:'center', gap:'8px',
                            padding:'8px 10px', borderRadius:'9px', fontSize:'12px',
                            fontWeight:600, color:'#ef4444', cursor:'pointer',
                            border:'none', background:'none', width:'100%',
                            transition:'background .15s',
                        }}
                    >
                        <span style={{ fontSize:'14px' }}>🚪</span>
                        Logout
                    </button>
                </div>
            </div>

            {/* ── MAIN CONTENT ── */}
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', minWidth:0 }}>
                <Outlet />
            </div>
        </div>
    );
}