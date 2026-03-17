import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

const navItems = [
    {
        section: 'Management',
        items: [
            { to: '/admin/dashboard',    icon: '📊', label: 'Dashboard'    },
            { to: '/admin/doctors',      icon: '🩺', label: 'Doctors'      },
            { to: '/admin/patients',     icon: '👥', label: 'Patients'     },
            { to: '/admin/appointments', icon: '📅', label: 'Appointments' },
            { to: '/admin/departments',  icon: '🏥', label: 'Departments'  },
            { to: '/admin/medicines',    icon: '💊', label: 'Medicines'    },
            { to: '/admin/bills',        icon: '💰', label: 'Bills'        },
        ],
    },
    {
        section: 'System',
        items: [
            { to: '/admin/profile', icon: '👤', label: 'Admin Profile' },
        ],
    },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
        logout();
        navigate('/login');
    }

    const initials = user?.sub?.slice(0, 2).toUpperCase() || 'AD';

    return (
        <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@600;700&display=swap');
                .anl:hover { background:#eff6ff!important; color:#2563eb!important; }
                .alo:hover { background:#fef2f2!important; }
            `}</style>

            {/* SIDEBAR */}
            <div style={{ width:'220px', background:'#fff', borderRight:'1px solid #eef2f7', display:'flex', flexDirection:'column', flexShrink:0, boxShadow:'2px 0 12px rgba(0,0,0,.04)' }}>

                <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}>🏥</div>
                    <div>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#2563eb', fontFamily:"'Lora',serif", lineHeight:1.1 }}>Priyansh Care</div>
                        <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.09em', marginTop:'2px' }}>Admin Portal</div>
                    </div>
                </div>

                <div style={{ padding:'12px 14px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'10px', background:'#fafbfc' }}>
                    <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,#dbeafe,#bfdbfe)', color:'#2563eb', fontSize:'12px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1.5px solid #93c5fd' }}>{initials}</div>
                    <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.sub || 'Admin'}</div>
                        <div style={{ fontSize:'10px', color:'#94a3b8', display:'flex', alignItems:'center', gap:'4px', marginTop:'1px' }}>
                            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', display:'inline-block' }}/>
                            Online · Admin
                        </div>
                    </div>
                </div>

                <div style={{ padding:'10px 8px', flex:1, overflowY:'auto' }}>
                    {navItems.map(group => (
                        <div key={group.section} style={{ marginBottom:'4px' }}>
                            <div style={{ fontSize:'9px', fontWeight:700, color:'#cbd5e1', letterSpacing:'.12em', textTransform:'uppercase', padding:'8px 8px 4px' }}>{group.section}</div>
                            {group.items.map(item => (
                                <NavLink key={item.to} to={item.to} className="anl"
                                         style={({ isActive }) => ({
                                             display:'flex', alignItems:'center', gap:'9px',
                                             padding:'8px 10px', borderRadius:'9px',
                                             fontSize:'12px', fontWeight: isActive ? 700 : 500,
                                             color: isActive ? '#2563eb' : '#64748b',
                                             background: isActive ? '#eff6ff' : 'transparent',
                                             textDecoration:'none', marginBottom:'2px',
                                             transition:'all .15s',
                                             borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                                         })}>
                                    <span style={{ fontSize:'14px', width:'18px', textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                                    <span style={{ flex:1 }}>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{ padding:'10px 8px 12px', borderTop:'1px solid #f1f5f9' }}>
                    <button className="alo" onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'9px', fontSize:'12px', fontWeight:600, color:'#ef4444', cursor:'pointer', border:'none', background:'none', width:'100%', transition:'background .15s' }}>
                        <span>🚪</span> Logout
                    </button>
                </div>
            </div>

            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', minWidth:0 }}>
                <Outlet />
            </div>
        </div>
    );
}