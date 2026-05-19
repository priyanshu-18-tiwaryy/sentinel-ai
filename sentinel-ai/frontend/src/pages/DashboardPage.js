import React, { useState, useEffect } from 'react';

const BACKEND = 'http://localhost:8000';

export default function DashboardPage({ user, onBack }) {
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [s, f] = await Promise.all([
        fetch(`${BACKEND}/stats`).then(r => r.json()),
        fetch(`${BACKEND}/flagged`).then(r => r.json()),
      ]);
      setStats(s);
      setFlagged(f.flagged_messages || []);
    } catch {
      setStats({ total_messages: 0, threats_detected: 0, threat_breakdown: {}, online_users: 0 });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, []);

  const THREAT_COLORS = { Phishing: '#E74C3C', Cyberbullying: '#8E44AD', Scam: '#E67E22', Harassment: '#C0392B', 'Online Job Fraud': '#D35400', 'Cyber Stalking': '#7D3C98', 'Cyber Grooming': '#6C3483', Spamming: '#2E86C1', Impersonation: '#1ABC9C' };

  const S = {
    page: { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Inter',sans-serif", color: '#FFFFFF' },
    topbar: { background: '#132338', borderBottom: '1px solid #1E3A5F', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 },
    backBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #1E3A5F', background: 'transparent', color: '#8FA8D0', cursor: 'pointer', fontSize: 13 },
    title: { fontWeight: 700, fontSize: 18, color: '#FFFFFF' },
    body: { padding: '24px' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 },
    statCard: (color) => ({ background: '#132338', border: `1px solid ${color}44`, borderRadius: 14, padding: '20px', borderLeft: `4px solid ${color}` }),
    statN: (color) => ({ fontSize: 36, fontWeight: 700, color }),
    statL: { fontSize: 13, color: '#8FA8D0', marginTop: 4 },
    section: { background: '#132338', borderRadius: 14, border: '1px solid #1E3A5F', padding: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: 600, color: '#8FA8D0', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
    barWrap: { marginBottom: 12 },
    barLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: '#B0C4DE' },
    barTrack: { height: 8, background: '#0D1B2A', borderRadius: 4, overflow: 'hidden' },
    flagRow: { padding: '10px 0', borderBottom: '1px solid #1E3A5F', fontSize: 13 },
    flagLabel: (color) => ({ display: 'inline-block', fontSize: 11, background: color + '22', color, borderRadius: 4, padding: '2px 8px', marginLeft: 8, border: `1px solid ${color}44`, fontWeight: 600 }),
  };

  const total = stats?.threats_detected || 0;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={onBack}>← Back to Chat</button>
        <span style={{ fontSize: 20 }}>🛡️</span>
        <span style={S.title}>Sentinel AI — Threat Intelligence Dashboard</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#27AE60', background: '#0D2A1A', padding: '4px 12px', borderRadius: 12, border: '1px solid #27AE6044' }}>🟢 Live · Auto-refreshing every 5s</span>
      </div>

      <div style={S.body}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5D8AA8' }}>Loading intelligence data...</div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={S.statsRow}>
              {[
                { n: stats?.total_messages ?? 0, l: 'Messages Analyzed', color: '#2E86C1' },
                { n: stats?.threats_detected ?? 0, l: 'Threats Detected', color: '#E74C3C' },
                { n: stats?.online_users ?? 0, l: 'Users Online', color: '#27AE60' },
                { n: (stats?.active_rooms || []).length, l: 'Active Rooms', color: '#8E44AD' },
                { n: stats?.total_messages > 0 ? Math.round((stats.threats_detected / stats.total_messages) * 100) + '%' : '0%', l: 'Threat Rate', color: '#E67E22' },
                { n: 'BERT', l: 'Model · 99.96% Acc', color: '#1ABC9C' },
              ].map((s, i) => (
                <div key={i} style={S.statCard(s.color)}>
                  <div style={S.statN(s.color)}>{s.n}</div>
                  <div style={S.statL}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Threat breakdown */}
              <div style={S.section}>
                <div style={S.sectionTitle}>Threat Category Breakdown</div>
                {Object.keys(THREAT_COLORS).map(label => {
                  const count = stats?.threat_breakdown?.[label] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const color = THREAT_COLORS[label];
                  return (
                    <div key={label} style={S.barWrap}>
                      <div style={S.barLabel}><span>{label}</span><span style={{ color }}>{count}</span></div>
                      <div style={S.barTrack}>
                        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 4, transition: 'width .5s' }} />
                      </div>
                    </div>
                  );
                })}
                {total === 0 && <div style={{ color: '#4A6A8A', fontSize: 13 }}>No threats detected yet.</div>}
              </div>

              {/* Flagged messages log */}
              <div style={S.section}>
                <div style={S.sectionTitle}>Flagged Messages Log (Last {Math.min(flagged.length, 20)})</div>
                {flagged.length === 0 && <div style={{ color: '#4A6A8A', fontSize: 13 }}>No flagged messages yet.</div>}
                {flagged.slice(-20).reverse().map((m, i) => (
                  <div key={i} style={S.flagRow}>
                    <span style={{ color: '#8FA8D0' }}>{m.username}</span>
                    <span style={S.flagLabel(THREAT_COLORS[m.label] || '#E74C3C')}>{m.label}</span>
                    <span style={{ color: '#4A6A8A', fontSize: 11, marginLeft: 8 }}>{Math.round(m.confidence * 100)}%</span>
                    <div style={{ color: '#5D7FA8', marginTop: 3, fontStyle: 'italic', fontSize: 12 }}>"{m.text?.slice(0, 60)}{m.text?.length > 60 ? '…' : ''}"</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model info */}
            <div style={S.section}>
              <div style={S.sectionTitle}>Model Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                {[['Model', 'bert-base-uncased'], ['Architecture', 'Transformer Encoder'], ['Layers', '12'], ['Hidden Dim', '768'], ['Attention Heads', '12'], ['Parameters', '110M'], ['Val Accuracy', '99.96%'], ['Macro F1', '1.00'], ['Classes', '10'], ['Framework', 'PyTorch + HuggingFace'], ['Optimizer', 'AdamW'], ['Loss', 'Cross-Entropy']].map(([k, v]) => (
                  <div key={k} style={{ background: '#0D1B2A', borderRadius: 8, padding: '10px 14px', border: '1px solid #1E3A5F' }}>
                    <div style={{ fontSize: 11, color: '#5D8AA8', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#B0C4DE' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
