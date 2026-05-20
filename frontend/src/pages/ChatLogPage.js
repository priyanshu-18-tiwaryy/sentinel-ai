import React, { useState, useEffect } from 'react';

const BACKEND = 'http://localhost:8000';
const currentUser =
  sessionStorage.getItem("username");

const THREAT_COLORS = {
  Phishing: '#E74C3C', Cyberbullying: '#8E44AD', Scam: '#E67E22',
  Harassment: '#C0392B', 'Online Job Fraud': '#D35400',
  'Cyber Stalking': '#7D3C98', 'Cyber Grooming': '#6C3483',
  Spamming: '#2E86C1', Impersonation: '#1ABC9C', Benign: '#27AE60'
};

export default function ChatLogPage({ user, onBack }) {
  const [chatLog, setChatLog] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  useEffect(() => {

  const savedChat =
    localStorage.getItem(
      'chat_analysis'
    );

  if (savedChat) {
    setChatLog(savedChat);
  }

}, []);

  const analyze = async () => {
    if (!chatLog.trim()) return;
    setLoading(true);
    setResults([]);
    setSummary(null);

    // Split chat log into individual lines/messages
    const lines = chatLog.split('\n').filter(l => l.trim().length > 3);
    const analyzed = [];

    for (const line of lines) {
      try {
        const res = await fetch(`${BACKEND}/classify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: line.trim() })
        });
        const data = await res.json();
        analyzed.push({ text: line.trim(), ...data });
      } catch {
        analyzed.push({ text: line.trim(), label: 'Error', confidence: 0, is_threat: false, color: '#888', icon: '❓' });
      }
    }

    setResults(analyzed);

    // Build summary
    const threats = analyzed.filter(r => r.is_threat);
    const breakdown = {};
    threats.forEach(t => { breakdown[t.label] = (breakdown[t.label] || 0) + 1; });
    setSummary({
      total: analyzed.length,
      threats: threats.length,
      safe: analyzed.length - threats.length,
      breakdown,
      verdict: threats.length === 0 ? 'SAFE' : threats.length <= 2 ? 'SUSPICIOUS' : 'DANGEROUS'
    });

    setLoading(false);
  };

  const S = {
    page: { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Inter',sans-serif", color: '#FFFFFF' },
    topbar: { background: '#132338', borderBottom: '1px solid #1E3A5F', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 },
    backBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #1E3A5F', background: 'transparent', color: '#8FA8D0', cursor: 'pointer', fontSize: 13 },
    body: { padding: '24px', maxWidth: 900, margin: '0 auto' },
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    sub: { fontSize: 13, color: '#5D8AA8', marginBottom: 24 },
    textarea: { width: '100%', minHeight: 180, background: '#132338', border: '1px solid #1E3A5F', borderRadius: 12, padding: 16, color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter,sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
    analyzeBtn: { marginTop: 12, padding: '12px 32px', borderRadius: 10, background: loading ? '#333' : 'linear-gradient(135deg,#C0392B,#E74C3C)', border: 'none', color: '#FFFFFF', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', width: '100%' },
    summaryCard: (verdict) => ({
      background: verdict === 'SAFE' ? '#0D2A1A' : verdict === 'SUSPICIOUS' ? '#2A1A0D' : '#2A0D0D',
      border: `2px solid ${verdict === 'SAFE' ? '#27AE60' : verdict === 'SUSPICIOUS' ? '#E67E22' : '#C0392B'}`,
      borderRadius: 14, padding: '20px 24px', marginTop: 24, marginBottom: 20
    }),
    verdictText: (verdict) => ({ fontSize: 22, fontWeight: 700, color: verdict === 'SAFE' ? '#27AE60' : verdict === 'SUSPICIOUS' ? '#E67E22' : '#C0392B' }),
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16 },
    statBox: (color) => ({ background: '#132338', border: `1px solid ${color}44`, borderRadius: 10, padding: '14px', textAlign: 'center', borderLeft: `4px solid ${color}` }),
    statNum: (color) => ({ fontSize: 28, fontWeight: 700, color }),
    statLbl: { fontSize: 12, color: '#8FA8D0', marginTop: 4 },
    resultItem: (color, isThreat) => ({
      background: isThreat ? color + '11' : '#132338',
      border: `1px solid ${isThreat ? color + '55' : '#1E3A5F'}`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 8,
      borderLeft: `4px solid ${isThreat ? color : '#1E3A5F'}`
    }),
    msgText: { fontSize: 13, color: '#FFFFFF', marginBottom: 6, lineHeight: 1.5 },
    badge: (color) => ({ display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: color + '22', color, border: `1px solid ${color}44` }),
    conf: { fontSize: 11, color: '#5D8AA8', marginLeft: 8 },
    sectionTitle: { fontSize: 12, fontWeight: 600, color: '#5D8AA8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 20 },
    breakdownItem: (color) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: color + '11', borderRadius: 8, marginBottom: 6, border: `1px solid ${color}33` }),
    example: { background: '#132338', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #1E3A5F', fontSize: 13, color: '#8FA8D0', lineHeight: 1.8 }
  };

  const exampleLog = `User1: Hey can I talk to you privately?
User2: Sure what's up
User1: I have screenshots of you. Pay me $500 or I'll send them to everyone you know
User2: What? That's not true
User1: Don't ignore me. I know where you live
User2: Please stop this
User1: You're worthless. Nobody likes you anyway
User1: Click here to verify your payment account immediately http://pay-now.xyz`;

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={onBack}>← Back to Chat</button>
        <span style={{ fontSize: 20 }}>🛡️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Chat Log Analysis</div>
          <div style={{ fontSize: 11, color: '#4A6A8A' }}>Paste any chat conversation → BERT classifies each message</div>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.example}>
          <div style={{ fontWeight: 600, color: '#5D8AA8', marginBottom: 8 }}>📋 Example format — paste your chat like this:</div>
          {exampleLog.split('\n').map((l, i) => <div key={i}>{l}</div>)}
          <button style={{ marginTop: 10, padding: '6px 14px', borderRadius: 8, border: '1px solid #2E86C1', background: '#2E86C122', color: '#2E86C1', cursor: 'pointer', fontSize: 12 }}
            onClick={() => setChatLog(exampleLog)}>
            Load Example Chat
          </button>
        </div>

        <textarea
          style={S.textarea}
          value={chatLog}
          onChange={e => setChatLog(e.target.value)}
          placeholder="Paste your full chat conversation here...&#10;&#10;Format:&#10;User1: message here&#10;User2: reply here&#10;User1: another message"
        />

        <button style={S.analyzeBtn} onClick={analyze} disabled={loading}>
          {loading ? '🤖 Analyzing with BERT...' : '🔍 Analyze Chat Log with BERT'}
        </button>

        {summary && (
          <>
            <div style={S.summaryCard(summary.verdict)}>
              <div style={S.verdictText(summary.verdict)}>
                {summary.verdict === 'SAFE' ? '✅ SAFE CONVERSATION' :
                  summary.verdict === 'SUSPICIOUS' ? '⚠️ SUSPICIOUS ACTIVITY DETECTED' :
                    '🚨 DANGEROUS — MULTIPLE THREATS FOUND'}
              </div>
              <div style={{ fontSize: 13, color: '#8FA8D0', marginTop: 6 }}>
                BERT model analyzed {summary.total} messages and found {summary.threats} threat{summary.threats !== 1 ? 's' : ''}
              </div>
              <div style={S.statsRow}>
                <div style={S.statBox('#E74C3C')}>
                  <div style={S.statNum('#E74C3C')}>{summary.threats}</div>
                  <div style={S.statLbl}>Threats Detected</div>
                </div>
                <div style={S.statBox('#27AE60')}>
                  <div style={S.statNum('#27AE60')}>{summary.safe}</div>
                  <div style={S.statLbl}>Safe Messages</div>
                </div>
                <div style={S.statBox('#2E86C1')}>
                  <div style={S.statNum('#2E86C1')}>{summary.total}</div>
                  <div style={S.statLbl}>Total Analyzed</div>
                </div>
              </div>

              {Object.keys(summary.breakdown).length > 0 && (
                <>
                  <div style={{ ...S.sectionTitle, marginTop: 20 }}>Threat Breakdown</div>
                  {Object.entries(summary.breakdown).map(([label, count]) => (
                    <div key={label} style={S.breakdownItem(THREAT_COLORS[label] || '#E74C3C')}>
                      <span style={{ color: THREAT_COLORS[label] || '#E74C3C', fontWeight: 600 }}>{label}</span>
                      <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{count} message{count > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={S.sectionTitle}>Message-by-Message Analysis</div>
            {results.map((r, i) => {

  const sender =
    r.text.includes(":")
      ? r.text.split(":")[0].trim()
      : "Unknown";

  return (

    <div
      key={i}
      style={S.resultItem(
        r.color || '#888',
        r.is_threat
      )}
    >

      <div style={S.msgText}>
        {r.text}
      </div>

      <span style={S.badge(r.color || '#888')}>
        {r.icon} {r.label}
      </span>

      <span style={S.conf}>
        {Math.round(
          (r.confidence || 0) * 100
        )}% confidence
      </span>

      {r.is_threat &&
       sender !== currentUser && (

        <div
          style={{
            marginTop: "15px",
            padding: "14px",
            background: "rgba(231,76,60,0.08)",
            border: "1px solid #E74C3C",
            borderRadius: "10px"
          }}
        >

          <div
            style={{
              color: "#ff7675",
              fontWeight: "bold",
              marginBottom: "10px",
              fontSize: "13px"
            }}
          >
            ⚠ Threatening User Detected
          </div>

          <button
            onClick={() => {

              alert(
                `${sender} blocked successfully`
              );

            }}

            style={{
              background: "#E74C3C",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            🚫 Block {sender}
          </button>

        </div>
      )}

    </div>
  );
})}
          </>
        )}
      </div>
    </div>
  );
}