import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchGoogleProfile } from '../lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('Completing sign-in…');

  useEffect(() => {
    const hash   = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token  = params.get('access_token');
    const state  = params.get('state');
    const saved  = sessionStorage.getItem('oauth_state');

    if (!token || state !== saved) {
      navigate('/login?auth_error=1');
      return;
    }
    sessionStorage.removeItem('oauth_state');

    let provider = 'login';
    let redirect = '/dashboard';
    try {
      const decoded = JSON.parse(atob(state));
      provider = decoded.provider || 'login';
      redirect = decoded.redirect  || '/dashboard';
    } catch { /* ignore */ }

    setStatus('Fetching your Google profile…');

    fetchGoogleProfile(token)
      .then(profile => {
        setStatus('Setting up your workspace…');
        login(
          {
            name:   profile.name,
            email:  profile.email,
            avatar: profile.picture,
            sub:    profile.sub,
            demo:   false,
          },
          token
        );
        // Also persist as GSC + GA4 tokens (same token, all scopes requested together)
        localStorage.setItem('gsc_token', token);
        localStorage.setItem('ga4_token', token);
        navigate(redirect, { replace: true });
      })
      .catch(() => navigate('/login?auth_error=1'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',system-ui,sans-serif", gap: 16 }}>
      <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={20} color="#000" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #222', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>{status}</p>
      </div>
    </div>
  );
}
