const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

export function isGA4Configured() {
  return !!CLIENT_ID;
}

export function getGA4Token() {
  return localStorage.getItem('ga4_token');
}

export function getGA4Property() {
  return localStorage.getItem('ga4_property');
}

export function clearGA4Auth() {
  localStorage.removeItem('ga4_token');
  localStorage.removeItem('ga4_property');
}

export function initiateGA4Auth() {
  const state = btoa(JSON.stringify({ provider: 'ga4', nonce: Math.random().toString(36) }));
  sessionStorage.setItem('oauth_state', state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'token',
    scope: 'openid email https://www.googleapis.com/auth/analytics.readonly',
    state,
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function listGA4Properties(token) {
  const r = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || `GA4 properties error ${r.status}`);
  }
  const data = await r.json();
  // Flatten accountSummaries into a simple list of properties
  const properties = (data.accountSummaries || []).flatMap(acc => 
    (acc.propertySummaries || []).map(prop => ({
      name: prop.property, // Format: "properties/123"
      displayName: prop.displayName
    }))
  );
  return { properties };
}

export async function runGA4Report(token, propertyId) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  const r = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }],
        metrics: [
          { name: 'sessions' },
          { name: 'activeUsers' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
    }
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error?.message || `GA4 report error ${r.status}`);
  }
  return r.json();
}
