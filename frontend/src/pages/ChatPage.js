import React, { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_WS = 'ws://localhost:8000/ws';

const SEV_COLOR = {
  CRITICAL: '#C0392B',
  HIGH: '#E74C3C',
  MEDIUM: '#E67E22',
  LOW: '#F39C12',
  NONE: '#27AE60'
};

export default function ChatPage({ user, onLogout, onDashboard, onNavigate }) {

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [alert, setAlert] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState(new Set());
  const [threatCount, setThreatCount] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [blockedPopup, setBlockedPopup] = useState(null);

  const ws = useRef(null);
  const endRef = useRef(null);

  const roomSlug = user.room.replace(/\s+/g, '-').toLowerCase();

  const connect = useCallback(() => {
    const socket = new WebSocket(
      `${BACKEND_WS}/${roomSlug}/${encodeURIComponent(user.username)}`
    );
    ws.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000);
    };
    socket.onerror = () => setConnected(false);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'threat_alert') {
        if (data.username !== user.username) {
          setAlert(data);
          setShowAlert(true);
          setThreatCount(c => c + 1);
          setTimeout(() => setShowAlert(false), 8000);
        }
      } else {
        setMessages(prev => [...prev.slice(-200), data]);
        if (data.type === 'message' && data.is_threat) {
          setThreatCount(c => c + 1);
        }
      }
    };
  }, [roomSlug, user.username]);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !connected) return;
    ws.current?.send(JSON.stringify({ text: input.trim() }));
    setInput('');
  };

  const blockUser = (username) => {
    setBlockedUsers(prev => new Set([...prev, username]));
    setShowAlert(false);
    setBlockedPopup(username);
    setTimeout(() => setBlockedPopup(null), 5000);
  };

  const visibleMessages = messages.filter(m => !blockedUsers.has(m.username));

  const avatarColor = (name) => {
    const colors = ['#C0392B', '#8E44AD', '#2E86C1', '#27AE60', '#E67E22', '#1ABC9C'];
    let h = 0;
    for (const c of name) h += c.charCodeAt(0);
    return colors[h % colors.length];
  };

  const S = {
    page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#0D1B2A', fontFamily: "'Inter',sans-serif", color: '#FFFFFF' },
    topbar: { background: '#132338', borderBottom: '1px solid #1E3A5F', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    logo: { display: 'flex', alignItems: 'center', gap: 10 },
    logoIcon: { fontSize: 26 },
    logoText: { fontWeight: 700, fontSize: 18, color: '#FFFFFF' },
    roomBadge: { fontSize: 12, color: '#5D8AA8', background: '#0D1B2A', padding: '3px 10px', borderRadius: 12, border: '1px solid #1E3A5F' },
    topRight: { display: 'flex', alignItems: 'center', gap: 10 },
    statPill: (color) => ({ fontSize: 12, padding: '4px 12px', borderRadius: 12, background: color + '22', color, border: `1px solid ${color}44`, fontWeight: 600 }),
    topBtn: { fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #1E3A5F', background: 'transparent', color: '#8FA8D0', cursor: 'pointer' },
    chatArea: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
    systemMsg: { textAlign: 'center', fontSize: 12, color: '#4A6A8A', padding: '6px 0' },
    msgWrap: (isMine) => ({ display: 'flex', flexDirection: isMine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 }),
    avatar: (color) => ({ width: 30, height: 30, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }),
    bubble: (isMine, isThreat, threatColor) => ({
      maxWidth: '65%', padding: '10px 14px',
      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: isThreat ? threatColor + '22' : isMine ? '#1B3A6B' : '#1A2740',
      border: isThreat ? `1.5px solid ${threatColor}` : isMine ? '1px solid #2E5090' : '1px solid #1E3A5F',
      fontSize: 14, lineHeight: 1.5, color: '#FFFFFF'
    }),
    threatBadge: (color) => ({ fontSize: 10, color, background: color + '22', borderRadius: 4, padding: '2px 7px', marginTop: 4, display: 'inline-block', fontWeight: 600, border: `1px solid ${color}44` }),
    username: { fontSize: 11, color: '#5D8AA8', marginBottom: 2, paddingLeft: 4 },
    ts: { fontSize: 10, color: '#3A5070', marginTop: 3 },
    blockBtn: { fontSize: 11, color: '#FFFFFF', cursor: 'pointer', marginLeft: 8, background: '#C0392B', border: 'none', padding: '3px 10px', borderRadius: 6, fontWeight: 600 },
    inputBar: { padding: '12px 20px', background: '#132338', borderTop: '1px solid #1E3A5F', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 },
    textInput: { flex: 1, padding: '12px 16px', borderRadius: 24, border: '1.5px solid #1E3A5F', background: '#0D1B2A', color: '#FFFFFF', fontSize: 14, outline: 'none', fontFamily: 'Inter,sans-serif' },
    sendBtn: { padding: '12px 22px', borderRadius: 24, background: connected ? 'linear-gradient(135deg,#C0392B,#E74C3C)' : '#333', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: connected ? 'pointer' : 'not-allowed', fontSize: 14 },
  };

  return (
    <div style={S.page}>
      <style>{`@keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Top bar */}
      <div style={S.topbar}>
        <div style={S.logo}>
          <span style={S.logoIcon}>🛡️</span>
          <div>
            <div style={S.logoText}>Sentinel AI</div>
            <div style={{ fontSize: 11, color: '#4A6A8A' }}>Transformer-Based Conversation Safety</div>
          </div>
          <span style={S.roomBadge}>#{user.room}</span>
        </div>
        <div style={S.topRight}>
          <span style={S.statPill('#27AE60')}>{connected ? '🟢 Connected' : '🔴 Reconnecting...'}</span>
          {threatCount > 0 && (
            <span style={S.statPill('#C0392B')}>⚠️ {threatCount} Threat{threatCount > 1 ? 's' : ''} Detected</span>
          )}
          <span style={S.statPill('#2E86C1')}>🤖 BERT Active</span>
          <button style={S.topBtn} onClick={() => {
            const fullChat = visibleMessages
              .filter(m => m.type === 'message')
              .map(m => `${m.username}: ${m.text}`)
              .join('\n');
            localStorage.setItem('chat_analysis', fullChat);
            onNavigate('chatlog');
          }}>📄 Chat Analysis</button>
          <button style={S.topBtn} onClick={() => onNavigate('ocr')}>🖼️ OCR Analysis</button>
          <button style={S.topBtn} onClick={onDashboard}>📊 Dashboard</button>
          <button style={{ ...S.topBtn, color: '#C0392B' }} onClick={onLogout}>Leave</button>
        </div>
      </div>

      {/* Messages */}
      <div style={S.chatArea}>
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3A5070' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#5D8AA8' }}>Sentinel AI is watching over this chat</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Every message is analyzed by a fine-tuned BERT model in real-time.</div>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          if (msg.type === 'system') {
            return <div key={i} style={S.systemMsg}>— {msg.text} —</div>;
          }
          const isMine = msg.username === user.username;
          const color = SEV_COLOR[msg.severity] || '#27AE60';

          return (
            <div key={i} style={S.msgWrap(isMine)}>
              <div style={S.avatar(avatarColor(msg.username || 'U'))}>
                {(msg.username || 'U')[0].toUpperCase()}
              </div>
              <div>
                {!isMine && <div style={S.username}>{msg.username}</div>}
                <div style={S.bubble(isMine, msg.is_threat && !isMine, color)}>
                  {msg.text}
                  {/* ONLY show threat badge and block button on RECEIVER side */}
                  {msg.is_threat && !isMine && (
                    <div style={{ marginTop: 6 }}>
                      <span style={S.threatBadge(color)}>
                        {msg.icon} {msg.label} · {Math.round(msg.confidence * 100)}% confidence
                      </span>
                      <button style={S.blockBtn} onClick={() => blockUser(msg.username)}>
                        🚫 Block User
                      </button>
                    </div>
                  )}
                </div>
                <div style={S.ts}>{msg.timestamp}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div style={S.inputBar}>
        <input
          style={S.textInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={connected ? `Message #${user.room}...` : 'Connecting to Sentinel AI...'}
        />
        <button style={S.sendBtn} onClick={send} disabled={!connected}>Send 🛡️</button>
      </div>

      {/* Threat Alert - only receiver sees this */}
      {showAlert && alert && (
        <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 998, maxWidth: 360, animation: 'slideIn .3s ease' }}>
          <div style={{ background: '#0D1B2A', border: `2px solid ${SEV_COLOR[alert.severity] || '#E74C3C'}`, borderRadius: 14, padding: '16px 18px', boxShadow: `0 8px 32px rgba(0,0,0,0.6)` }}>
            <div style={{ color: SEV_COLOR[alert.severity] || '#E74C3C', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              {alert.icon} {alert.severity} THREAT DETECTED
            </div>
            <div style={{ fontSize: 12, color: '#8FA8D0', marginBottom: 6 }}>
              <b style={{ color: '#FFFFFF' }}>{alert.username}</b> · {alert.label} · {Math.round(alert.confidence * 100)}% confidence
            </div>
            <div style={{ fontSize: 13, color: '#B0C4DE', lineHeight: 1.6, marginBottom: 12 }}>{alert.advice}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${SEV_COLOR[alert.severity] || '#E74C3C'}`, background: (SEV_COLOR[alert.severity] || '#E74C3C') + '22', color: SEV_COLOR[alert.severity] || '#E74C3C', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => blockUser(alert.username)}>
                🚫 Block User
              </button>
              <button
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #1E3A5F', background: 'transparent', color: '#8FA8D0', fontSize: 12, cursor: 'pointer' }}
                onClick={() => setShowAlert(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Popup - full screen overlay */}
      {blockedPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.80)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0D1B2A', border: '2px solid #C0392B', borderRadius: 20, padding: '48px 40px', textAlign: 'center', maxWidth: 400, boxShadow: '0 32px 80px rgba(192,57,43,0.4)' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🚫</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#E74C3C', marginBottom: 12 }}>User Blocked!</div>
            <div style={{ fontSize: 16, color: '#B0C4DE', marginBottom: 8 }}>
              <strong style={{ color: '#FFFFFF' }}>{blockedPopup}</strong> has been blocked.
            </div>
            <div style={{ fontSize: 13, color: '#5D8AA8', marginBottom: 28, lineHeight: 1.7 }}>
              This user has been permanently blocked.<br />
              They have <strong style={{ color: '#E74C3C' }}>no access</strong> to communicate with you.<br />
              All their messages are now hidden.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ background: '#C0392B22', border: '1px solid #C0392B', borderRadius: 10, padding: '12px 28px', color: '#E74C3C', fontWeight: 700, fontSize: 15 }}>🚫 Blocked</div>
              <div style={{ background: '#27AE6022', border: '1px solid #27AE60', borderRadius: 10, padding: '12px 28px', color: '#27AE60', fontWeight: 700, fontSize: 15 }}>✅ You are safe</div>
            </div>
            <button
              onClick={() => setBlockedPopup(null)}
              style={{ background: 'transparent', border: '1px solid #1E3A5F', borderRadius: 8, padding: '8px 24px', color: '#5D8AA8', cursor: 'pointer', fontSize: 13 }}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}