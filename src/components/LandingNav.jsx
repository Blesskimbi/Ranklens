import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(255,255,255,0.92)' : '#fff',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${scrolled ? '#e5e7eb' : '#f3f4f6'}`,
      transition: 'all 0.2s',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: '#fff', fontWeight: 800 }}>R</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>RankLens</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/dashboard" style={navLink}>Dashboard</Link>
          <Link to="/analyze" style={navLink}>Analyzer</Link>
          <Link to="/analyze" style={ghostBtn}>Sign in</Link>
          <Link to="/analyze" style={purpleBtn}>Get Started Free →</Link>
        </div>
      </div>
    </nav>
  );
}

const navLink = { color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' };
const ghostBtn = { color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', transition: 'border-color 0.15s' };
const purpleBtn = { color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, padding: '8px 18px', background: '#6366f1', borderRadius: 8, transition: 'background 0.15s', whiteSpace: 'nowrap' };
