import React, { useState } from 'react';

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0D1B2A 0%, #132338 60%, #1B3A6B22 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" },
  card: { background: '#132338', borderRadius: 20, padding: '48px 40px', width: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', border: '1px solid #1E3A5F' },
  logo: { textAlign: 'center', marginBottom: 32 },
  shield: { fontSize: 56, display: 'block', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, color: '#FFFFFF', margin: 0 },
  subtitle: { fontSize: 13, color: '#8FA8D0', marginTop: 6 },
  label: { display: 'block', fontSize: 12, color: '#8FA8D0', marginBottom: 6, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #1E3A5F', background: '#0D1B2A', color: '#FFFFFF', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif', transition: 'border .2s' },
  fieldWrap: { marginBottom: 20 },
  btn: { width: '100%', padding: '14px', borderRadius: 10, background: 'linear-gradient(135deg, #C0392B, #E74C3C)', border: 'none', color: '#FFFFFF', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, letterSpacing: 0.5 },
  roomRow: { display: 'flex', gap: 8, marginTop: 4 },
  roomBtn: (active) => ({ flex: 1, padding: '9px 4px', borderRadius: 8, border: active ? '2px solid #C0392B' : '1.5px solid #1E3A5F', background: active ? '#1B1B2F' : 'transparent', color: active ? '#E74C3C' : '#8FA8D0', fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all .15s' }),
  badge: { display: 'inline-block', background: '#0D2A1A', color: '#27AE60', border: '1px solid #27AE60', borderRadius: 20, fontSize: 11, padding: '3px 10px', marginTop: 8 },
};

const ROOMS = ['General Chat', 'Study Group', 'Tech Talk', 'Random'];

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('General Chat');
  const [err, setErr] = useState('');

const handle = () => {

  if (!name.trim()) {

    setErr('Please enter your name');

    return;
  }

  // SAVE USERNAME FOR THIS TAB ONLY
  sessionStorage.setItem(
    "username",
    name.trim()
  );

  onLogin({
    username: name.trim(),
    room
  });
};

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={S.shield}>🛡️</span>
          <div style={S.title}>Sentinel AI</div>
          <div style={S.subtitle}>Real-Time Intelligent Conversation Safety Platform</div>
          <div style={S.badge}>🟢 AI Protection Active</div>
        </div>

        <div style={S.fieldWrap}>
          <label style={S.label}>Your Name</label>
          <input style={S.input} value={name} onChange={e => { setName(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handle()} placeholder="Enter your display name" autoFocus />
          {err && <div style={{ color: '#E74C3C', fontSize: 12, marginTop: 6 }}>{err}</div>}
        </div>

        <div style={S.fieldWrap}>
          <label style={S.label}>Select Room</label>
          <div style={S.roomRow}>
            {ROOMS.map(r => (
              <button key={r} style={S.roomBtn(room === r)} onClick={() => setRoom(r)}>{r}</button>
            ))}
          </div>
        </div>

        <button style={S.btn} onClick={handle}>Enter Protected Chat →</button>

        <div style={{ marginTop: 24, background: '#0D1B2A', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: '#8FA8D0', marginBottom: 6, fontWeight: 600 }}>🤖 BERT MODEL ACTIVE</div>
          {['Phishing', 'Cyberbullying', 'Scam', 'Harassment', 'Stalking', 'Grooming', 'Fraud', 'Spam', 'Impersonation'].map(t => (
            <span key={t} style={{ display: 'inline-block', fontSize: 10, color: '#5D7FA8', background: '#132338', borderRadius: 4, padding: '2px 7px', margin: '2px 2px' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
