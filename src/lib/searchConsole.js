const SC_BASE = 'https://www.googleapis.com/webmasters/v3';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

export function isGSCConfigured() {
  return !!CLIENT_ID;
}

export function getGSCToken() {
  return localStorage.getItem('gsc_token');
}

export function getGSCSite() {
  return localStorage.getItem('gsc_site');
}

export function clearGSCAuth() {
  localStorage.removeItem('gsc_token');
  localStorage.removeItem('gsc_site');
}

export function initiateGSCAuth() {
  const state = btoa(JSON.stringify({ provider: 'gsc', nonce: Math.random().toString(36) }));
  sessionStorage.setItem('oauth_state', state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
    state,
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function listSites(token) {
  const r = await fetch(`${SC_BASE}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || `SC sites error ${r.status}`);
  }
  return r.json(); // { siteEntry: [...] }
}

export async function getSearchAnalytics(token, siteUrl, { startDate, endDate, dimensions, rowLimit = 10 }) {
  const r = await fetch(
    `${SC_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
    }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || `SC analytics error ${r.status}`);
  }
  return r.json(); // { rows: [...] }
}

export function getDateRange(daysBack = 30) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}
