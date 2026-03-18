import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';

const navItems = [
    {
        section: 'Main',
        items: [
            { to: '/patient/profile',      icon: '👤', label: 'My Profile' },
            { to: '/patient/appointments', icon: '📅', label: 'Appointments', badge: 'appt' },
            { to: '/patient/doctors',      icon: '🔍', label: 'Find Doctors' },
            { to: '/patient/departments',  icon: '🏥', label: 'Departments' },
        ],
    },
    {
        section: 'Medical',
        items: [
            { to: '/patient/prescriptions',   icon: '💊', label: 'Prescriptions' },
            { to: '/patient/medicines',       icon: '💉', label: 'Medicines' },
            { to: '/patient/bills',           icon: '🧾', label: 'Bills',           badge: 'bills' },
            { to: '/patient/insurance',       icon: '🛡️', label: 'Insurance' },
            { to: '/patient/medical-records', icon: '📋', label: 'Medical Records' },
        ],
    },
];

// ── OUTSIDE component — stable identity ──
function SidebarContent({ user, initials, savedAvatar, getBadge, onLogout, onClose }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Brand */}
            <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, background: '#0a4f3a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏥</div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0a4f3a', lineHeight: 1.1 }}>Priyansh Care</div>
                    <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 1 }}>Hospital</div>
                </div>
            </div>

            {/* User */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {savedAvatar ? (
                    <img src={savedAvatar} alt="av" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '1.5px solid #a7f3d0', flexShrink: 0 }} />
                ) : (
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F5EE', color: '#0a4f3a', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {initials}
                    </div>
                )}
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#111', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{user?.sub || 'Patient'}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>Patient</div>
                </div>
            </div>

            {/* Nav */}
            <div style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
                {navItems.map(group => (
                    <div key={group.section}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#d1d5db', letterSpacing: '.1em', textTransform: 'uppercase', padding: '8px 6px 3px' }}>
                            {group.section}
                        </div>
                        {group.items.map(item => {
                            const badge = item.badge ? getBadge(item.badge) : null;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
                                    style={({ isActive }) => ({
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '7px 8px', borderRadius: 7,
                                        fontSize: 12, fontWeight: isActive ? 600 : 500,
                                        color: isActive ? '#0a4f3a' : '#6b7280',
                                        background: isActive ? '#E1F5EE' : 'transparent',
                                        textDecoration: 'none', marginBottom: 1,
                                        transition: 'all .12s',
                                    })}
                                    onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = '#f9fafb'; }}
                                    onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = ''; }}
                                >
                                    <span style={{ fontSize: 13, width: 16, textAlign: 'center' }}>{item.icon}</span>
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {badge && (
                                        <span style={{ background: item.badge === 'bills' ? '#fee2e2' : '#0a4f3a', color: item.badge === 'bills' ? '#dc2626' : '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 6, fontWeight: 700 }}>
                                            {badge}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Logout */}
            <div style={{ padding: '8px 8px 10px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                <button
                    onClick={onLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', borderRadius: 7, fontSize: 11, fontWeight: 600, color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', width: '100%' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    ⬅ Logout
                </button>
            </div>
        </div>
    );
}

export default function PatientLayout({ upcomingCount = 0, unpaidCount = 0 }) {
    const { user, logout } = useAuth();
    const navigate         = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isMobile,   setIsMobile]   = useState(() => window.innerWidth <= 768);

    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);

    const initials    = user?.sub ? user.sub.slice(0, 2).toUpperCase() : 'PT';
    const savedAvatar = localStorage.getItem(`avatar_${user?.sub}`);

    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
        logout();
        navigate('/login');
    }

    function getBadge(key) {
        if (key === 'appt')  return upcomingCount > 0 ? upcomingCount : null;
        if (key === 'bills') return unpaidCount   > 0 ? unpaidCount   : null;
        return null;
    }

    const sidebarProps = {
        user, initials, savedAvatar, getBadge,
        onLogout: handleLogout,
        onClose: () => setDrawerOpen(false),
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f8fa', fontFamily: "'DM Sans','Outfit',sans-serif" }}>

            {/* Desktop sidebar */}
            {!isMobile && (
                <div style={{ width: 210, background: '#fff', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', overflowY: 'auto' }}>
                    <SidebarContent {...sidebarProps} />
                </div>
            )}

            {/* Mobile backdrop */}
            {isMobile && drawerOpen && (
                <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200 }} />
            )}

            {/* Mobile drawer */}
            {isMobile && (
                <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 230, background: '#fff', zIndex: 201, transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .25s ease', boxShadow: '4px 0 24px rgba(0,0,0,.15)', overflowY: 'auto' }}>
                    <SidebarContent {...sidebarProps} />
                </div>
            )}

            {/* Main */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Mobile topbar */}
                {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #f0f0f0', gap: 12, flexShrink: 0, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
                        <button onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1, color: '#374151', flexShrink: 0 }}>☰</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <div style={{ width: 28, height: 28, background: '#0a4f3a', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🏥</div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a4f3a' }}>Priyansh Care</span>
                        </div>
                        {savedAvatar ? (
                            <img src={savedAvatar} alt="av" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '1.5px solid #a7f3d0', flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F5EE', color: '#0a4f3a', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {initials}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}