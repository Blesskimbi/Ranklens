const KEYS = {
  user:  'rl_user',
  token: 'rl_token',
};

export function saveAuth(user, token) {
  localStorage.setItem(KEYS.user,  JSON.stringify(user));
  localStorage.setItem(KEYS.token, token);
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); } catch { return null; }
}

export function getStoredToken() {
  return localStorage.getItem(KEYS.token) || null;
}

export function clearAuth() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  ['gsc_token','gsc_site','ga4_token','ga4_property'].forEach(k => localStorage.removeItem(k));
}

export function isAuthenticated() {
  return !!getStoredUser();
}

const CLIENT_ID = () => import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function isGoogleConfigured() {
  return !!CLIENT_ID();
}

export function initiateGoogleLogin(redirectPath = '/dashboard') {
  const id = CLIENT_ID();
  if (!id) return false;
  const state = btoa(JSON.stringify({ provider: 'login', redirect: redirectPath, nonce: Math.random().toString(36) }));
  sessionStorage.setItem('oauth_state', state);
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: 'token',
    scope: [
      'openid', 'email', 'profile',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ].join(' '),
    state,
    prompt: 'consent select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return true;
}

export async function fetchGoogleProfile(token) {
  const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error('Failed to fetch Google profile');
  return r.json(); // { sub, name, email, picture }
}

export function createDemoUser() {
  return { name: 'Demo User', email: 'demo@ranklens.app', avatar: null, demo: true };
}
