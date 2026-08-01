import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    Calendar,
    Building2,
    Pill,
    CreditCard,
    User,
    LogOut,
    Menu,
    X,
    Shield,
    ChevronRight
} from 'lucide-react';

/* ── Stylized P Logo ── */
function Logo({ size = 36, radius = 9 }) {
    return (
        <div style={{
            width: size, height: size,
            background: 'linear-gradient(135deg, #0d9488 0%, #0f172a 100%)',
            borderRadius: radius, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff', fontWeight: 800, fontSize: size * 0.52,
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            P
        </div>
    );
}

const navItems = [
    {
        section: 'Management',
        items: [
            { to: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
            { to: '/admin/doctors',      icon: Stethoscope,     label: 'Doctors'      },
            { to: '/admin/patients',     icon: Users,           label: 'Patients'     },
            { to: '/admin/appointments', icon: Calendar,        label: 'Appointments' },
            { to: '/admin/departments',  icon: Building2,       label: 'Departments'  },
            { to: '/admin/medicines',    icon: Pill,            label: 'Medicines'    },
            { to: '/admin/bills',        icon: CreditCard,      label: 'Bills'        },
        ],
    },
    {
        section: 'System',
        items: [
            { to: '/admin/profile', icon: User, label: 'Admin Profile' },
        ],
    },
];

function getPageLabel(pathname) {
    for (const group of navItems) {
        for (const item of group.items) {
            if (pathname.startsWith(item.to)) return { icon: item.icon, label: item.label };
        }
    }
    return { icon: Shield, label: 'Admin' };
}

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate  = useNavigate();
    const location  = useLocation();
    const [open, setOpen] = useState(false);
    const sidebarRef = { current: null };

    useEffect(() => { setOpen(false); }, [location.pathname]);

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
    const PageIcon = page.icon;
    const email = user?.sub || 'Admin';

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .anl { transition: all .15s ease; }
                .anl:hover { background: #f8fafc !important; color: #0f172a !important; }
                .al-logout:hover { background: #fef2f2 !important; }
                .al-nav-item:hover { background: #f8fafc !important; }

                .mob-topbar {
                    display: none;
                    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
                    height: 58px; background: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    align-items: center; justify-content: space-between;
                    padding: 0 16px;
                    box-shadow: 0 1px 10px rgba(0,0,0,.06);
                }
                .sidebar-overlay {
                    display: none; position: fixed; inset: 0; z-index: 299;
                    background: rgba(15,23,42,.5); backdrop-filter: blur(3px);
                }
                .admin-sidebar {
                    width: 232px;
                    background: #fff;
                    border-right: 1px solid #e2e8f0;
                    display: flex; flex-direction: column; flex-shrink: 0;
                    box-shadow: 4px 0 20px rgba(0,0,0,.04);
                    transition: transform .25s cubic-bezier(.4,0,.2,1);
                    z-index: 300;
                    position: relative;
                }
                .admin-content {
                    flex: 1; overflow-y: auto; display: flex;
                    flex-direction: column; min-width: 0;
                }
                @media (max-width: 768px) {
                    .mob-topbar { display: flex !important; }
                    .admin-sidebar {
                        position: fixed; top: 0; left: 0; bottom: 0;
                        transform: translateX(-100%);
                        box-shadow: 8px 0 32px rgba(0,0,0,.18);
                    }
                    .admin-sidebar.open { transform: translateX(0); }
                    .sidebar-overlay.open { display: block !important; }
                    .admin-content { padding-top: 58px; }
                }
            `}</style>

            {/* ── Mobile Top Bar ── */}
            <div className="mob-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => setOpen(v => !v)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#334155', borderRadius: 8, display: 'flex' }}
                    >
                        <Menu size={22} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Logo size={30} />
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>Priyansh Care</div>
                            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em' }}>Admin Portal</div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px' }}>
                        <PageIcon size={14} color="#0284c7" />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{page.label}</span>
                    </div>
                </div>
            </div>

            {/* ── Overlay ── */}
            <div className={`sidebar-overlay${open ? ' open' : ''}`} onClick={() => setOpen(false)}/>

            {/* ── Sidebar ── */}
            <div ref={r => sidebarRef.current = r} className={`admin-sidebar${open ? ' open' : ''}`}>

                {/* Gradient top accent line */}
                <div style={{ height: 3, background: 'linear-gradient(90deg, #0f172a 0%, #0284c7 50%, #0d9488 100%)', flexShrink: 0 }} />

                {/* Logo */}
                <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
                    <Logo size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Priyansh Care</div>
                        <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2, fontWeight: 600 }}>Admin Portal</div>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        style={{ display: 'none', width: 28, height: 28, borderRadius: 7, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        className="mob-close-btn"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* User info card */}
                <div style={{ margin: '10px 10px 0', padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)', border: '1px solid #e0f2fe', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a, #0284c7)', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(2,132,199,.25)', border: '1.5px solid rgba(255,255,255,.8)' }}>{initials}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                        <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 2px rgba(16,185,129,.2)' }}/>
                            System Admin
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
                    {navItems.map(group => (
                        <div key={group.section} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '.14em', textTransform: 'uppercase', padding: '6px 10px 4px' }}>{group.section}</div>
                            {group.items.map(item => {
                                const ItemIcon = item.icon;
                                return (
                                    <NavLink key={item.to} to={item.to}
                                        className="anl"
                                        style={({ isActive }) => ({
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 10px', borderRadius: 9,
                                            fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                                            color: isActive ? '#0284c7' : '#475569',
                                            background: isActive ? 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)' : 'transparent',
                                            textDecoration: 'none', marginBottom: 2,
                                            borderLeft: isActive ? '3px solid #0284c7' : '3px solid transparent',
                                            transition: 'all .15s',
                                            boxShadow: isActive ? '0 1px 4px rgba(2,132,199,.1)' : 'none',
                                        })}>
                                        <ItemIcon size={16} style={{ flexShrink: 0 }} />
                                        <span style={{ flex: 1 }}>{item.label}</span>
                                        {item.label === 'Dashboard' && (
                                            <span style={{ fontSize: 9, background: 'linear-gradient(135deg, #0f172a, #0284c7)', color: '#fff', padding: '2px 6px', borderRadius: 5, fontWeight: 700 }}>Home</span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Logout */}
                <div style={{ padding: '8px 8px 14px', borderTop: '1px solid #f1f5f9' }}>
                    <button className="al-logout" onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', width: '100%', transition: 'background .15s' }}>
                        <LogOut size={16} />
                        <span>Sign Out</span>
                        <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: .5 }} />
                    </button>
                </div>
            </div>

            {/* ── Main Content ── */}
            <div className="admin-content">
                <Outlet />
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .mob-close-btn { display: flex !important; }
                }
            `}</style>
        </div>
    );
}