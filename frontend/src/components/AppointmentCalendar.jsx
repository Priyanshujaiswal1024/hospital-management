import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Clock, 
    User, 
    Plus, 
    CheckCircle2, 
    Check, 
    XCircle, 
    Building2,
    CalendarDays
} from 'lucide-react';

const statusConfig = {
    BOOKED:    { bg: '#ebf8ff', color: '#0284c7', border: '#bae6fd', label: 'Booked', icon: Clock },
    CONFIRMED: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Confirmed', icon: CheckCircle2 },
    COMPLETED: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', label: 'Completed', icon: Check },
    CANCELLED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Cancelled', icon: XCircle },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AppointmentCalendar({ appointmentsData = null }) {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        if (appointmentsData) {
            setAppointments(appointmentsData);
            setLoading(false);
        } else {
            fetchAppointments();
        }
    }, [appointmentsData]);

    async function fetchAppointments() {
        setLoading(true);
        try {
            const { data } = await api.get('/patient/appointments', {
                params: { page: 0, size: 100 },
            });
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch appointments for calendar:', err);
        } finally {
            setLoading(false);
        }
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month & total days in month
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    // Helper to format Date -> YYYY-MM-DD
    const formatDateKey = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    // Map appointments by date string "YYYY-MM-DD"
    const apptsByDate = {};
    appointments.forEach((a) => {
        if (!a.appointmentTime) return;
        const dateObj = new Date(a.appointmentTime);
        const key = formatDateKey(dateObj);
        if (!apptsByDate[key]) apptsByDate[key] = [];
        apptsByDate[key].push(a);
    });

    const selectedDateKey = formatDateKey(selectedDate);
    const selectedAppts = apptsByDate[selectedDateKey] || [];
    const todayKey = formatDateKey(new Date());

    // Generate calendar days
    const calendarGrid = [];

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const d = new Date(year, month - 1, dayNum);
        calendarGrid.push({ date: d, isCurrentMonth: false, dayNum });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const d = new Date(year, month, dayNum);
        calendarGrid.push({ date: d, isCurrentMonth: true, dayNum });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (calendarGrid.length > 35 ? 42 : 35) - calendarGrid.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
        const d = new Date(year, month + 1, dayNum);
        calendarGrid.push({ date: d, isCurrentMonth: false, dayNum });
    }

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 0
        }}>
            {/* Header / Month Navigation */}
            <div style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(13, 148, 136, 0.25)',
                        border: '1px solid rgba(13, 148, 136, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf'
                    }}>
                        <CalendarDays size={22} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
                            {MONTHS[month]} {year}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', fontWeight: 500 }}>
                            {appointments.length} Total Appointment{appointments.length !== 1 ? 's' : ''} Tracked
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={handleToday}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        Today
                    </button>
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '3px', borderRadius: '10px' }}>
                        <button
                            onClick={handlePrevMonth}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'transparent',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Previous Month"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'transparent',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            title="Next Month"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Body */}
            <div style={{ padding: '20px' }}>
                {/* Days of Week Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '6px',
                    marginBottom: '10px',
                    textAlign: 'center'
                }}>
                    {DAYS.map((day) => (
                        <div key={day} style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            padding: '6px 0'
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                {loading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>Loading calendar schedule...</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '6px'
                    }}>
                        {calendarGrid.map((cell, idx) => {
                            const dateKey = formatDateKey(cell.date);
                            const isToday = dateKey === todayKey;
                            const isSelected = dateKey === selectedDateKey;
                            const cellAppts = apptsByDate[dateKey] || [];
                            const hasAppt = cellAppts.length > 0;

                            // Determine status dot color
                            const hasUpcoming = cellAppts.some(a => ['BOOKED', 'CONFIRMED'].includes(a.status));
                            const hasCompleted = cellAppts.some(a => a.status === 'COMPLETED');
                            const hasCancelled = cellAppts.some(a => a.status === 'CANCELLED');

                            let dotColor = '#94a3b8';
                            if (hasUpcoming) dotColor = '#10b981'; // Green
                            else if (hasCompleted) dotColor = '#3b82f6'; // Blue
                            else if (hasCancelled) dotColor = '#ef4444'; // Red

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(cell.date)}
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '12px',
                                        padding: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.18s ease',
                                        background: isSelected
                                            ? '#0d9488'
                                            : isToday
                                                ? '#f0fdf4'
                                                : cell.isCurrentMonth
                                                    ? '#fafafa'
                                                    : '#ffffff',
                                        border: isSelected
                                            ? '2px solid #0d9488'
                                            : isToday
                                                ? '2px solid #34d399'
                                                : hasAppt
                                                    ? '1.5px solid #cbd5e1'
                                                    : '1px solid #f1f5f9',
                                        color: isSelected
                                            ? '#ffffff'
                                            : cell.isCurrentMonth
                                                ? '#1e293b'
                                                : '#cbd5e1',
                                        boxShadow: isSelected
                                            ? '0 4px 14px rgba(13, 148, 136, 0.35)'
                                            : 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) e.currentTarget.style.background = cell.isCurrentMonth ? '#f1f5f9' : '#f8fafc';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.background = isToday
                                                ? '#f0fdf4'
                                                : cell.isCurrentMonth
                                                    ? '#fafafa'
                                                    : '#ffffff';
                                        }
                                    }}
                                >
                                    <div style={{
                                        fontSize: '13px',
                                        fontWeight: isToday || isSelected ? 800 : cell.isCurrentMonth ? 600 : 400,
                                        lineHeight: 1
                                    }}>
                                        {cell.dayNum}
                                    </div>

                                    {/* Appointment Badges / Indicators */}
                                    {hasAppt && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                            <span style={{
                                                width: isSelected ? '7px' : '6px',
                                                height: isSelected ? '7px' : '6px',
                                                borderRadius: '50%',
                                                background: isSelected ? '#ffffff' : dotColor,
                                                boxShadow: isSelected ? 'none' : `0 0 6px ${dotColor}80`
                                            }} />
                                            {cellAppts.length > 1 && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: 800,
                                                    color: isSelected ? '#ffffff' : '#0f172a',
                                                    lineHeight: 1
                                                }}>
                                                    +{cellAppts.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selected Date Detail Drawer */}
            <div style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: '20px 24px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarIcon size={16} color="#0d9488" />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                            Appointments on {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{
                            background: selectedAppts.length > 0 ? '#ccfbf1' : '#e2e8f0',
                            color: selectedAppts.length > 0 ? '#0f766e' : '#475569',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700
                        }}>
                            {selectedAppts.length}
                        </span>
                    </div>

                    <button
                        onClick={() => navigate('/patient/doctors')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#0d9488',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0f766e'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0d9488'}
                    >
                        <Plus size={14} /> Book New
                    </button>
                </div>

                {selectedAppts.length === 0 ? (
                    <div style={{
                        padding: '24px',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px dashed #cbd5e1',
                        textAlign: 'center',
                        color: '#64748b'
                    }}>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>No appointments scheduled for this date.</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Select another highlighted date or book a new appointment.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedAppts.map((appt) => {
                            const conf = statusConfig[appt.status] || statusConfig.BOOKED;
                            const StatusIcon = conf.icon;
                            const timeStr = appt.appointmentTime
                                ? new Date(appt.appointmentTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                                : appt.timeSlot || 'Scheduled';

                            return (
                                <div
                                    key={appt.id}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        padding: '14px 16px',
                                        border: `1px solid ${conf.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: '#f1f5f9',
                                            color: '#0f172a',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            flexShrink: 0
                                        }}>
                                            <User size={20} color="#0d9488" />
                                        </div>

                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                                {appt.doctorName || 'Doctor Visit'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                                                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} color="#94a3b8" /> {timeStr}
                                                </div>
                                                {appt.departmentName && (
                                                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Building2 size={12} color="#94a3b8" /> {appt.departmentName}
                                                    </div>
                                                )}
                                            </div>
                                            {appt.symptoms && (
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                                                    "{appt.symptoms}"
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{
                                            background: conf.bg,
                                            color: conf.color,
                                            border: `1px solid ${conf.border}`,
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            <StatusIcon size={12} />
                                            {conf.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
