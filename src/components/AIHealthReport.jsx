import { useState } from 'react';

function ScoreRing({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1f1f1f" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</span>
      </div>
    </div>
  );
}

export default function AIHealthReport({ report, loading, error, onRefresh }) {
  if (loading) {
    return (
      <div style={{ background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #333', borderTopColor: '#a78bfa', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 11, color: '#555' }}>Claude is analyzing your data…</span>
        </div>
        {[80, 55, 70].map((w, i) => (
          <div key={i} style={{ height: 10, background: '#1a1a1a', borderRadius: 4, marginBottom: 8, width: `${w}%`, animation: 'pulse 1.5s ease infinite' }} />
        ))}
      </div>
    );
  }

  if (error) {
    const isQuotaError = error.includes('quota exceeded') || error.includes('credit balance');
    return (
      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>AI Service Error</span>
        </div>
        <p style={{ fontSize: 12, color: '#f87171', opacity: 0.9, marginBottom: 16, lineHeight: 1.5 }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onRefresh} style={{ fontSize: 11, color: '#fff', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
            Retry Analysis
          </button>
          {isQuotaError && (
            <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer" 
              style={{ fontSize: 11, color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              Upgrade Billing ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13 }}>✦</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>AI SEO Health Report</span>
          <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace', marginLeft: 4 }}>Powered by {report._provider || 'Claude'}</span>
        </div>
        <button onClick={onRefresh} title="Refresh" style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}>↻</button>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Score ring + summary */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: '1 1 320px' }}>
          <ScoreRing score={report.health_score} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6, margin: 0 }}>{report.summary}</p>
          </div>
        </div>

        {/* Wins / Issues / Quick wins */}
        <div style={{ display: 'flex', gap: 12, flex: '2 1 480px', flexWrap: 'wrap' }}>
          <ListGroup label="Wins" items={report.wins} color="#22c55e" dot="●" />
          <ListGroup label="Issues" items={report.issues} color="#ef4444" dot="●" />
          <ListGroup label="Quick Wins" items={report.quick_wins} color="#f59e0b" dot="→" />
        </div>
      </div>
    </div>
  );
}

function ListGroup({ label, items = [], color, dot }) {
  return (
    <div style={{ flex: '1 1 140px', minWidth: 120 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#bbb', lineHeight: 1.4 }}>
            <span style={{ color, flexShrink: 0, fontSize: 8, marginTop: 3 }}>{dot}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
