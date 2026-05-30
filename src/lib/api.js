export async function getAIHealthReport({ topPages, topKeywords, totalClicks, previousClicks }) {
  const r = await fetch('/api/ai-health-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topPages, topKeywords, totalClicks, previousClicks }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.error || `API error ${r.status}`);
  }
  return r.json();
}
