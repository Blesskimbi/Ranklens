import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  const ref = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.55, delay: 0.2, ease: 'power2.out' });
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const isLanding = location.pathname === '/';

  return (
    <nav
      ref={ref}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.80)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${scrolled ? '#262626' : '#1a1a1a'}`,
        transition: 'border-color 0.2s, background 0.2s',
        fontFamily: "'Inter',system-ui,sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={13} color="#000" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>RankLens</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isLanding && (
            <>
              <Link to="/dashboard" style={navLink(location.pathname === '/dashboard')}>Dashboard</Link>
              <Link to="/analyze"   style={navLink(location.pathname === '/analyze')}>Analyzer</Link>
            </>
          )}
          <Link to="/dashboard" style={ghostBtn}>Sign In</Link>
          <Link to="/dashboard" style={solidBtn}>Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

const navLink = (active) => ({
  color: active ? '#fff' : '#666',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
  padding: '6px 10px',
  borderRadius: 6,
  transition: 'color 0.15s',
});

const ghostBtn = {
  color: '#888',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
  padding: '7px 16px',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  transition: 'border-color 0.15s',
};

const solidBtn = {
  background: '#fff',
  color: '#000',
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 700,
  padding: '7px 16px',
  borderRadius: 8,
};
