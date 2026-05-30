import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  BarChart2, Globe2, Bot, TrendingUp, Search, Activity,
  ChevronLeft, ChevronRight, RefreshCw, ExternalLink,
  CheckCircle2, XCircle, AlertCircle, Sparkles, Edit3,
  LogOut, ChevronDown, Settings, User, Wifi, WifiOff, Info,
} from 'lucide-react';
import AIHealthReport from '../components/AIHealthReport';
import { useAuth } from '../contexts/AuthContext';
import { initiateGoogleLogin, isGoogleConfigured } from '../lib/auth';
import {
  getGSCToken, clearGSCAuth, listSites, getSearchAnalytics, getDateRange,
} from '../lib/searchConsole';
import { getGA4Token, clearGA4Auth, listGA4Properties, runGA4Report } from '../lib/analytics';
import { getAIHealthReport } from '../lib/api';
import { MOCK_SC, MOCK_GA4 } from '../lib/mockData';

/* ── Tokens ──────────────────────────────────────────────────────────────── */
const C = {
  bg:'#000', bgAlt:'#0a0a0a', card:'#141414', border:'#1a1a1a', bMid:'#262626',
  text:'#fff', sub:'#a0a0a0', muted:'#555',
  green:'#22c55e', blue:'#3b82f6', red:'#ef4444', amber:'#f59e0b', purple:'#6366f1',
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const posColor = p => p < 5 ? C.green : p < 20 ? C.amber : C.red;

function formatSCError(msg = '') {
  const low = msg.toLowerCase();
  if (low.includes('401') || low.includes('invalid authentication') || low.includes('credentials')) {
    return 'Session expired or invalid. Please sign out and sign in again, ensuring you check all permission boxes.';
  }
  if (low.includes('403') || low.includes('permission denied')) {
    return 'Permission denied. Make sure you granted Search Console access and enabled the API in Google Cloud Console.';
  }
  if (low.includes('404')) return 'No Search Console data found for your account.';
  return msg || 'Could not load Search Console data.';
}

function GoogleG({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink:0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function Avatar({ user, size = 32 }) {
  if (user?.avatar) return <img src={user.avatar} alt={user.name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', border:`1px solid ${C.border}` }}/>;
  const initials = (user?.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:`1px solid ${C.bMid}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.36, fontWeight:700, color:C.text, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function MetricCard({ icon, label, value, delta, up, color=C.text }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', flex:'1 1 150px', minWidth:140 }}>
      {icon && (
        <div style={{ width:32, height:32, borderRadius:8, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color:C.text, letterSpacing:'-0.03em', lineHeight:1 }}>{value??'—'}</div>
      {delta && <div style={{ fontSize:10, marginTop:5, color:up?C.green:C.red, fontWeight:600 }}>{delta}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>{children}</div>;
}

function DarkTip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.bMid}`, borderRadius:8, padding:'10px 14px', fontSize:11, fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ color:C.muted, marginBottom:6 }}>{label}</div>
      {payload.map(p=>(
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }}/>
          <span style={{ color:'#ccc' }}>{p.name}: <strong style={{ color:C.text }}>{p.value?.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ indexed, total }) {
  const r=32, circ=2*Math.PI*r, pct=total?indexed/total:0;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink:0 }}>
      <circle cx="45" cy="45" r={r} fill="none" stroke={C.border} strokeWidth="7"/>
      <circle cx="45" cy="45" r={r} fill="none" stroke={C.red} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={0} transform="rotate(-90 45 45)"/>
      <circle cx="45" cy="45" r={r} fill="none" stroke={C.green} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={circ-pct*circ} transform="rotate(-90 45 45)" style={{ transition:'stroke-dashoffset 1s ease' }}/>
      <text x="45" y="49" textAnchor="middle" fill={C.text} fontSize="12" fontWeight="700" style={{ fontFamily:"'Inter',system-ui,sans-serif" }}>{Math.round(pct*100)}%</text>
    </svg>
  );
}

/* ── Status badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status, label }) {
  const cfg = {
    connected:  { bg:'rgba(34,197,94,0.1)',  border:'rgba(34,197,94,0.25)',  color:C.green,  Icon:CheckCircle2 },
    error:      { bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)',  color:C.red,    Icon:XCircle      },
    loading:    { bg:'rgba(255,255,255,0.04)',border:'rgba(255,255,255,0.1)', color:C.sub,    Icon:RefreshCw    },
    demo:       { bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.2)', color:C.amber,  Icon:Info         },
    no_sites:   { bg:'rgba(99,102,241,0.08)', border:'rgba(99,102,241,0.2)', color:'#818cf8', Icon:AlertCircle  },
  }[status] || { bg:'transparent', border:C.border, color:C.muted, Icon:Info };
  const { bg, border, color, Icon } = cfg;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, color, background:bg, border:`1px solid ${border}`, borderRadius:20, padding:'3px 9px' }}>
      <Icon size={10} style={{ animation:status==='loading'?'spin 1s linear infinite':'' }}/> {label}
    </span>
  );
}

const thStyle = { fontSize:9, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em' };
const tdBase  = { fontSize:12, color:C.sub, padding:'10px 16px', borderBottom:`1px solid ${C.border}` };

const NAV = [
  { Icon:BarChart2, label:'Dashboard', href:'/dashboard', color:C.purple },
  { Icon:Edit3,     label:'Analyzer',  href:'/analyze',   color:C.green  },
  { Icon:Search,    label:'Indexing',  href:'/analyze',   color:C.blue   },
  { Icon:Activity,  label:'Analytics', href:'/dashboard', color:C.amber  },
];

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isDemo = !!user?.demo;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  /* SC state */
  const [sites,      setSites]      = useState([]);
  const [selSite,    setSelSite]    = useState(() => localStorage.getItem('gsc_site') || '');
  const [scData,     setScData]     = useState(null);
  const [loadingSC,  setLoadingSC]  = useState(false);
  const [scStatus,   setScStatus]   = useState('loading'); // 'loading'|'connected'|'error'|'no_sites'|'demo'
  const [scError,    setScError]    = useState('');

  /* GA4 state */
  const [properties,  setProperties]  = useState([]);
  const [selProp,     setSelProp]     = useState(() => localStorage.getItem('ga4_property') || '');
  const [ga4Data,     setGa4Data]     = useState(null);
  const [ga4Status,   setGa4Status]   = useState('loading');
  const [loadingGA4,  setLoadingGA4]  = useState(false);
  const [ga4Error,    setGa4Error]    = useState('');

  /* AI report */
  const [aiReport,  setAiReport]  = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState(null);

  /* ── Always show something — real data or MOCK fallback ─────────────── */
  const displaySCData = scData || MOCK_SC;
  const displayGA4    = ga4Data || MOCK_GA4;
  const isRealSC  = !!scData;
  const isRealGA4 = !!ga4Data;

  /* Close menu on outside click */
  useEffect(() => {
    const fn = e => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* ── DEMO: set state once ────────────────────────────────────────────── */
  useEffect(() => {
    if (!isDemo) return;
    setScStatus('demo');
    setGa4Status('demo');
  }, [isDemo]);

  /* ── GOOGLE: load sites then analytics ──────────────────────────────── */
  const loadSCData = useCallback(async (siteOverride) => {
    const gscToken = getGSCToken();
    const site = siteOverride || selSite;
    if (isDemo || !gscToken || !site) return;

    setLoadingSC(true);
    setScError('');

    try {
      const { startDate, endDate } = getDateRange(30);
      const [dateRows, pageRows, queryRows] = await Promise.all([
        getSearchAnalytics(gscToken, site, { startDate, endDate, dimensions:['date'],  rowLimit:30 }),
        getSearchAnalytics(gscToken, site, { startDate, endDate, dimensions:['page'],  rowLimit:10 }),
        getSearchAnalytics(gscToken, site, { startDate, endDate, dimensions:['query'], rowLimit:10 }),
      ]);

      const rows = dateRows.rows || [];
      const tot = rows.reduce((a,r) => ({ clicks:a.clicks+r.clicks, impressions:a.impressions+r.impressions }),
        { clicks:0, impressions:0 });
      tot.ctr      = tot.impressions ? (tot.clicks/tot.impressions)*100 : 0;
      tot.position = rows.length ? rows.reduce((s,r)=>s+r.position,0)/rows.length : 0;

      setScData({
        totals:      tot,
        daily:       rows.map(r=>({ date:r.keys[0], clicks:r.clicks, impressions:r.impressions })),
        topPages:    (pageRows.rows||[]).map(r=>({ page:r.keys[0], clicks:r.clicks, impressions:r.impressions, ctr:r.ctr*100, position:r.position })),
        topKeywords: (queryRows.rows||[]).map(r=>({ query:r.keys[0], clicks:r.clicks, impressions:r.impressions, ctr:r.ctr*100, position:r.position })),
        indexedPages:0, totalSubmitted:0,
      });
      setScStatus('connected');
    } catch(e) {
      console.error('SC analytics error:', e);
      setScError(formatSCError(e.message));
      setScStatus('error');
    } finally {
      setLoadingSC(false);
    }
  }, [selSite, isDemo]);

  const initGSC = useCallback(async () => {
    const gscToken = getGSCToken();
    if (isDemo || !gscToken) return;

    setLoadingSC(true);
    setScStatus('loading');
    setScError('');

    try {
      const sitesRes = await listSites(gscToken);
      const siteList = (sitesRes.siteEntry || []).map(s => s.siteUrl);

      if (siteList.length === 0) {
        setScStatus('no_sites');
        setLoadingSC(false);
        return;
      }

      setSites(siteList);
      const site = selSite && siteList.includes(selSite) ? selSite : siteList[0];
      setSelSite(site);
      localStorage.setItem('gsc_site', site);
      
      // Load analytics for this site immediately
      await loadSCData(site);
    } catch(e) {
      console.error('SC init error:', e);
      setScError(formatSCError(e.message));
      setScStatus('error');
      setLoadingSC(false);
    }
  }, [isDemo, selSite, loadSCData]);

  const loadGA4Data = useCallback(async (propOverride) => {
    const ga4Token = getGA4Token();
    if (isDemo || !ga4Token) return;

    setLoadingGA4(true);
    setGa4Status('loading');
    setGa4Error('');

    try {
      // 1. Get properties if we don't have them
      let props = properties;
      if (props.length === 0) {
        const res = await listGA4Properties(ga4Token);
        props = res.properties || [];
        setProperties(props);
      }

      // 2. Determine which property to use
      const propId = propOverride || selProp || (props[0]?.name?.replace('properties/', '') || '');
      if (!propId) { setGa4Status('no_sites'); setLoadingGA4(false); return; }

      setSelProp(propId);
      localStorage.setItem('ga4_property', propId);

      // 3. Run report
      const report = await runGA4Report(ga4Token, propId);
      const row = report.rows?.[0];
      if (!row) { 
        setGa4Data(null);
        setGa4Status('connected'); // or 'no_data'?
        setLoadingGA4(false); 
        return; 
      }

      const [sessions, users, bounce, dur] = row.metricValues.map(m=>m.value);
      setGa4Data({
        sessions:           parseInt(sessions||0).toLocaleString(),
        activeUsers:        parseInt(users||0).toLocaleString(),
        bounceRate:         parseFloat(bounce||0).toFixed(1),
        avgSessionDuration: `${Math.floor(parseFloat(dur||0)/60)}m ${Math.floor(parseFloat(dur||0)%60)}s`,
      });
      setGa4Status('connected');
    } catch(e) {
      console.error('GA4 error:', e);
      setGa4Error(e.message);
      setGa4Status('error');
    } finally {
      setLoadingGA4(false);
    }
  }, [selProp, isDemo, properties]);

  useEffect(() => { 
    if (!isDemo) { 
      initGSC(); 
      loadGA4Data(); 
    } 
  }, [isDemo]);

  /* AI health report — runs after SC data available */
  useEffect(() => {
    if (!displaySCData || aiReport || aiLoading) return;
    setAiLoading(true);
    getAIHealthReport({ topPages:displaySCData.topPages, topKeywords:displaySCData.topKeywords, totalClicks:displaySCData.totals.clicks, previousClicks:Math.floor(displaySCData.totals.clicks*0.85) })
      .then(r => setAiReport(r))
      .catch(e => setAiError(e.message))
      .finally(() => setAiLoading(false));
  }, [displaySCData]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleReconnect = () => { if (isGoogleConfigured()) initiateGoogleLogin('/dashboard'); else alert('Add VITE_GOOGLE_CLIENT_ID to .env to enable Google OAuth.'); };

  /* ── Reload on site change ──────────────────────────────────────────── */
  const onSiteChange = (site) => {
    setSelSite(site);
    localStorage.setItem('gsc_site', site);
    setScData(null);
    setAiReport(null);
    loadSCData(site);
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:"'Inter',system-ui,sans-serif", color:C.text, display:'flex', flexDirection:'column' }}>
      <style>{`
        ::-webkit-scrollbar{width:0;height:0} *{scrollbar-width:none}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <header style={{ height:64, background:C.bg, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0, gap:12, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {!sidebarOpen && (
            <button onClick={()=>setSidebarOpen(true)} style={{ background:C.card, border:`1px solid ${C.bMid}`, borderRadius:6, padding:'6px', cursor:'pointer', color:C.muted, display:'flex' }}>
              <ChevronRight size={14}/>
            </button>
          )}
          <div style={{ width:28, height:28, background:C.text, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Sparkles size={14} color={C.bg}/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1 }}>RankLens</div>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Dashboard</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Site selector */}
          {!isDemo && sites.length > 1 && (
            <select value={selSite} onChange={e=>onSiteChange(e.target.value)}
              style={{ background:C.card, border:`1px solid ${C.bMid}`, borderRadius:7, padding:'6px 10px', fontSize:12, color:C.text, cursor:'pointer', maxWidth:200 }}>
              {sites.map(s=><option key={s} value={s}>{s.replace(/^sc-domain:|https?:\/\//,'')}</option>)}
            </select>
          )}

          <Link to="/analyze"
            style={{ display:'inline-flex', alignItems:'center', gap:7, background:C.text, color:C.bg, textDecoration:'none', fontWeight:700, fontSize:12.5, padding:'8px 16px', borderRadius:8, letterSpacing:'-0.01em', flexShrink:0 }}>
            <Edit3 size={13}/> Open Analyzer
          </Link>

          {/* User menu */}
          <div ref={userMenuRef} style={{ position:'relative' }}>
            <button onClick={()=>setUserMenuOpen(o=>!o)}
              style={{ background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'5px 10px', cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
              <Avatar user={user} size={24}/>
              <span style={{ fontSize:12, color:C.sub, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name||'User'}</span>
              <ChevronDown size={12} color={C.muted}/>
            </button>
            {userMenuOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, minWidth:200, boxShadow:'0 8px 32px rgba(0,0,0,.6)', zIndex:100, overflow:'hidden' }}>
                <div style={{ padding:'12px 14px', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{user?.name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{user?.email}</div>
                  {isDemo && <div style={{ fontSize:10, color:C.amber, marginTop:4, fontWeight:600 }}>Demo Mode</div>}
                </div>
                {!isDemo && (
                  <button onClick={handleReconnect}
                    style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', color:C.sub, fontSize:13 }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bgAlt} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    <GoogleG size={13}/> Reconnect Google
                  </button>
                )}
                <div style={{ borderTop:`1px solid ${C.border}` }}>
                  <button onClick={handleLogout}
                    style={{ width:'100%', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', color:'#f87171', fontSize:13 }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.05)'} onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    <LogOut size={13}/>Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside style={{ width:sidebarOpen?220:0, minWidth:sidebarOpen?220:0, transition:'width 0.28s cubic-bezier(0.4,0,0.2,1),min-width 0.28s cubic-bezier(0.4,0,0.2,1)', background:C.bgAlt, borderRight:`1px solid ${C.border}`, overflow:'hidden', flexShrink:0, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:9, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.12em' }}>Navigation</span>
            <button onClick={()=>setSidebarOpen(false)} style={{ background:C.card, border:`1px solid ${C.bMid}`, borderRadius:5, padding:'4px', cursor:'pointer', color:C.muted, display:'flex' }}>
              <ChevronLeft size={12}/>
            </button>
          </div>
          <nav style={{ padding:'8px', flex:1 }}>
            {NAV.map(({ Icon, label, href, color }) => {
              const active = label==='Dashboard';
              return (
                <Link key={label} to={href}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:8, textDecoration:'none', marginBottom:2, background:active?C.card:'none', borderLeft:active?`2px solid ${C.text}`:'2px solid transparent', transition:'background 0.15s' }}>
                  <div style={{ width:28, height:28, borderRadius:7, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={13} color={color}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:active?600:400, color:active?C.text:C.muted, whiteSpace:'nowrap' }}>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div style={{ padding:'12px', borderTop:`1px solid ${C.border}` }}>
            <Link to="/analyze"
              style={{ display:'flex', alignItems:'center', gap:8, background:C.text, color:C.bg, textDecoration:'none', fontWeight:700, fontSize:12, padding:'10px 14px', borderRadius:8, justifyContent:'center' }}>
              <Edit3 size={13}/> Open Analyzer
            </Link>
          </div>
        </aside>

        {/* ── MAIN ─────────────────────────────────────────────────────── */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px', background:C.bg }}>

          {/* ── Connection status panel ─────────────────────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
            {/* Search Console */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <GoogleG size={16}/>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600 }}>Search Console</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    {isDemo ? 'Not connected' : scStatus==='connected' ? selSite?.replace(/^sc-domain:|https?:\/\//,'') : scStatus==='no_sites' ? 'No sites found' : scStatus==='error' ? 'Connection failed' : 'Connecting…'}
                  </div>
                </div>
              </div>
              <StatusBadge status={isDemo?'demo':scStatus} label={isDemo?'Demo':'connected'===scStatus?'Live':'loading'===scStatus?'Connecting':'error'===scStatus?'Error':'No Sites'}/>
            </div>

            {/* Google Analytics */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <GoogleG size={16}/>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600 }}>Google Analytics</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    {isDemo ? 'Not connected' : ga4Status==='connected' ? 'GA4 Property connected' : ga4Status==='no_sites' ? 'No properties found' : ga4Status==='loading' ? 'Connecting…' : 'Connection failed'}
                  </div>
                </div>
              </div>
              <StatusBadge status={isDemo?'demo':ga4Status} label={isDemo?'Demo':ga4Status==='connected'?'Live':ga4Status==='loading'?'Connecting':ga4Status==='no_sites'?'No Data':'Error'}/>
            </div>
          </div>

          {/* ── Error / guidance banners ──────────────────────────────── */}

          {/* Demo mode */}
          {isDemo && (
            <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
              <span style={{ fontSize:12.5, color:'#d97706' }}>
                <strong>Demo Mode</strong> — Showing sample data below.
                {isGoogleConfigured() ? ' Sign in with Google to see your real analytics.' : ' Add VITE_GOOGLE_CLIENT_ID to .env to enable live data.'}
              </span>
              {isGoogleConfigured() && (
                <button onClick={handleReconnect}
                  style={{ background:'#fff', color:'#000', border:'none', borderRadius:7, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <GoogleG size={13}/> Connect Google
                </button>
              )}
            </div>
          )}

          {/* SC error — show but keep data visible */}
          {!isDemo && scStatus==='error' && (
            <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <AlertCircle size={15} color={C.red} style={{ flexShrink:0, marginTop:1 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'#f87171', marginBottom:4 }}>Search Console could not load</div>
                <div style={{ fontSize:12, color:'#f87171', opacity:0.8 }}>{scError}</div>
                {scError?.includes('API has not been used') && (
                  <div style={{ fontSize:11, color:'#f87171', marginTop:8, padding:8, background:'rgba(0,0,0,0.2)', borderRadius:6 }}>
                    <strong>Action Required:</strong> The Search Console API is not enabled. 
                    <a href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" target="_blank" rel="noreferrer" style={{ color:'#fff', marginLeft:5 }}>Enable it here</a>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => initGSC()}
                  style={{ background:C.card, color:C.text, border:`1px solid ${C.bMid}`, borderRadius:7, padding:'6px 12px', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <RefreshCw size={11}/> Retry
                </button>
                <button onClick={handleReconnect}
                  style={{ background:'#fff', color:'#000', border:'none', borderRadius:7, padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <GoogleG size={11}/> Re-connect
                </button>
              </div>
            </div>
          )}

          {/* GA4 error */}
          {!isDemo && ga4Status==='error' && (
            <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
              <AlertCircle size={15} color={C.red} style={{ flexShrink:0, marginTop:1 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:600, color:'#f87171', marginBottom:4 }}>Google Analytics could not load</div>
                <div style={{ fontSize:12, color:'#f87171', opacity:0.8 }}>{ga4Error || 'Permission denied or property not found. Ensure you granted Analytics access.'}</div>
                {ga4Error?.includes('API has not been used') && (
                  <div style={{ fontSize:11, color:'#f87171', marginTop:8, padding:8, background:'rgba(0,0,0,0.2)', borderRadius:6 }}>
                    <strong>Action Required:</strong> Enable the following APIs in your Google Cloud Console:
                    <div style={{ marginTop:5, display:'flex', gap:10 }}>
                      <a href="https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com" target="_blank" rel="noreferrer" style={{ color:'#fff', textDecoration:'underline' }}>1. Analytics Admin API</a>
                      <a href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com" target="_blank" rel="noreferrer" style={{ color:'#fff', textDecoration:'underline' }}>2. Analytics Data API</a>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => loadGA4Data()}
                  style={{ background:C.card, color:C.text, border:`1px solid ${C.bMid}`, borderRadius:7, padding:'6px 12px', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <RefreshCw size={11}/> Retry
                </button>
                <button onClick={handleReconnect}
                  style={{ background:'#fff', color:'#000', border:'none', borderRadius:7, padding:'6px 12px', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <GoogleG size={11}/> Re-connect
                </button>
              </div>
            </div>
          )}

          {/* SC no sites */}
          {!isDemo && scStatus==='no_sites' && (
            <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:10, padding:'16px 20px', marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#818cf8', marginBottom:6 }}>No Search Console sites found</div>
              <p style={{ fontSize:12, color:C.sub, margin:'0 0 12px', lineHeight:1.7 }}>
                Your Google account has no verified sites in Search Console. To see real data:<br/>
                1. Go to <strong style={{ color:'#93c5fd' }}>search.google.com/search-console</strong><br/>
                2. Add your website and verify ownership<br/>
                3. Come back and click Retry below
              </p>
              <button onClick={() => initGSC()}
                style={{ background:C.text, color:C.bg, border:'none', borderRadius:7, padding:'7px 16px', fontSize:12, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}>
                <RefreshCw size={12}/> Retry
              </button>
            </div>
          )}

          {/* Showing demo data as fallback when real data failed */}
          {!isDemo && (scStatus==='error' || scStatus==='no_sites') && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}`, borderRadius:8, padding:'8px 14px', marginBottom:20, fontSize:11, color:C.muted, display:'flex', alignItems:'center', gap:6 }}>
              <Info size={11}/> Showing demo data below while real data is unavailable
            </div>
          )}

          {/* SC loading */}
          {!isDemo && scStatus==='loading' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0', marginBottom:12, color:C.muted, fontSize:12 }}>
              <RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }}/> Loading your Search Console data…
            </div>
          )}

          {/* ── SC Metrics ──────────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <SectionTitle>
                Search Console — Last 30 Days
                {isRealSC ? ` · ${selSite.replace(/^sc-domain:|https?:\/\//,'')}` : isDemo ? ' (Demo)' : ' (Sample)'}
              </SectionTitle>
              {!isDemo && isRealSC && (
                <button onClick={() => loadSCData()} title="Refresh" style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, padding:4, display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
                  <RefreshCw size={12} style={{ animation:loadingSC?'spin 1s linear infinite':'none' }}/> Refresh
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <MetricCard icon={<TrendingUp size={14} color={C.green}/>}  label="Total Clicks"  value={displaySCData.totals.clicks.toLocaleString()}      delta="+12% vs prev period" up color={C.green}/>
              <MetricCard icon={<Activity  size={14} color={C.purple}/>}  label="Impressions"   value={displaySCData.totals.impressions.toLocaleString()} delta="+8% vs prev period"  up color={C.purple}/>
              <MetricCard icon={<BarChart2 size={14} color={C.blue}/>}    label="Avg CTR"       value={`${displaySCData.totals.ctr.toFixed(1)}%`}         delta="+0.4pp" up color={C.blue}/>
              <MetricCard icon={<Search   size={14} color={C.amber}/>}   label="Avg Position"  value={displaySCData.totals.position.toFixed(1)}          delta="↑ 0.3"  up color={C.amber}/>
            </div>
          </div>

          {/* ── Chart ─────────────────────────────────────────────────── */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'18px 20px', marginBottom:28 }}>
            <SectionTitle>Daily Clicks &amp; Impressions</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={displaySCData.daily} margin={{ top:4, right:8, bottom:0, left:-16 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="date" tick={{ fill:C.muted, fontSize:9, fontFamily:"'Inter',system-ui,sans-serif" }} tickLine={false} axisLine={false} tickFormatter={d=>d.slice(5)} interval={4}/>
                <YAxis tick={{ fill:C.muted, fontSize:9, fontFamily:"'Inter',system-ui,sans-serif" }} tickLine={false} axisLine={false}/>
                <Tooltip content={<DarkTip/>}/>
                <Line type="monotone" dataKey="clicks"      stroke={C.green} strokeWidth={2} dot={false} name="Clicks"/>
                <Line type="monotone" dataKey="impressions" stroke={C.blue}  strokeWidth={2} dot={false} name="Impressions"/>
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:16, marginTop:10 }}>
              {[[C.green,'Clicks'],[C.blue,'Impressions']].map(([c,l])=>(
                <span key={l} style={{ fontSize:10, color:C.muted, display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:12, height:2, background:c, display:'inline-block', borderRadius:1 }}/> {l}
                </span>
              ))}
            </div>
          </div>

          {/* ── Top Pages ─────────────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <SectionTitle>Top Pages by Clicks</SectionTitle>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 0.8fr 80px', padding:'8px 16px', background:C.bgAlt, borderBottom:`1px solid ${C.border}` }}>
                {['Page','Clicks','Impressions','Position',''].map(h=><span key={h} style={thStyle}>{h}</span>)}
              </div>
              {displaySCData.topPages.map((p,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 0.8fr 80px', alignItems:'center', borderBottom:i<displaySCData.topPages.length-1?`1px solid ${C.border}`:'none' }}>
                  <span style={{ ...tdBase, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={p.page}>{p.page}</span>
                  <span style={{ ...tdBase, color:C.text, fontWeight:600 }}>{p.clicks.toLocaleString()}</span>
                  <span style={tdBase}>{p.impressions.toLocaleString()}</span>
                  <span style={{ ...tdBase, color:posColor(p.position), fontWeight:700 }}>{p.position.toFixed(1)}</span>
                  <span style={tdBase}>
                    <Link to="/analyze" style={{ fontSize:11, color:C.muted, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3 }}
                      onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
                      Analyze <ExternalLink size={9}/>
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top Keywords ──────────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <SectionTitle>Top Keywords</SectionTitle>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 0.8fr 80px', padding:'8px 16px', background:C.bgAlt, borderBottom:`1px solid ${C.border}` }}>
                {['Keyword','Clicks','Impressions','Position',''].map(h=><span key={h} style={thStyle}>{h}</span>)}
              </div>
              {displaySCData.topKeywords.map((k,i)=>(
                <div key={i} style={{ display:'grid', gridTemplateColumns:'3fr 1fr 1fr 0.8fr 80px', alignItems:'center', borderBottom:i<displaySCData.topKeywords.length-1?`1px solid ${C.border}`:'none' }}>
                  <span style={{ ...tdBase, color:C.text }}>{k.query}</span>
                  <span style={{ ...tdBase, color:C.text, fontWeight:600 }}>{k.clicks.toLocaleString()}</span>
                  <span style={tdBase}>{k.impressions.toLocaleString()}</span>
                  <span style={{ ...tdBase, color:posColor(k.position), fontWeight:700 }}>{k.position.toFixed(1)}</span>
                  <span style={tdBase}>
                    <Link to="/analyze" style={{ fontSize:11, color:C.muted, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:3 }}
                      onMouseEnter={e=>e.currentTarget.style.color=C.text} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
                      Optimize <ExternalLink size={9}/>
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── GA4 ───────────────────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <SectionTitle>Google Analytics — Overview{!isRealGA4?' (Sample)':''}</SectionTitle>
              {!isDemo && properties.length > 1 && (
                <select value={selProp} onChange={e=>{ const val = e.target.value; setSelProp(val); localStorage.setItem('ga4_property',val); setGa4Data(null); loadGA4Data(val); }}
                  style={{ background:C.card, border:`1px solid ${C.bMid}`, borderRadius:6, padding:'5px 9px', fontSize:11, color:C.text, cursor:'pointer' }}>
                  {properties.map(p=><option key={p.name} value={p.name.replace('properties/','')}>{p.displayName||p.name}</option>)}
                </select>
              )}
            </div>
            {loadingGA4 ? (
              <div style={{ color:C.muted, fontSize:12, display:'flex', alignItems:'center', gap:8 }}>
                <RefreshCw size={12} style={{ animation:'spin 1s linear infinite' }}/> Loading Analytics…
              </div>
            ) : (
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <MetricCard icon={<Globe2     size={14} color={C.blue}  />} label="Sessions"    value={typeof displayGA4.sessions==='number'?displayGA4.sessions.toLocaleString():displayGA4.sessions} color={C.blue}/>
                <MetricCard icon={<Activity   size={14} color={C.purple}/>} label="Active Users" value={typeof displayGA4.activeUsers==='number'?displayGA4.activeUsers.toLocaleString():displayGA4.activeUsers} color={C.purple}/>
                <MetricCard icon={<TrendingUp size={14} color={C.green} />} label="Bounce Rate"  value={`${displayGA4.bounceRate}%`} delta="-2.1pp" up color={C.green}/>
                <MetricCard icon={<BarChart2  size={14} color={C.amber} />} label="Avg Session"  value={displayGA4.avgSessionDuration} color={C.amber}/>
              </div>
            )}
          </div>

          {/* ── AI Health Report ──────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <SectionTitle>AI SEO Health Report</SectionTitle>
            <AIHealthReport report={aiReport} loading={aiLoading} error={aiError}
              onRefresh={()=>{ setAiReport(null); setAiError(null); }}/>
          </div>

          {/* ── Indexing Status ───────────────────────────────────────── */}
          <div style={{ marginBottom:28 }}>
            <SectionTitle>Indexing Status</SectionTitle>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'20px 24px', display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
              <DonutChart indexed={displaySCData.indexedPages||MOCK_SC.indexedPages} total={displaySCData.totalSubmitted||MOCK_SC.totalSubmitted}/>
              <div>
                <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.02em', marginBottom:4 }}>
                  {displaySCData.indexedPages||MOCK_SC.indexedPages}
                  <span style={{ fontSize:13, color:C.muted, fontWeight:400, marginLeft:8 }}>/ {displaySCData.totalSubmitted||MOCK_SC.totalSubmitted} pages indexed</span>
                </div>
                <p style={{ fontSize:12, color:C.muted, margin:'0 0 16px' }}>
                  {MOCK_SC.totalSubmitted-MOCK_SC.indexedPages} pages submitted but not yet indexed.
                </p>
                <Link to="/analyze"
                  style={{ fontSize:12, color:C.text, textDecoration:'none', background:C.card, border:`1px solid ${C.bMid}`, borderRadius:7, padding:'8px 16px', display:'inline-flex', alignItems:'center', gap:6 }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#555'} onMouseLeave={e=>e.currentTarget.style.borderColor=C.bMid}>
                  <Search size={12}/> Check Indexing Issues →
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
