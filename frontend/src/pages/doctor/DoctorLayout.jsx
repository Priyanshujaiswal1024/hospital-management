import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

const navItems = [
    {
        section: 'Work',
        items: [
            { to: '/doctor/dashboard',      icon: '🏠', label: 'Dashboard' },
            { to: '/doctor/appointments',   icon: '📅', label: 'Appointments' },
            { to: '/doctor/availability',   icon: '⏰', label: 'Set Availability' },
        ],
    },
    {
        section: 'Patient Care',           // ← NEW SECTION
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
        } catch {

        }
        logout();
        navigate('/login');
    }

    const initials = user?.sub
        ? user.sub.slice(0, 2).toUpperCase()
        : 'DR';

    return (
        <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f7f8fa' }}>

            {/* SIDEBAR */}
            <div style={{
                width:'210px', background:'#fff', borderRight:'1px solid #f0f0f0',
                display:'flex', flexDirection:'column', flexShrink:0,
            }}>
                {/* Brand */}
                <div style={{
                    padding:'16px 14px 12px', borderBottom:'1px solid #f5f5f5',
                    display:'flex', alignItems:'center', gap:'9px',
                }}>
                    <div style={{
                        width:'32px', height:'32px', background:'#185FA5',
                        borderRadius:'8px', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'16px', flexShrink:0,
                    }}>🏥</div>
                    <div>
                        <div style={{
                            fontSize:'13px', fontWeight:700, color:'#185FA5',
                            fontFamily:"'Playfair Display', serif", lineHeight:1.1,
                        }}>Priyansh Care</div>
                        <div style={{
                            fontSize:'9px', color:'#9ca3af', textTransform:'uppercase',
                            letterSpacing:'.08em', marginTop:'1px',
                        }}>Hospital</div>
                    </div>
                </div>

                {/* User info */}
                <div style={{
                    padding:'10px 12px', borderBottom:'1px solid #f5f5f5',
                    display:'flex', alignItems:'center', gap:'8px',
                }}>
                    <div style={{
                        width:'30px', height:'30px', borderRadius:'8px',
                        background:'#EFF6FF', color:'#185FA5', fontSize:'11px',
                        fontWeight:700, display:'flex', alignItems:'center',
                        justifyContent:'center', flexShrink:0,
                    }}>{initials}</div>
                    <div>
                        <div style={{ fontSize:'12px', fontWeight:600, color:'#111', lineHeight:1.2 }}>
                            {user?.sub || 'Doctor'}
                        </div>
                        <div style={{ fontSize:'10px', color:'#9ca3af' }}>Doctor</div>
                    </div>
                </div>

                {/* Nav */}
                <div style={{ padding:'8px', flex:1, overflowY:'auto' }}>
                    {navItems.map(group => (
                        <div key={group.section}>
                            <div style={{
                                fontSize:'9px', fontWeight:700, color:'#d1d5db',
                                letterSpacing:'.1em', textTransform:'uppercase',
                                padding:'8px 6px 3px',
                            }}>{group.section}</div>

                            {group.items.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    style={({ isActive }) => ({
                                        display:'flex', alignItems:'center', gap:'8px',
                                        padding:'7px 8px', borderRadius:'7px',
                                        fontSize:'12px', fontWeight: isActive ? 600 : 500,
                                        color: isActive ? '#185FA5' : '#6b7280',
                                        background: isActive ? '#EFF6FF' : 'transparent',
                                        textDecoration:'none', marginBottom:'1px',
                                        transition:'all .12s',
                                    })}
                                >
                                    <span style={{ fontSize:'13px', width:'16px', textAlign:'center' }}>
                                        {item.icon}
                                    </span>
                                    <span style={{ flex:1 }}>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div style={{ padding:'8px 8px 10px', borderTop:'1px solid #f5f5f5' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display:'flex', alignItems:'center', gap:'7px',
                            padding:'7px 8px', borderRadius:'7px', fontSize:'11px',
                            fontWeight:600, color:'#ef4444', cursor:'pointer',
                            border:'none', background:'none', width:'100%',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        ⬅ Logout
                    </button>
                </div>
            </div>

            {/* MAIN */}
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
                <Outlet />
            </div>
        </div>
    );
}