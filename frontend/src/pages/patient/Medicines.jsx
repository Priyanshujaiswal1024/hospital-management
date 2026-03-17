import { useState, useEffect } from 'react';
import api from '../../api/axios';

const typeConfig = {
    TABLET:    { icon: '💊', color: '#3b82f6', bg: '#eff6ff' },
    CAPSULE:   { icon: '💉', color: '#8b5cf6', bg: '#f5f3ff' },
    SYRUP:     { icon: '🍶', color: '#f59e0b', bg: '#fffbeb' },
    INJECTION: { icon: '🩺', color: '#ef4444', bg: '#fef2f2' },
    OINTMENT:  { icon: '🧴', color: '#10b981', bg: '#f0fdf4' },
    DROPS:     { icon: '💧', color: '#06b6d4', bg: '#ecfeff' },
};

export default function Medicines() {
    const [query, setQuery]         = useState('');
    const [results, setResults]     = useState([]);
    const [loading, setLoading]     = useState(false);
    const [searched, setSearched]   = useState(false);
    const [selected, setSelected]   = useState(null); // detail modal

    // search on keystroke — debounced
    useEffect(() => {
        if (!query.trim()) { setResults([]); setSearched(false); return; }
        const timer = setTimeout(() => searchMedicines(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    async function searchMedicines(name) {
        setLoading(true);
        setSearched(true);
        try {
            const { data } = await api.get('/medicines/search', {
                params: { name },
            });
            setResults(data);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* topbar */}
            <div style={{
                background: '#fff', borderBottom: '1px solid #f0f0f0',
                padding: '12px 20px', position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111' }}>
                    Medicines
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                    Search medicines by name
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

                {/* search box */}
                <div style={{
                    background: 'linear-gradient(120deg,#0a4f3a,#1D9E75)',
                    borderRadius: '14px', padding: '24px',
                    marginBottom: '20px', position: 'relative', overflow: 'hidden',
                }}>
                    {/* decorative circles */}
                    <div style={{
                        position: 'absolute', right: '-20px', top: '-20px',
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.07)',
                    }}/>
                    <div style={{
                        position: 'absolute', right: '80px', bottom: '-30px',
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(255,255,255,.05)',
                    }}/>

                    <div style={{
                        fontSize: '18px', fontWeight: 700, color: '#fff',
                        marginBottom: '4px',
                        fontFamily: "'Playfair Display', serif",
                    }}>
                        💊 Medicine Search
                    </div>
                    <div style={{
                        fontSize: '11px', color: 'rgba(255,255,255,.7)',
                        marginBottom: '16px',
                    }}>
                        Search by medicine name to view details, price & dosage
                    </div>

                    {/* search input */}
                    <div style={{ position: 'relative' }}>
                        <span style={{
                            position: 'absolute', left: '14px', top: '50%',
                            transform: 'translateY(-50%)', fontSize: '15px',
                        }}>🔍</span>
                        <input
                            style={{
                                width: '100%', borderRadius: '10px', border: 'none',
                                padding: '12px 16px 12px 40px', fontSize: '13px',
                                outline: 'none', fontFamily: 'Outfit, sans-serif',
                                background: 'rgba(255,255,255,.95)',
                                boxSizing: 'border-box',
                            }}
                            placeholder="Type medicine name... e.g. Paracetamol, Amoxicillin"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: '#e5e7eb', border: 'none',
                                    borderRadius: '50%', width: '22px', height: '22px',
                                    cursor: 'pointer', fontSize: '11px', color: '#6b7280',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >✕</button>
                        )}
                    </div>

                    {/* result count */}
                    {searched && !loading && (
                        <div style={{
                            fontSize: '11px', color: 'rgba(255,255,255,.7)',
                            marginTop: '10px',
                        }}>
                            {results.length > 0
                                ? `✅ ${results.length} medicine${results.length > 1 ? 's' : ''} found for "${query}"`
                                : `❌ No medicines found for "${query}"`
                            }
                        </div>
                    )}
                </div>

                {/* loading skeletons */}
                {loading && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px',
                    }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                background: '#f3f4f6', borderRadius: '12px',
                                height: '120px', animation: 'pulse 1.5s infinite',
                            }}/>
                        ))}
                    </div>
                )}

                {/* empty state — before search */}
                {!loading && !searched && (
                    <div style={{
                        textAlign: 'center', padding: '50px 20px',
                        color: '#9ca3af',
                    }}>
                        <div style={{ fontSize: '50px', marginBottom: '12px' }}>💊</div>
                        <div style={{
                            fontWeight: 600, color: '#374151',
                            fontSize: '14px', marginBottom: '6px',
                        }}>
                            Search for Medicines
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            Type a medicine name above to see details, price & availability
                        </div>

                        {/* medicine type chips */}
                        <div style={{
                            display: 'flex', gap: '8px', flexWrap: 'wrap',
                            justifyContent: 'center', marginTop: '20px',
                        }}>
                            {Object.entries(typeConfig).map(([type, cfg]) => (
                                <button
                                    key={type}
                                    onClick={() => setQuery(type.toLowerCase())}
                                    style={{
                                        padding: '6px 14px', borderRadius: '20px',
                                        border: `1px solid ${cfg.color}`,
                                        background: cfg.bg, color: cfg.color,
                                        fontSize: '11px', fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {cfg.icon} {type.charAt(0) + type.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* no results */}
                {!loading && searched && results.length === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '50px',
                        background: '#fff', borderRadius: '12px',
                        border: '1px solid #f0f0f0',
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                        <div style={{
                            fontWeight: 600, color: '#374151',
                            marginBottom: '6px',
                        }}>
                            No medicines found
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Try a different name or spelling
                        </div>
                    </div>
                )}

                {/* results grid */}
                {!loading && results.length > 0 && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px',
                    }}>
                        {results.map(med => {
                            const cfg = typeConfig[med.type] || typeConfig.TABLET;
                            return (
                                <div
                                    key={med.id}
                                    onClick={() => setSelected(med)}
                                    style={{
                                        background: '#fff', border: '1px solid #f0f0f0',
                                        borderRadius: '12px', padding: '16px',
                                        cursor: 'pointer', transition: 'all .15s',
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
                                    {/* type badge + icon */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', marginBottom: '10px',
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            background: cfg.bg, color: cfg.color,
                                            fontSize: '20px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {cfg.icon}
                                        </div>
                                        <span style={{
                                            background: cfg.bg, color: cfg.color,
                                            fontSize: '9px', fontWeight: 700,
                                            padding: '3px 8px', borderRadius: '6px',
                                            border: `1px solid ${cfg.color}33`,
                                        }}>
                                            {med.type}
                                        </span>
                                    </div>

                                    {/* name */}
                                    <div style={{
                                        fontSize: '13px', fontWeight: 700,
                                        color: '#111', marginBottom: '3px',
                                    }}>
                                        {med.name}
                                    </div>

                                    {/* category */}
                                    <div style={{
                                        fontSize: '11px', color: '#6b7280',
                                        marginBottom: '10px',
                                    }}>
                                        {med.category || 'General'}
                                    </div>

                                    <div style={{
                                        borderTop: '1px solid #f3f4f6',
                                        paddingTop: '10px',
                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                        gap: '8px',
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                Price
                                            </div>
                                            <div style={{
                                                fontSize: '13px', fontWeight: 700,
                                                color: '#0a4f3a',
                                            }}>
                                                ₹{med.price}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                Stock
                                            </div>
                                            <div style={{
                                                fontSize: '13px', fontWeight: 700,
                                                color: med.stock > 10 ? '#166534' : '#dc2626',
                                            }}>
                                                {med.stock > 0 ? `${med.stock} left` : 'Out of stock'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        marginTop: '8px', fontSize: '10px',
                                        color: '#9ca3af', textAlign: 'center',
                                    }}>
                                        Tap for details →
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ✅ Detail Modal */}
            {selected && (
                <div
                    onClick={() => setSelected(null)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,.4)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', zIndex: 100,
                        padding: '20px',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff', borderRadius: '16px',
                            padding: '24px', width: '100%', maxWidth: '420px',
                            boxShadow: '0 20px 60px rgba(0,0,0,.2)',
                        }}
                    >
                        {/* modal header */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', marginBottom: '20px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: typeConfig[selected.type]?.bg || '#f3f4f6',
                                    fontSize: '24px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {typeConfig[selected.type]?.icon || '💊'}
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: '16px', fontWeight: 700, color: '#111',
                                    }}>
                                        {selected.name}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                        {selected.category}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                style={{
                                    background: '#f3f4f6', border: 'none',
                                    borderRadius: '50%', width: '32px', height: '32px',
                                    cursor: 'pointer', fontSize: '14px', color: '#6b7280',
                                }}
                            >✕</button>
                        </div>

                        {/* details grid */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gap: '12px', marginBottom: '16px',
                        }}>
                            {[
                                { label: 'Type',         value: selected.type },
                                { label: 'Dosage',       value: selected.dosage || '—' },
                                { label: 'Manufacturer', value: selected.manufacturer || '—' },
                                { label: 'Price',        value: `₹${selected.price}` },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: '#f9fafb', borderRadius: '10px',
                                    padding: '10px 12px',
                                }}>
                                    <div style={{
                                        fontSize: '10px', color: '#9ca3af',
                                        textTransform: 'uppercase', marginBottom: '3px',
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{
                                        fontSize: '13px', fontWeight: 600, color: '#111',
                                    }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* stock bar */}
                        <div style={{
                            background: '#f9fafb', borderRadius: '10px',
                            padding: '12px', marginBottom: '16px',
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                marginBottom: '6px',
                            }}>
                                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                                    Stock Availability
                                </span>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700,
                                    color: selected.stock > 10 ? '#166534' : '#dc2626',
                                }}>
                                    {selected.stock} units
                                </span>
                            </div>
                            <div style={{
                                height: '6px', background: '#e5e7eb',
                                borderRadius: '3px', overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', borderRadius: '3px',
                                    width: `${Math.min((selected.stock / 100) * 100, 100)}%`,
                                    background: selected.stock > 10
                                        ? 'linear-gradient(90deg,#0a4f3a,#1D9E75)'
                                        : '#ef4444',
                                    transition: 'width .5s',
                                }}/>
                            </div>
                            <div style={{
                                fontSize: '10px', color: '#9ca3af', marginTop: '4px',
                            }}>
                                {selected.stock > 10
                                    ? '✅ In Stock'
                                    : selected.stock > 0
                                        ? '⚠️ Low Stock'
                                        : '❌ Out of Stock'
                                }
                            </div>
                        </div>

                        <button
                            onClick={() => setSelected(null)}
                            style={{
                                width: '100%', padding: '11px', borderRadius: '10px',
                                border: 'none', background: '#0a4f3a', color: '#fff',
                                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%,100% { opacity:1; } 50% { opacity:.5; }
                }
            `}</style>
        </div>
    );
}