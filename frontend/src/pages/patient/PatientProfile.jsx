import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const bloodGroups = ['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'];
const bloodGroupLabels = { A_POSITIVE:'A+', A_NEGATIVE:'A−', B_POSITIVE:'B+', B_NEGATIVE:'B−', AB_POSITIVE:'AB+', AB_NEGATIVE:'AB−', O_POSITIVE:'O+', O_NEGATIVE:'O−' };

/* ─── shared styles (defined once, outside, stable references) ── */
const INP = {width:'100%',border:'1px solid #e5e7eb',borderRadius:'9px',padding:'9px 13px',fontSize:'13px',outline:'none',background:'#fafafa',color:'#111',fontFamily:"'DM Sans',sans-serif",transition:'border .15s',boxSizing:'border-box'};
const LBL = {fontSize:'10px',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'4px',display:'block'};
const VAL = {fontSize:'13px',fontWeight:600,color:'#0f172a',padding:'2px 0'};

/* ─── Generic Field — defined OUTSIDE component so identity is stable ── */
function Field({ label, value, editKey, type='text', error, readOnly=false, editing, form, onChange }) {
    return (
        <div>
            <label style={LBL}>{label}</label>
            {editing ? (
                readOnly
                    ? <input style={{...INP,background:'#f0fdf4',border:'1px solid #bbf7d0',cursor:'not-allowed'}} value={form[editKey]||value||''} readOnly/>
                    : <>
                        <input type={type}
                               style={{...INP, borderColor:error?'#fca5a5':'#e5e7eb'}}
                               value={form[editKey]}
                               onChange={e=>onChange(editKey,e.target.value)}
                               onFocus={e=>e.target.style.borderColor='#1D9E75'}
                               onBlur={e=>e.target.style.borderColor=error?'#fca5a5':'#e5e7eb'}/>
                        {error&&<div style={{fontSize:10,color:'#ef4444',marginTop:3}}>⚠ {error}</div>}
                    </>
            ) : (
                <div style={VAL}>{value||<span style={{color:'#cbd5e1',fontStyle:'italic'}}>Not set</span>}</div>
            )}
        </div>
    );
}

/* ─── Phone Field with +91 prefix — OUTSIDE component ─────────── */
function PhoneField({ label, editKey, error, editing, form, onChange }) {
    /* strip +91 prefix to show just the 10-digit number in the box */
    const raw = (form[editKey] || '').replace(/^\+91\s?/, '');

    function handleChange(e) {
        /* allow only digits, max 10 */
        const digits = e.target.value.replace(/\D/g,'').slice(0,10);
        /* store with +91 prefix internally */
        onChange(editKey, digits ? `+91 ${digits}` : '');
    }

    const isValid  = raw.length === 10 && /^[6-9]/.test(raw);
    const isTouched = raw.length > 0;
    const borderColor = error ? '#fca5a5' : (isTouched && !isValid ? '#fbbf24' : '#e5e7eb');

    return (
        <div>
            <label style={LBL}>{label}</label>
            {editing ? (
                <>
                    <div style={{ display:'flex', gap:0, borderRadius:'9px', border:`1px solid ${error?'#fca5a5':(isTouched&&!isValid?'#fbbf24':'#e5e7eb')}`, background:'#fafafa', overflow:'hidden', transition:'border .15s' }}
                         onFocus={e=>e.currentTarget.style.borderColor='#1D9E75'}
                         onBlur={e=>e.currentTarget.style.borderColor=borderColor}>
                        {/* +91 prefix badge */}
                        <div style={{ padding:'9px 11px', background:'#f0fdf4', borderRight:'1px solid #e5e7eb', fontSize:13, fontWeight:700, color:'#0a4f3a', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                            🇮🇳 +91
                        </div>
                        {/* digits only input */}
                        <input
                            type="tel"
                            inputMode="numeric"
                            placeholder="98765 43210"
                            maxLength={10}
                            value={raw}
                            onChange={handleChange}
                            style={{ flex:1, border:'none', outline:'none', padding:'9px 12px', fontSize:13, background:'transparent', color:'#111', fontFamily:"'DM Sans',sans-serif", letterSpacing:'.03em' }}
                        />
                        {/* live check / X */}
                        {isTouched && (
                            <div style={{ padding:'9px 11px', display:'flex', alignItems:'center', fontSize:14, flexShrink:0 }}>
                                {isValid ? '✅' : '❌'}
                            </div>
                        )}
                    </div>

                    {/* helper text */}
                    <div style={{ fontSize:10, marginTop:4, color: error?'#ef4444' : (isTouched&&!isValid?'#d97706':'#94a3b8') }}>
                        {error
                            ? `⚠ ${error}`
                            : isTouched && raw.length < 10
                                ? `⚠ ${10 - raw.length} more digit${10-raw.length!==1?'s':''} needed`
                                : isTouched && !/^[6-9]/.test(raw)
                                    ? '⚠ Must start with 6, 7, 8 or 9'
                                    : isValid
                                        ? '✓ Valid Indian mobile number'
                                        : 'Enter 10-digit Indian mobile number'
                        }
                    </div>
                </>
            ) : (
                <div style={VAL}>
                    {form[editKey]
                        ? <span style={{ fontFamily:'monospace', letterSpacing:'.04em' }}>{form[editKey]}</span>
                        : <span style={{color:'#cbd5e1',fontStyle:'italic'}}>Not set</span>}
                </div>
            )}
        </div>
    );
}

function PencilIcon({ size=13, color='#fff' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
             stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    );
}

function CameraIcon({ size=14, color='#0a4f3a' }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
             stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </svg>
    );
}

export default function PatientProfile() {
    const navigate = useNavigate();
    const [profile,          setProfile]          = useState(null);
    const [form,             setForm]              = useState({});
    const [editing,          setEditing]           = useState(false);
    const [errors,           setErrors]            = useState({});
    const [loading,          setLoading]           = useState(true);
    const [saving,           setSaving]            = useState(false);
    const [saved,            setSaved]             = useState(false);
    const [avatar,           setAvatar]            = useState(null);
    const [showAvatarMenu,   setShowAvatarMenu]    = useState(false);
    const [insurance,        setInsurance]         = useState(null);
    const [insuranceLoading, setInsuranceLoading]  = useState(true);
    const fileInputRef  = useRef();
    const avatarMenuRef = useRef();

    useEffect(() => { fetchProfile(); fetchInsurance(); }, []);

    useEffect(() => {
        function handleClick(e) {
            if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target))
                setShowAvatarMenu(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    async function fetchProfile() {
        try {
            const { data } = await api.get('/patient/profile');
            setProfile(data);
            setForm({
                name: data.name||'', fatherName: data.fatherName||'',
                gender: data.gender||'', birthDate: data.birthDate||'',
                bloodGroup: data.bloodGroup||'', address: data.address||'',
                city: data.city||'', state: data.state||'', pincode: data.pincode||'',
                emergencyContactName: data.emergencyContactName||'',
                emergencyContactPhone: data.emergencyContactPhone||'',
                height: data.height||'', weight: data.weight||'',
            });
            setAvatar(localStorage.getItem(`avatar_${data.email}`) || null);
        } catch { navigate('/patient/create-profile'); }
        finally  { setLoading(false); }
    }

    async function fetchInsurance() {
        try   { const { data } = await api.get('/patient/insurance'); setInsurance(data); }
        catch { setInsurance(null); }
        finally { setInsuranceLoading(false); }
    }

    function avatarKey() { return `avatar_${profile?.email}`; }

    function handleAvatarFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5*1024*1024) { setErrors(ev=>({...ev,general:'Image must be under 5MB'})); return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const b64 = ev.target.result;
            setAvatar(b64); localStorage.setItem(avatarKey(), b64);
            setSaved(true); setTimeout(()=>setSaved(false), 2500);
        };
        reader.readAsDataURL(file);
        e.target.value=''; setShowAvatarMenu(false);
    }

    function handleRemoveAvatar() {
        setAvatar(null); localStorage.removeItem(avatarKey());
        setShowAvatarMenu(false); setSaved(true); setTimeout(()=>setSaved(false), 2500);
    }

    const set = key => e => setForm(f=>({...f,[key]:e.target.value}));

    function validate() {
        const e={};
        if (!form.name?.trim()) e.name='Name is required';
        if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) e.pincode='Invalid pincode';
        if (form.emergencyContactPhone) {
            const digits = form.emergencyContactPhone.replace(/^\+91\s?/,'').replace(/\D/g,'');
            if (digits.length !== 10 || !/^[6-9]/.test(digits))
                e.emergencyContactPhone = 'Enter a valid 10-digit Indian mobile number';
        }
        setErrors(e);
        return Object.keys(e).length===0;
    }

    async function handleSave() {
        if (!validate()) return;
        setSaving(true);
        try {
            const { data } = await api.put('/patient/profile', {
                name:form.name, fatherName:form.fatherName,
                gender:form.gender||null, birthDate:form.birthDate||null,
                bloodGroup:form.bloodGroup||null, address:form.address,
                city:form.city, state:form.state, pincode:form.pincode,
                emergencyContactName:form.emergencyContactName,
                emergencyContactPhone:form.emergencyContactPhone,
                height:form.height?parseFloat(form.height):null,
                weight:form.weight?parseFloat(form.weight):null,
            });
            setProfile(data); setEditing(false); setSaved(true);
            setTimeout(()=>setSaved(false), 3000);
        } catch(err) {
            setErrors(e=>({...e,general:err.response?.data?.message||'Failed to save.'}));
        } finally { setSaving(false); }
    }

    if (loading) return (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#f0f4f8',minHeight:'60vh'}}>
            <div style={{textAlign:'center',color:'#94a3b8'}}>
                <div style={{fontSize:32,marginBottom:10}}>⏳</div>
                <div style={{fontSize:13}}>Loading your profile...</div>
            </div>
        </div>
    );

    const ini = profile.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'??';
    const bmi = (form.height&&form.weight&&editing)
        ? (parseFloat(form.weight)/((parseFloat(form.height)/100)**2)).toFixed(1)
        : (profile.height&&profile.weight)
            ? (profile.weight/((profile.height/100)**2)).toFixed(1)
            : null;
    const bmiLabel = bmi
        ? bmi<18.5?'⚠️ Underweight':bmi<25?'✅ Normal':bmi<30?'⚠️ Overweight':'🔴 Obese'
        : null;

    const isInsuranceActive = insurance?.validUntil ? new Date(insurance.validUntil)>=new Date() : false;
    const daysUntilExpiry   = insurance?.validUntil
        ? Math.ceil((new Date(insurance.validUntil)-new Date())/86400000) : null;
    const expiringSoon = isInsuranceActive && daysUntilExpiry!==null && daysUntilExpiry<=30;

    const insBg = isInsuranceActive
        ? 'linear-gradient(135deg,#0a4f3a 0%,#1a7a5a 50%,#1D9E75 100%)'
        : 'linear-gradient(135deg,#7f1d1d 0%,#b91c1c 55%,#dc2626 100%)';
    const insShadow = isInsuranceActive
        ? '0 10px 32px rgba(10,79,58,.38), 0 2px 8px rgba(10,79,58,.2)'
        : '0 10px 32px rgba(185,28,28,.38), 0 2px 8px rgba(185,28,28,.2)';

    /* stable field change handler — doesn't recreate Field components */
    const setField = (key, val) => setForm(f => ({...f, [key]: val}));

    return (
        <div style={{display:'flex',flexDirection:'column',background:'#f0f4f8',fontFamily:"'DM Sans','Outfit',sans-serif",minHeight:'100%'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
                @keyframes pp-fadein  { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
                @keyframes ins-shine  { 0%{transform:translateX(-130%) skewX(-18deg)} 100%{transform:translateX(240%) skewX(-18deg)} }
                @keyframes ins-in     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                .pp-2col    { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
                .ins-card   { animation:ins-in .35s ease; transition:transform .25s,box-shadow .25s; cursor:pointer; }
                .ins-card:hover { transform:translateY(-4px) scale(1.008); }
                .ins-shine  { animation:ins-shine 4s ease-in-out infinite; }
                .cam-btn:hover  { transform:scale(1.12) !important; }
                .pen-btn:hover  { background:rgba(255,255,255,.3) !important; }
                .edit-hdr:hover { background:rgba(255,255,255,.22) !important; }
                /* Hero two-column grid */
                .hero-grid  { display:grid; grid-template-columns:1fr 380px; gap:24px; align-items:start; }
                @media(max-width:960px)  { .hero-grid { grid-template-columns:1fr; } .ins-right { align-items:flex-start !important; } }
                @media(max-width:600px)  { .pp-2col { grid-template-columns:1fr !important; } .pp-pad { padding:14px !important; } .pp-hero-pad { padding:20px 16px 24px !important; } }
            `}</style>

            {/* ══════════════════════════════════════════════════════
                HERO
            ══════════════════════════════════════════════════════ */}
            <div className="pp-hero-pad" style={{
                background:'linear-gradient(140deg,#062e22 0%,#0a4f3a 38%,#167a56 72%,#1D9E75 100%)',
                padding:'30px 32px 28px', flexShrink:0, position:'relative', overflow:'hidden',
            }}>
                {/* BG blobs */}
                <div style={{position:'absolute',top:-80,right:-60,width:300,height:300,borderRadius:'50%',background:'rgba(255,255,255,.04)',pointerEvents:'none'}}/>
                <div style={{position:'absolute',bottom:-70,left:'28%',width:220,height:220,borderRadius:'50%',background:'rgba(255,255,255,.03)',pointerEvents:'none'}}/>

                <div className="hero-grid">

                    {/* ── LEFT: Avatar + info + stats ── */}
                    <div>
                        <div style={{display:'flex',alignItems:'flex-start',gap:22,marginBottom:22}}>

                            {/* Avatar */}
                            <div style={{position:'relative',flexShrink:0}} ref={avatarMenuRef}>
                                {avatar
                                    ? <img src={avatar} alt="avatar" style={{width:92,height:92,borderRadius:22,objectFit:'cover',border:'3px solid rgba(255,255,255,.3)',boxShadow:'0 8px 28px rgba(0,0,0,.28)',display:'block'}}/>
                                    : <div style={{width:92,height:92,borderRadius:22,background:'linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.08))',border:'3px solid rgba(255,255,255,.22)',boxShadow:'0 8px 28px rgba(0,0,0,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:800,color:'#fff',fontFamily:"'Playfair Display',serif"}}>{ini}</div>
                                }
                                {/* Camera btn */}
                                <button className="cam-btn" onClick={()=>setShowAvatarMenu(v=>!v)}
                                        style={{position:'absolute',bottom:-9,right:-9,width:30,height:30,borderRadius:9,background:'#fff',border:'2px solid rgba(10,79,58,.1)',boxShadow:'0 3px 10px rgba(0,0,0,.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:0,zIndex:2,transition:'transform .15s'}}>
                                    <CameraIcon size={14} color="#0a4f3a"/>
                                </button>
                                {/* Dropdown */}
                                {showAvatarMenu && (
                                    <div style={{position:'absolute',top:108,left:0,background:'#fff',borderRadius:13,boxShadow:'0 10px 36px rgba(0,0,0,.18)',border:'1px solid #e2e8f0',minWidth:178,zIndex:9999,animation:'pp-fadein .15s ease',overflow:'hidden'}}>
                                        <button onClick={()=>{fileInputRef.current?.click();setShowAvatarMenu(false);}}
                                                style={{width:'100%',padding:'12px 16px',background:'none',border:'none',borderBottom:'1px solid #f1f5f9',textAlign:'left',fontSize:12,fontWeight:600,color:'#0a4f3a',cursor:'pointer',display:'flex',alignItems:'center',gap:9}}
                                                onMouseEnter={e=>e.currentTarget.style.background='#f0fdf4'}
                                                onMouseLeave={e=>e.currentTarget.style.background='none'}>
                                            <CameraIcon size={12} color="#0a4f3a"/> Change Photo
                                        </button>
                                        {avatar!==null&&(
                                            <button onClick={handleRemoveAvatar}
                                                    style={{width:'100%',padding:'12px 16px',background:'none',border:'none',textAlign:'left',fontSize:12,fontWeight:600,color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',gap:9}}
                                                    onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                                                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                                                🗑️ Remove Photo
                                            </button>
                                        )}
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{display:'none'}} onChange={handleAvatarFileChange}/>
                            </div>

                            {/* Name block */}
                            <div style={{paddingTop:5}}>
                                <div style={{fontSize:10,color:'rgba(255,255,255,.38)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.11em',marginBottom:7}}>Patient Profile</div>

                                {/* Name + pencil */}
                                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:7}}>
                                    <div style={{fontSize:27,fontWeight:700,color:'#fff',fontFamily:"'Playfair Display',serif",lineHeight:1.1,letterSpacing:'-.3px'}}>
                                        {profile.name}
                                    </div>
                                    {!editing&&(
                                        <button className="pen-btn" onClick={()=>setEditing(true)} title="Edit profile"
                                                style={{width:30,height:30,borderRadius:8,flexShrink:0,background:'rgba(255,255,255,.16)',border:'1.5px solid rgba(255,255,255,.28)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',padding:0,transition:'background .15s',boxShadow:'0 2px 8px rgba(0,0,0,.14)'}}>
                                            <PencilIcon size={13} color="#fff"/>
                                        </button>
                                    )}
                                </div>
                                <div style={{fontSize:12,color:'rgba(255,255,255,.58)',marginBottom:3}}>✉ {profile.email}</div>
                                <div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>📞 {profile.phone}</div>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                            {[
                                {label:'Blood Group', value:profile.bloodGroup?.replace('_POSITIVE',' +').replace('_NEGATIVE',' −')||'—'},
                                {label:'Height',      value:profile.height?`${profile.height} cm`:'—'},
                                {label:'Weight',      value:profile.weight?`${profile.weight} kg`:'—'},
                                {label:'BMI',         value:bmi?`${bmi} · ${bmiLabel}`:'—'},
                            ].map(s=>(
                                <div key={s.label} style={{background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.13)',borderRadius:11,padding:'9px 16px',backdropFilter:'blur(4px)'}}>
                                    <div style={{fontSize:9,color:'rgba(255,255,255,.4)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:3}}>{s.label}</div>
                                    <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: Full insurance card + edit button ── */}
                    <div className="ins-right" style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:12}}>

                        {insuranceLoading ? (
                            /* skeleton */
                            <div style={{width:'100%',height:189,borderRadius:18,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)'}}/>

                        ) : !insurance ? (
                            /* empty state */
                            <button onClick={()=>navigate('/patient/insurance')}
                                    style={{width:'100%',padding:'18px 20px',borderRadius:18,border:'2px dashed rgba(255,255,255,.22)',background:'rgba(255,255,255,.07)',backdropFilter:'blur(8px)',color:'rgba(255,255,255,.72)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:10,transition:'background .2s'}}
                                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.13)'}
                                    onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.07)'}>
                                <div style={{fontSize:28}}>🛡️</div>
                                <div style={{fontSize:13,fontWeight:700}}>No Insurance Added</div>
                                <div style={{fontSize:11,opacity:.65,textAlign:'center',lineHeight:1.6}}>Tap to add your health insurance policy</div>
                                <div style={{marginTop:4,padding:'7px 20px',borderRadius:9,background:'rgba(255,255,255,.15)',fontSize:12,fontWeight:700}}>＋ Add Insurance</div>
                            </button>

                        ) : (
                            /* ── Full credit-card ── */
                            <div className="ins-card" onClick={()=>navigate('/patient/insurance')}
                                 style={{
                                     width:'100%',
                                     aspectRatio:'1.586 / 1',
                                     borderRadius:20,
                                     background:insBg,
                                     boxShadow:insShadow,
                                     padding:'20px 24px',
                                     color:'#fff',
                                     position:'relative', overflow:'hidden',
                                     display:'flex', flexDirection:'column', justifyContent:'space-between',
                                 }}>
                                {/* circles */}
                                <div style={{position:'absolute',top:-40,right:-40,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,.08)',pointerEvents:'none'}}/>
                                <div style={{position:'absolute',bottom:-50,left:-28,width:170,height:170,borderRadius:'50%',background:'rgba(255,255,255,.05)',pointerEvents:'none'}}/>
                                {/* shimmer */}
                                <div className="ins-shine" style={{position:'absolute',top:0,left:0,width:'42%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.09),transparent)',pointerEvents:'none'}}/>

                                {/* TOP */}
                                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',position:'relative'}}>
                                    <div>
                                        <div style={{fontSize:9,opacity:.52,textTransform:'uppercase',letterSpacing:'.14em',marginBottom:2}}>Health Insurance</div>
                                        <div style={{fontSize:8,opacity:.35,letterSpacing:'.06em'}}>City Care Hospital Portal</div>
                                    </div>
                                    <span style={{
                                        background:isInsuranceActive?'rgba(74,222,128,.2)':'rgba(0,0,0,.26)',
                                        border:isInsuranceActive?'1px solid rgba(74,222,128,.48)':'1px solid rgba(255,100,100,.4)',
                                        color:isInsuranceActive?'#86efac':'#fca5a5',
                                        padding:'3px 12px',borderRadius:20,fontSize:9,fontWeight:800,letterSpacing:'.05em',
                                    }}>
                                        {isInsuranceActive?'✓ ACTIVE':'✗ EXPIRED'}
                                    </span>
                                </div>

                                {/* MIDDLE: provider */}
                                <div style={{position:'relative'}}>
                                    <div style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif",letterSpacing:'.01em',lineHeight:1.2,textShadow:'0 2px 10px rgba(0,0,0,.2)'}}>
                                        {insurance.provider}
                                    </div>
                                </div>

                                {/* BOTTOM */}
                                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',position:'relative'}}>
                                    <div>
                                        <div style={{fontSize:8,opacity:.48,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>Policy Number</div>
                                        <div style={{fontSize:13,fontWeight:700,fontFamily:'monospace',letterSpacing:'.07em'}}>{insurance.policyNumber}</div>
                                    </div>
                                    <div style={{textAlign:'right'}}>
                                        <div style={{fontSize:8,opacity:.48,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:4}}>Valid Until</div>
                                        <div style={{fontSize:13,fontWeight:700,color:expiringSoon?'#fde68a':(!isInsuranceActive?'#fca5a5':'#fff')}}>
                                            {new Date(insurance.validUntil).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                                        </div>
                                        {isInsuranceActive&&daysUntilExpiry!==null&&(
                                            <div style={{fontSize:9,opacity:.58,marginTop:2}}>
                                                {expiringSoon&&'⚠ '}{daysUntilExpiry}d remaining
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save / Cancel — only shown when editing */}
                        {editing && (
                            <div style={{display:'flex',gap:9,width:'100%',justifyContent:'flex-end'}}>
                                <button onClick={()=>{setEditing(false);setErrors({});fetchProfile();}}
                                        style={{padding:'9px 18px',borderRadius:10,border:'1px solid rgba(255,255,255,.27)',background:'transparent',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                        style={{padding:'9px 22px',borderRadius:10,border:'none',background:'#fff',color:'#0a4f3a',fontSize:12,fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?.7:1,boxShadow:'0 3px 12px rgba(0,0,0,.14)'}}>
                                    {saving?'⏳ Saving...':'✓ Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toasts */}
            {saved&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',color:'#15803d',fontSize:12,padding:'10px 20px',display:'flex',alignItems:'center',gap:8}}>✅ Profile updated successfully!</div>}
            {errors.general&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',fontSize:12,padding:'10px 20px',display:'flex',alignItems:'center',gap:8}}>⚠️ {errors.general}</div>}

            {/* ══════════════════════════════════════════════════════
                BODY
            ══════════════════════════════════════════════════════ */}
            <div className="pp-pad" style={{flex:1,padding:'20px 28px',display:'flex',flexDirection:'column',gap:16}}>

                {/* Personal Info */}
                <div style={{background:'#fff',borderRadius:16,border:'1px solid #e8edf2',padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>👤 Personal Information</div>
                    <div className="pp-2col">
                        <Field label="Full Name"     value={profile.name}       editKey="name"       error={errors.name}    editing={editing} form={form} onChange={setField}/>
                        <Field label="Father's Name" value={profile.fatherName} editKey="fatherName"                        editing={editing} form={form} onChange={setField}/>
                        <div>
                            <label style={LBL}>Email <span style={{background:'#dcfce7',color:'#15803d',padding:'1px 6px',borderRadius:10,fontSize:9,fontWeight:700}}>Account</span></label>
                            <div style={VAL}>{profile.email}</div>
                        </div>
                        <div>
                            <label style={LBL}>Phone <span style={{background:'#dcfce7',color:'#15803d',padding:'1px 6px',borderRadius:10,fontSize:9,fontWeight:700}}>Account</span></label>
                            <div style={VAL}>{profile.phone}</div>
                        </div>
                        <div>
                            <label style={LBL}>Gender</label>
                            {editing?(
                                <select style={INP} value={form.gender} onChange={e=>setField('gender',e.target.value)}
                                        onFocus={e=>e.target.style.borderColor='#1D9E75'}
                                        onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
                                    <option value="">Select gender</option>
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            ):<div style={VAL}>{profile.gender||<span style={{color:'#cbd5e1',fontStyle:'italic'}}>Not set</span>}</div>}
                        </div>
                        <div>
                            <label style={LBL}>Date of Birth</label>
                            {editing?(
                                <input type="date" style={INP} value={form.birthDate} onChange={e=>setField('birthDate',e.target.value)}
                                       onFocus={e=>e.target.style.borderColor='#1D9E75'}
                                       onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                            ):(
                                <div style={VAL}>
                                    {profile.birthDate
                                        ?new Date(profile.birthDate).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})
                                        :<span style={{color:'#cbd5e1',fontStyle:'italic'}}>Not set</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div style={{background:'#fff',borderRadius:16,border:'1px solid #e8edf2',padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>📍 Address</div>
                    <div className="pp-2col">
                        <div style={{gridColumn:'1 / -1'}}><Field label="Street Address" value={profile.address} editKey="address" editing={editing} form={form} onChange={setField}/></div>
                        <Field label="City"    value={profile.city}    editKey="city"    editing={editing} form={form} onChange={setField}/>
                        <Field label="State"   value={profile.state}   editKey="state"   editing={editing} form={form} onChange={setField}/>
                        <Field label="Pincode" value={profile.pincode} editKey="pincode" editing={editing} form={form} onChange={setField} error={errors.pincode}/>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div style={{background:'#fff',borderRadius:16,border:'1px solid #e8edf2',padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>🚨 Emergency Contact</div>
                    <div className="pp-2col">
                        <Field label="Contact Name" value={profile.emergencyContactName} editKey="emergencyContactName" editing={editing} form={form} onChange={setField}/>
                        <PhoneField label="Contact Phone" editKey="emergencyContactPhone" error={errors.emergencyContactPhone} editing={editing} form={form} onChange={setField}/>
                    </div>
                </div>

                {/* Health Info */}
                <div style={{background:'#fff',borderRadius:16,border:'1px solid #e8edf2',padding:20,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:16}}>🏥 Health Information</div>
                    <div style={{display:'flex',flexDirection:'column',gap:16}}>
                        <div>
                            <label style={LBL}>Blood Group</label>
                            {editing?(
                                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginTop:4}}>
                                    {bloodGroups.map(bg=>(
                                        <button key={bg} type="button" onClick={()=>setField('bloodGroup',bg)}
                                                style={{padding:'9px 6px',borderRadius:9,fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .15s',
                                                    border:form.bloodGroup===bg?'2px solid #0a4f3a':'1px solid #e5e7eb',
                                                    background:form.bloodGroup===bg?'#E1F5EE':'#fff',
                                                    color:form.bloodGroup===bg?'#0a4f3a':'#374151'}}>
                                            {bloodGroupLabels[bg]}
                                        </button>
                                    ))}
                                </div>
                            ):(
                                <div style={{padding:'2px 0'}}>
                                    {profile.bloodGroup
                                        ?<span style={{background:'#fee2e2',color:'#dc2626',padding:'3px 12px',borderRadius:20,fontSize:13,fontWeight:700}}>
                                            {profile.bloodGroup.replace('_POSITIVE',' +').replace('_NEGATIVE',' −')}
                                         </span>
                                        :<span style={{color:'#cbd5e1',fontStyle:'italic',fontSize:13}}>Not set</span>}
                                </div>
                            )}
                        </div>
                        <div className="pp-2col">
                            <div>
                                <label style={LBL}>Height (cm)</label>
                                {editing
                                    ?<input type="number" style={INP} value={form.height} onChange={e=>setField('height',e.target.value)} onFocus={e=>e.target.style.borderColor='#1D9E75'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                                    :<div style={VAL}>{profile.height?`${profile.height} cm`:<span style={{color:'#cbd5e1',fontStyle:'italic'}}>Not set</span>}</div>}
                            </div>
                            <div>
                                <label style={LBL}>Weight (kg)</label>
                                {editing
                                    ?<input type="number" style={INP} value={form.weight} onChange={e=>setField('weight',e.target.value)} onFocus={e=>e.target.style.borderColor='#1D9E75'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
                                    :<div style={VAL}>{profile.weight?`${profile.weight} kg`:<span style={{color:'#cbd5e1',fontStyle:'italic'}}>Not set</span>}</div>}
                            </div>
                        </div>
                        {bmi&&(
                            <div style={{background:'#f0fdf4',borderRadius:10,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                                <div>
                                    <div style={{fontSize:10,fontWeight:600,color:'#15803d',marginBottom:2}}>BMI (Body Mass Index)</div>
                                    <div style={{fontSize:22,fontWeight:800,color:'#0a4f3a'}}>{bmi}</div>
                                </div>
                                <div style={{fontSize:13,fontWeight:600,color:'#15803d'}}>{bmiLabel}</div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}