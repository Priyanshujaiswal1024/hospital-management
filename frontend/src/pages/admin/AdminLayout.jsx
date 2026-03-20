import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';
import { useState, useEffect, useRef } from 'react';

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

// Get active page label for mobile header
function getPageLabel(pathname) {
    for (const group of navItems) {
        for (const item of group.items) {
            if (pathname.startsWith(item.to)) return { icon: item.icon, label: item.label };
        }
    }
    return { icon: '🏥', label: 'Admin' };
}

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();
    const [open, setOpen] = useState(false);
    const sidebarRef = useRef();

    // Close on route change (mobile)
    useEffect(() => { setOpen(false); }, [location.pathname]);

    // Close on outside click
    useEffect(() => {
        function handler(e) {
            if (open && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [open]);

    // Lock body scroll when sidebar open on mobile
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
        logout();
        navigate('/login');
    }

    const initials = user?.sub?.slice(0, 2).toUpperCase() || 'AD';
    const page = getPageLabel(location.pathname);

    return (
        <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f0f4f8', fontFamily:"'DM Sans','Outfit',sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@600;700&display=swap');

                /* Nav link hover */
                .anl:hover { background:#eff6ff!important; color:#2563eb!important; }
                .alo:hover { background:#fef2f2!important; }

                /* Sidebar slide animation */
                @keyframes sideIn  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
                @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
                @keyframes sideOut { from{transform:translateX(0)} to{transform:translateX(-100%)} }

                /* Hamburger lines */
                .hbg-bar {
                    display:block; width:20px; height:2px;
                    background:#374151; border-radius:2px;
                    transition:all .25s cubic-bezier(.4,0,.2,1);
                }

                /* Mobile top bar */
                .mob-topbar {
                    display:none;
                    position:fixed; top:0; left:0; right:0; z-index:200;
                    height:56px; background:#fff; border-bottom:1px solid #eef2f7;
                    align-items:center; justify-content:space-between;
                    padding:0 16px; box-shadow:0 1px 8px rgba(0,0,0,.06);
                }

                /* Overlay */
                .sidebar-overlay {
                    display:none; position:fixed; inset:0; z-index:299;
                    background:rgba(15,23,42,.45); backdrop-filter:blur(2px);
                    animation:fadeIn .2s ease;
                }

                /* Sidebar base */
                .admin-sidebar {
                    width:220px; background:#fff; border-right:1px solid #eef2f7;
                    display:flex; flex-direction:column; flex-shrink:0;
                    box-shadow:2px 0 12px rgba(0,0,0,.04);
                    transition:transform .25s cubic-bezier(.4,0,.2,1);
                    z-index:300;
                }

                /* Main content area */
                .admin-content {
                    flex:1; overflow-y:auto; display:flex;
                    flex-direction:column; min-width:0;
                }

                /* ── Responsive ── */
                @media (max-width:768px) {
                    .mob-topbar { display:flex!important; }
                    .admin-sidebar {
                        position:fixed; top:0; left:0; bottom:0;
                        transform:translateX(-100%);
                        box-shadow:4px 0 24px rgba(0,0,0,.15);
                    }
                    .admin-sidebar.open {
                        transform:translateX(0);
                        animation:sideIn .25s cubic-bezier(.4,0,.2,1);
                    }
                    .sidebar-overlay.open { display:block!important; }
                    .admin-content { padding-top:56px; }
                }
            `}</style>

            {/* ── Mobile Top Bar ── */}
            <div className="mob-topbar">
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:'8px', borderRadius:'8px', display:'flex', flexDirection:'column', gap:'4px', transition:'background .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.background='none'}
                        aria-label="Toggle menu"
                    >
                        <span className="hbg-bar" style={{ transform: open ? 'rotate(45deg) translateY(6px)' : 'none' }}/>
                        <span className="hbg-bar" style={{ opacity: open ? 0 : 1, transform: open ? 'scaleX(0)' : 'scaleX(1)' }}/>
                        <span className="hbg-bar" style={{ transform: open ? 'rotate(-45deg) translateY(-6px)' : 'none' }}/>
                    </button>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'28px', height:'28px', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🏥</div>
                        <div>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'#2563eb', fontFamily:"'Lora',serif", lineHeight:1 }}>Priyansh Care</div>
                        </div>
                    </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'15px' }}>{page.icon}</span>
                    <span style={{ fontSize:'12px', fontWeight:600, color:'#374151' }}>{page.label}</span>
                </div>
            </div>

            {/* ── Overlay ── */}
            <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)}/>

            {/* ── Sidebar ── */}
            <div ref={sidebarRef} className={`admin-sidebar${open ? ' open' : ''}`}>
                {/* Logo */}
                <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', background:'linear-gradient(135deg,#2563eb,#1d4ed8)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}>🏥</div>
                    <div>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#2563eb', fontFamily:"'Lora',serif", lineHeight:1.1 }}>Priyansh Care</div>
                        <div style={{ fontSize:'9px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.09em', marginTop:'2px' }}>Admin Portal</div>
                    </div>
                    {/* Close button — mobile only */}
                    <button
                        onClick={() => setOpen(false)}
                        style={{ marginLeft:'auto', display:'none', width:'28px', height:'28px', borderRadius:'7px', border:'none', background:'#f1f5f9', color:'#64748b', fontSize:'16px', cursor:'pointer', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                        className="mob-close-btn"
                    >×</button>
                </div>

                {/* User info */}
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

                {/* Nav */}
                <div style={{ padding:'10px 8px', flex:1, overflowY:'auto' }}>
                    {navItems.map(group => (
                        <div key={group.section} style={{ marginBottom:'4px' }}>
                            <div style={{ fontSize:'9px', fontWeight:700, color:'#cbd5e1', letterSpacing:'.12em', textTransform:'uppercase', padding:'8px 8px 4px' }}>{group.section}</div>
                            {group.items.map(item => (
                                <NavLink key={item.to} to={item.to} className="anl"
                                         style={({ isActive }) => ({
                                             display:'flex', alignItems:'center', gap:'9px',
                                             padding:'9px 10px', borderRadius:'9px',
                                             fontSize:'12px', fontWeight: isActive ? 700 : 500,
                                             color: isActive ? '#2563eb' : '#64748b',
                                             background: isActive ? '#eff6ff' : 'transparent',
                                             textDecoration:'none', marginBottom:'2px',
                                             transition:'all .15s',
                                             borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                                         })}>
                                    <span style={{ fontSize:'15px', width:'20px', textAlign:'center', flexShrink:0 }}>{item.icon}</span>
                                    <span style={{ flex:1 }}>{item.label}</span>
                                    {item.label === 'Dashboard' && (
                                        <span style={{ fontSize:'9px', background:'#dbeafe', color:'#2563eb', padding:'1px 5px', borderRadius:'4px', fontWeight:700 }}>Home</span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div style={{ padding:'10px 8px 16px', borderTop:'1px solid #f1f5f9' }}>
                    <button className="alo" onClick={handleLogout}
                            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 10px', borderRadius:'9px', fontSize:'12px', fontWeight:600, color:'#ef4444', cursor:'pointer', border:'none', background:'none', width:'100%', transition:'background .15s' }}>
                        <span>🚪</span> Logout
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="admin-content">
                <Outlet />
            </div>

            <style>{`
                @media (max-width:768px) {
                    .mob-close-btn { display:flex!important; }
                }
            `}</style>
        </div>
    );
}