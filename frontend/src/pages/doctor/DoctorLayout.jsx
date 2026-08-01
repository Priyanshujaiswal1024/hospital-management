import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import api from '../../api/axios';
import {
    LayoutDashboard,
    Calendar,
    Clock,
    FileText,
    ClipboardList,
    User,
    Pill,
    LogOut,
    Menu,
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
        section: 'Work',
        items: [
            { to: '/doctor/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/doctor/appointments', icon: Calendar,        label: 'Appointments' },
            { to: '/doctor/availability', icon: Clock,           label: 'Set Availability' },
        ],
    },
    {
        section: 'Patient Care',
        items: [
            { to: '/doctor/prescriptions', icon: FileText,      label: 'Prescriptions' },
            { to: '/doctor/records',       icon: ClipboardList, label: 'Medical Records' },
        ],
    },
    {
        section: 'My Account',
        items: [
            { to: '/doctor/profile',   icon: User, label: 'My Profile' },
            { to: '/doctor/medicines', icon: Pill, label: 'Medicines' },
        ],
    },
];

function SidebarContent({ user, initials, savedAvatar, onLogout, onClose }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Gradient accent top bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #0f172a 0%, #0284c7 50%, #38bdf8 100%)', flexShrink: 0 }} />

            {/* Brand */}
            <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
                <Logo size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Priyansh Care</div>
                    <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2, fontWeight: 600 }}>Doctor Portal</div>
                </div>
            </div>

            {/* User card */}
            <div style={{ margin: '10px 10px 0', padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {savedAvatar ? (
                    <img src={savedAvatar} alt="av" style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', border: '2px solid #0284c7', flexShrink: 0 }} />
                ) : (
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #0f172a, #0284c7)', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(2,132,199,.25)' }}>
                        {initials}
                    </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.sub || 'Doctor'}
                    </div>
                    <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 0 2px rgba(16,185,129,.2)' }} />
                        Medical Specialist
                    </div>
                </div>
            </div>

            {/* Nav */}
            <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
                {navItems.map(group => (
                    <div key={group.section} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '.14em', textTransform: 'uppercase', padding: '6px 10px 4px' }}>
                            {group.section}
                        </div>
                        {group.items.map(item => {
                            const IconComp = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onClose}
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
                                    })}
                                >
                                    <IconComp size={16} style={{ flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Logout */}
            <div style={{ padding: '8px 8px 14px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                <button
                    onClick={onLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', width: '100%', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                    <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: .5 }} />
                </button>
            </div>
        </div>
    );
}

export default function DoctorLayout() {
    const { user, logout } = useAuth();
    const navigate         = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isMobile,   setIsMobile]   = useState(() => window.innerWidth <= 768);

    useEffect(() => {
        const fn = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);

    const initials    = user?.sub ? user.sub.slice(0, 2).toUpperCase() : 'DR';
    const savedAvatar = localStorage.getItem(`avatar_${user?.sub}`);

    async function handleLogout() {
        try {
            const token = localStorage.getItem('token');
            await api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
        logout();
        navigate('/login');
    }

    const sidebarProps = { user, initials, savedAvatar, onLogout: handleLogout, onClose: () => setDrawerOpen(false) };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Desktop sidebar */}
            {!isMobile && (
                <div style={{ width: 228, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '4px 0 20px rgba(0,0,0,.04)', height: '100vh', overflowY: 'auto' }}>
                    <SidebarContent {...sidebarProps} />
                </div>
            )}

            {/* Mobile backdrop */}
            {isMobile && drawerOpen && (
                <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(3px)', zIndex: 200 }} />
            )}

            {/* Mobile drawer */}
            {isMobile && (
                <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 244, background: '#fff', zIndex: 201, transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .25s ease', boxShadow: '8px 0 32px rgba(0,0,0,.18)', overflowY: 'auto' }}>
                    <SidebarContent {...sidebarProps} />
                </div>
            )}

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Mobile topbar */}
                {isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', gap: 12, flexShrink: 0, boxShadow: '0 1px 10px rgba(0,0,0,.05)' }}>
                        <button onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#334155', flexShrink: 0, borderRadius: 8 }}>
                            <Menu size={22} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
                            <Logo size={28} />
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>Priyansh Care</div>
                                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em' }}>Doctor Portal</div>
                            </div>
                        </div>
                        {savedAvatar ? (
                            <img src={savedAvatar} alt="av" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '2px solid #0284c7' }} />
                        ) : (
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #0f172a, #0284c7)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {initials}
                            </div>
                        )}
                    </div>
                )}

                {/* Page outlet */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}