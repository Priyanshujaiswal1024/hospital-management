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

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AppointmentCalendar({ appointmentsData = null, compact = false }) {
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

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
    };

    const formatDateKey = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

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

    const calendarGrid = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const d = new Date(year, month - 1, dayNum);
        calendarGrid.push({ date: d, isCurrentMonth: false, dayNum });
    }
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
        const d = new Date(year, month, dayNum);
        calendarGrid.push({ date: d, isCurrentMonth: true, dayNum });
    }
    const remainingCells = (calendarGrid.length > 35 ? 42 : 35) - calendarGrid.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
        const d = new Date(year, month + 1, dayNum);
        calendarGrid.push({ date: d, isCurrentMonth: false, dayNum });
    }

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        }}>
            {/* Header Nav */}
            <div style={{
                padding: compact ? '14px 16px' : '18px 20px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: compact ? '34px' : '40px',
                        height: compact ? '34px' : '40px',
                        borderRadius: '10px',
                        background: 'rgba(13, 148, 136, 0.25)',
                        border: '1px solid rgba(13, 148, 136, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2dd4bf'
                    }}>
                        <CalendarDays size={compact ? 18 : 20} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: compact ? '15px' : '17px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            {MONTHS[month]} {year}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
                            {appointments.length} Appointment{appointments.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        onClick={handleToday}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Today
                    </button>
                    <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.1)', padding: '2px', borderRadius: '8px' }}>
                        <button
                            onClick={handlePrevMonth}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div style={{ padding: compact ? '12px 14px' : '16px 18px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '4px',
                    marginBottom: '8px',
                    textAlign: 'center'
                }}>
                    {DAYS.map((day) => (
                        <div key={day} style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {day}
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                        Loading calendar...
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '4px'
                    }}>
                        {calendarGrid.map((cell, idx) => {
                            const dateKey = formatDateKey(cell.date);
                            const isToday = dateKey === todayKey;
                            const isSelected = dateKey === selectedDateKey;
                            const cellAppts = apptsByDate[dateKey] || [];
                            const hasAppt = cellAppts.length > 0;

                            const hasUpcoming = cellAppts.some(a => ['BOOKED', 'CONFIRMED'].includes(a.status));
                            const hasCompleted = cellAppts.some(a => a.status === 'COMPLETED');
                            const hasCancelled = cellAppts.some(a => a.status === 'CANCELLED');

                            let dotColor = '#94a3b8';
                            if (hasUpcoming) dotColor = '#10b981';
                            else if (hasCompleted) dotColor = '#3b82f6';
                            else if (hasCancelled) dotColor = '#ef4444';

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(cell.date)}
                                    style={{
                                        height: compact ? '32px' : '38px',
                                        borderRadius: '8px',
                                        padding: '2px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.15s ease',
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
                                                    ? '1px solid #cbd5e1'
                                                    : '1px solid #f1f5f9',
                                        color: isSelected
                                            ? '#ffffff'
                                            : cell.isCurrentMonth
                                                ? '#1e293b'
                                                : '#cbd5e1',
                                    }}
                                >
                                    <div style={{
                                        fontSize: compact ? '11px' : '12px',
                                        fontWeight: isToday || isSelected ? 800 : cell.isCurrentMonth ? 600 : 400,
                                        lineHeight: 1
                                    }}>
                                        {cell.dayNum}
                                    </div>

                                    {hasAppt && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                                            <span style={{
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: isSelected ? '#ffffff' : dotColor
                                            }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selected Date Detail Section */}
            <div style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                padding: compact ? '12px 14px' : '16px 18px',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarIcon size={14} color="#0d9488" />
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                            {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} Visits
                        </span>
                        <span style={{
                            background: selectedAppts.length > 0 ? '#ccfbf1' : '#e2e8f0',
                            color: selectedAppts.length > 0 ? '#0f766e' : '#475569',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '10px',
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
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#0d9488',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <Plus size={12} /> Book
                    </button>
                </div>

                {selectedAppts.length === 0 ? (
                    <div style={{
                        padding: '12px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px dashed #cbd5e1',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '11px'
                    }}>
                        No visits on this date.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                        borderRadius: '10px',
                                        padding: '10px 12px',
                                        border: `1px solid ${conf.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {appt.doctorName || 'Doctor Visit'}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                            <Clock size={10} color="#94a3b8" /> {timeStr}
                                        </div>
                                    </div>

                                    <span style={{
                                        background: conf.bg,
                                        color: conf.color,
                                        border: `1px solid ${conf.border}`,
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        flexShrink: 0
                                    }}>
                                        <StatusIcon size={10} />
                                        {conf.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
