import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, BarChart2, Search, Bot, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { initiateGoogleLogin, isGoogleConfigured, createDemoUser } from '../lib/auth';

const C = {
  bg: '#000', card: '#111', border: '#1a1a1a', bMid: '#262626',
  text: '#fff', sub: '#888', muted: '#444',
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const FEATURES = [
  { Icon: BarChart2, color: '#6366f1', text: 'Real-time Search Console data' },
  { Icon: TrendingUp, color: '#22c55e', text: 'Clicks, impressions & keyword rankings' },
  { Icon: Search,    color: '#3b82f6', text: 'Indexing diagnostics & fix plans' },
  { Icon: Bot,       color: '#a855f7', text: 'AI-powered SEO content generation' },
];

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [authError, setAuthError] = useState(
    new URLSearchParams(location.search).get('auth_error') === '1'
  );
  const googleReady = isGoogleConfigured();

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated]);

  const handleGoogle = () => {
    setAuthError(false);
    if (!initiateGoogleLogin(from)) setAuthError(true);
  };

  const handleDemo = () => {
    login(createDemoUser(), null);
    navigate(from, { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter',system-ui,sans-serif", color: C.text }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.5s 0.1s ease both; }
        .fade-up-3 { animation: fadeUp 0.5s 0.2s ease both; }
      `}</style>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <header style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="#000" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>RankLens</span>
        </Link>
        <Link to="/" style={{ fontSize: 13, color: C.sub, textDecoration: 'none' }}>← Back to home</Link>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ display: 'flex', gap: 80, alignItems: 'center', maxWidth: 900, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* ── Left: value prop ─────────────────────────────────────── */}
          <div className="fade-up" style={{ flex: '1 1 320px', maxWidth: 360 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 16 }}>
              AI-Powered SEO Platform
            </div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px' }}>
              Your SEO command centre
            </h1>
            <p style={{ fontSize: 14.5, color: C.sub, lineHeight: 1.75, margin: '0 0 32px' }}>
              Connect Google, see exactly what's ranking, fix what's broken, and generate content that reaches #1.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {FEATURES.map(({ Icon, color, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={color} />
                  </div>
                  <span style={{ fontSize: 13.5, color: '#ccc' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: auth card ─────────────────────────────────────── */}
          <div className="fade-up-2" style={{ flex: '1 1 320px', maxWidth: 380 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: '36px 32px' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 6px' }}>
                Sign in to RankLens
              </h2>
              <p style={{ fontSize: 13, color: C.sub, margin: '0 0 28px', lineHeight: 1.6 }}>
                New user? Signing in creates your free account automatically.
              </p>

              {authError && (
                <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: '#f87171' }}>
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  Authentication failed. Please try again.
                </div>
              )}

              {/* ── Google button ──────────────────────────────────── */}
              {googleReady ? (
                <button onClick={handleGoogle}
                  style={{ width: '100%', background: '#fff', color: '#111', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, letterSpacing: '-0.01em', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e8e8e8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <GoogleIcon />
                  Continue with Google
                </button>
              ) : (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 14, fontSize: 12, color: '#a5b4fc', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#818cf8' }}>Set up Google OAuth to enable sign-in</div>
                  Add <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>VITE_GOOGLE_CLIENT_ID</code> to your <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>.env</code> file. Get it at <span style={{ color: '#93c5fd' }}>console.cloud.google.com</span>.
                </div>
              )}

              {/* ── Divider ────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 14px' }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 11, color: C.muted }}>or</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>

              {/* ── Demo button ────────────────────────────────────── */}
              <button onClick={handleDemo}
                style={{ width: '100%', background: 'none', color: '#ccc', border: `1px solid ${C.bMid}`, borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.bMid; e.currentTarget.style.color = '#ccc'; }}>
                <ArrowRight size={15} />
                Try Demo — No Account Needed
              </button>

              <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
                By continuing you agree to our{' '}
                <Link to="/" style={{ color: C.sub, textDecoration: 'underline' }}>Terms</Link> &amp;{' '}
                <Link to="/" style={{ color: C.sub, textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
