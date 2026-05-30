// Demo data used when Google integrations are not connected
const today = new Date();
const days30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() - (29 - i));
  return d.toISOString().split('T')[0];
});

export const MOCK_SC = {
  totals: { clicks: 12400, impressions: 98000, ctr: 12.6, position: 4.2 },
  daily: days30.map((date, i) => ({
    date,
    clicks: Math.floor(350 + Math.sin(i / 3) * 80 + i * 4),
    impressions: Math.floor(2800 + Math.sin(i / 4) * 400 + i * 30),
  })),
  topPages: [
    { page: '/blog/seo-guide-2026', clicks: 2100, impressions: 18200, ctr: 11.5, position: 2.3 },
    { page: '/tools/analyzer', clicks: 1850, impressions: 15400, ctr: 12.0, position: 3.1 },
    { page: '/blog/keyword-research', clicks: 1420, impressions: 11800, ctr: 12.0, position: 4.5 },
    { page: '/blog/on-page-seo', clicks: 980, impressions: 9200, ctr: 10.7, position: 6.2 },
    { page: '/blog/link-building', clicks: 740, impressions: 8100, ctr: 9.1, position: 8.4 },
    { page: '/blog/technical-seo', clicks: 620, impressions: 7400, ctr: 8.4, position: 9.1 },
    { page: '/blog/content-strategy', clicks: 510, impressions: 6800, ctr: 7.5, position: 11.3 },
    { page: '/features', clicks: 430, impressions: 5200, ctr: 8.3, position: 5.7 },
    { page: '/blog/backlinks', clicks: 380, impressions: 4900, ctr: 7.8, position: 14.2 },
    { page: '/pricing', clicks: 310, impressions: 3100, ctr: 10.0, position: 4.8 },
  ],
  topKeywords: [
    { query: 'seo analyzer tool', clicks: 980, impressions: 8200, ctr: 11.9, position: 2.1 },
    { query: 'google search console help', clicks: 750, impressions: 12000, ctr: 6.3, position: 8.4 },
    { query: 'keyword research tool free', clicks: 640, impressions: 9800, ctr: 6.5, position: 7.2 },
    { query: 'on page seo checker', clicks: 580, impressions: 7100, ctr: 8.2, position: 4.6 },
    { query: 'seo blog writer ai', clicks: 490, impressions: 4200, ctr: 11.7, position: 3.2 },
    { query: 'rank #1 on google', clicks: 430, impressions: 18400, ctr: 2.3, position: 22.1 },
    { query: 'how to fix indexing issues', clicks: 390, impressions: 6400, ctr: 6.1, position: 9.8 },
    { query: 'technical seo audit', clicks: 310, impressions: 5800, ctr: 5.3, position: 16.4 },
    { query: 'content seo optimization', clicks: 270, impressions: 4900, ctr: 5.5, position: 12.7 },
    { query: 'ai seo tools 2026', clicks: 240, impressions: 3600, ctr: 6.7, position: 6.9 },
  ],
  indexedPages: 74,
  totalSubmitted: 98,
};

export const MOCK_GA4 = {
  sessions: 24891,
  activeUsers: 18432,
  bounceRate: 42.3,
  avgSessionDuration: '2m 34s',
};
