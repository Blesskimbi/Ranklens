import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CARD = {
  position: 'absolute',
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 16,
  padding: '16px 18px',
  zIndex: 5,
  cursor: 'default',
  willChange: 'transform',
  boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
};

/* ── Google G ───────────────────────────────────────────────────────────── */
function GoogleG({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Sparkline ──────────────────────────────────────────────────────────── */
function Sparkline() {
  return (
    <svg width="100%" height="32" viewBox="0 0 160 32" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,28 22,22 44,24 66,16 88,14 110,8 132,5 160,2 160,32 0,32" fill="url(#spk)"/>
      <polyline points="0,28 22,22 44,24 66,16 88,14 110,8 132,5 160,2"
        stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="160" cy="2" r="2.5" fill="#22c55e"/>
    </svg>
  );
}

/* ── Mini bar chart ─────────────────────────────────────────────────────── */
function MiniBar() {
  const bars = [35, 52, 42, 68, 58, 78, 100];
  return (
    <svg width="100%" height="32" viewBox="0 0 84 32" fill="none">
      {bars.map((h, i) => (
        <rect key={i}
          x={i * 13} y={32 - h * 0.3} width="10" height={h * 0.3} rx="2.5"
          fill={i === bars.length - 1 ? '#6366f1' : 'rgba(255,255,255,0.18)'}/>
      ))}
    </svg>
  );
}

/* ── Tilt ───────────────────────────────────────────────────────────────── */
function addTilt(el) {
  const base = CARD.boxShadow;
  const onMove = (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const y = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    gsap.to(el, {
      rotateY: x * 16, rotateX: -y * 10,
      transformPerspective: 700, scale: 1.04,
      boxShadow: `${-x*20}px ${y*14}px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 30px rgba(255,255,255,0.04)`,
      duration: .18, ease: 'power2.out',
    });
  };
  const onLeave = () => gsap.to(el, {
    rotateY: 0, rotateX: 0, scale: 1,
    boxShadow: base,
    duration: .5, ease: 'power3.out',
  });
  el.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
}

export default function HeroCards() {
  const c1 = useRef(null);
  const c2 = useRef(null);
  const c3 = useRef(null);

  useEffect(() => {
    const cards = [c1.current, c2.current, c3.current];

    /* entrance */
    gsap.fromTo(cards,
      { opacity: 0, scale: 0.80, y: 20 },
      { opacity: 1, scale: 1,    y: 0, duration: 0.75, stagger: 0.18, ease: 'back.out(1.5)', delay: 0.8 }
    );

    /* float loops — offset phases */
    gsap.to(c1.current, { y: -10, duration: 4.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(c2.current, { y: -7,  duration: 5.1, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.4 });
    gsap.to(c3.current, { y: -13, duration: 3.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 0.7 });

    /* 3D tilt */
    const cleanups = cards.map(addTilt);
    return () => cleanups.forEach(fn => fn());
  }, []);

  /* ── label style shared ─────────────────────────────────────────────── */
  const label = { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 };
  const val   = { fontSize: 13, fontWeight: 600, color: '#ffffff' };
  const dim   = { fontSize: 10, color: 'rgba(255,255,255,0.45)' };
  const divider = { borderBottom: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' };

  return (
    <>
      {/* ── Card 1 — SERP result ──────────────────────────────────── */}
      <div ref={c1} style={{ ...CARD, top: '12%', right: '3%', width: 230 }}>
        {/* browser bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', marginBottom: 12 }}>
          <GoogleG size={12}/>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', flex: 1 }}>yoursite.com</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </div>

        {/* title */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 4, lineHeight: 1.35 }}>
          Best Web Design Agency 2026
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 12 }}>
          Award-winning designs that convert visitors into loyal customers.
        </div>

        {/* ranking badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 20, padding: '4px 10px' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#ffffff' }}>Ranking #1 on Google</span>
        </div>
      </div>

      {/* ── Card 2 — Search Console ───────────────────────────────── */}
      <div ref={c2} style={{ ...CARD, bottom: '18%', left: '2%', width: 200 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <GoogleG size={13}/>
          <span style={{ ...label, margin: 0 }}>Search Console</span>
        </div>

        {/* metrics */}
        {[
          { label: 'Clicks',       value: '12,401', delta: '+34%' },
          { label: 'Impressions',  value: '98,200', delta: '+28%' },
          { label: 'Avg Position', value: '1.2',    delta: '↑ 6.8' },
        ].map(({ label: l, value, delta }) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)' }}>{l}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#ffffff' }}>{value}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.12)', borderRadius: 4, padding: '1px 4px' }}>{delta}</span>
            </div>
          </div>
        ))}

        <div style={divider}/>
        <Sparkline/>
      </div>

      {/* ── Card 3 — Analytics ───────────────────────────────────── */}
      <div ref={c3} style={{ ...CARD, top: '44%', right: '1%', width: 185 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <GoogleG size={13}/>
          <span style={{ ...label, margin: 0 }}>Analytics</span>
        </div>

        <div style={{ fontSize: 30, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 3 }}>
          24,891
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>users this month</div>

        <MiniBar/>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <span key={d} style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{d}</span>
          ))}
        </div>
      </div>
    </>
  );
}
