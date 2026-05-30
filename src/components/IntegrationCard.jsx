export default function IntegrationCard({ icon, title, status, statusLabel, description, onConnect, onDisconnect, connectedLabel }) {
  const connected = status === 'connected';

  return (
    <div style={{ background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 12, padding: '20px 22px', flex: '1 1 260px', minWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{title}</span>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em',
          ...(connected
            ? { background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }
            : { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
          )
        }}>{statusLabel}</span>
      </div>

      <p style={{ fontSize: 11, color: '#555', lineHeight: 1.55, marginBottom: 14 }}>
        {connected && connectedLabel ? connectedLabel : description}
      </p>

      {connected ? (
        <button
          onClick={onDisconnect}
          style={{ fontSize: 11, color: '#555', background: 'none', border: '1px solid #2a2a2a', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', transition: 'border-color 0.15s' }}
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={onConnect}
          style={{ fontSize: 12, fontWeight: 600, color: '#000', background: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', transition: 'opacity 0.15s' }}
        >
          Connect
        </button>
      )}
    </div>
  );
}
