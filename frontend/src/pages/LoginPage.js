import React, { useState, useEffect } from 'react';

const ROOMS = ['General Chat', 'Study Group', 'Tech Talk', 'Random'];

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('General Chat');
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 1200);
    setTimeout(() => setBooting(false), 1800);
    return () => clearInterval(t);
  }, []);

  const handle = () => {
    if (!name.trim()) { setErr('IDENTIFICATION REQUIRED'); return; }
    sessionStorage.setItem('username', name.trim());
    onLogin({ username: name.trim(), room });
  };

  const threats = ['Phishing','Cyberbullying','Scam','Harassment','Stalking','Grooming','Fraud','Spam','Impersonation','HateSpeech','Malware','Doxxing'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04080F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Courier New', monospace",
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%,100% { opacity:1; } 92% { opacity:1; } 93% { opacity:.8; } 95% { opacity:1; } 97% { opacity:.9; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity:1; }
          100% { transform: scale(2.4); opacity:0; }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes glitch {
          0%,100%{clip-path:inset(0 0 100% 0)}
          10%{clip-path:inset(30% 0 50% 0);transform:translate(-3px)}
          20%{clip-path:inset(60% 0 20% 0);transform:translate(3px)}
          30%{clip-path:inset(10% 0 80% 0);transform:translate(0)}
        }
        @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes grid-move { from{background-position:0 0} to{background-position:50px 50px} }
        .login-input:focus { border-color: #00FFD1 !important; box-shadow: 0 0 0 2px rgba(0,255,209,0.15) !important; outline:none; }
        .room-btn:hover { border-color: #00FFD1 !important; color: #00FFD1 !important; }
        .enter-btn:hover { background: linear-gradient(135deg,#00FFD1,#0099FF) !important; color:#04080F !important; }
      `}</style>

      {/* Animated grid bg */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none',
        backgroundImage: 'linear-gradient(rgba(0,255,209,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,209,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'grid-move 8s linear infinite',
      }}/>

      {/* Scanline */}
      <div style={{
        position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0,
      }}>
        <div style={{
          position:'absolute', width:'100%', height:3,
          background:'linear-gradient(transparent, rgba(0,255,209,0.06), transparent)',
          animation:'scanline 6s linear infinite',
        }}/>
      </div>

      {/* Corner decorations */}
      {['top:0,left:0', 'top:0,right:0', 'bottom:0,left:0', 'bottom:0,right:0'].map((pos, i) => {
        const [v, h] = pos.split(',');
        const [vk, vv] = v.split(':');
        const [hk, hv] = h.split(':');
        return (
          <div key={i} style={{
            position:'fixed', [vk]:20, [hk]:20, width:60, height:60, pointerEvents:'none',
            borderTop: (vv==='0') ? '2px solid rgba(0,255,209,0.3)' : 'none',
            borderBottom: (vv!=='0') ? '2px solid rgba(0,255,209,0.3)' : 'none',
            borderLeft: (hv==='0') ? '2px solid rgba(0,255,209,0.3)' : 'none',
            borderRight: (hv!=='0') ? '2px solid rgba(0,255,209,0.3)' : 'none',
          }}/>
        );
      })}

      {/* Main card */}
      <div style={{
        width: 480, position:'relative', zIndex:10,
        animation: 'slideUp 0.6s ease forwards',
      }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          {/* Shield icon */}
          <div style={{ position:'relative', display:'inline-block', marginBottom:20 }}>
            <div style={{
              position:'absolute', inset:-20,
              border:'1px solid rgba(0,255,209,0.2)',
              borderRadius:'50%',
              animation:'pulse-ring 2s ease-out infinite',
            }}/>
            <div style={{
              width:72, height:72, borderRadius:'50%',
              background:'linear-gradient(135deg,#001a14,#003326)',
              border:'2px solid #00FFD1',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:32, boxShadow:'0 0 30px rgba(0,255,209,0.3)',
              position:'relative',
            }}>🛡️</div>
          </div>

          <div style={{
            fontFamily:"'Orbitron',monospace", fontSize:32, fontWeight:900,
            color:'#FFFFFF', letterSpacing:6, textTransform:'uppercase',
            textShadow:'0 0 30px rgba(0,255,209,0.4)',
          }}>SENTINEL</div>
          <div style={{
            fontFamily:"'Share Tech Mono',monospace", fontSize:13,
            color:'#00FFD1', letterSpacing:4, marginTop:4,
          }}>AI THREAT DETECTION SYSTEM v5.1</div>

          <div style={{
            display:'inline-flex', alignItems:'center', gap:8, marginTop:12,
            padding:'4px 14px', borderRadius:2,
            background:'rgba(0,255,50,0.05)',
            border:'1px solid rgba(0,255,50,0.3)',
          }}>
            <div style={{
              width:6, height:6, borderRadius:'50%', background:'#00FF32',
              boxShadow:'0 0 8px #00FF32',
              animation:'blink 1.4s ease infinite',
            }}/>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:'#00FF32', letterSpacing:2 }}>
              {booting ? 'INITIALIZING...' : 'PROTECTION ACTIVE'}
            </span>
          </div>
        </div>

        {/* Form panel */}
        <div style={{
          background:'rgba(8,18,32,0.95)',
          border:'1px solid rgba(0,255,209,0.2)',
          borderRadius:4,
          padding:'32px 36px',
          backdropFilter:'blur(20px)',
          boxShadow:'0 0 60px rgba(0,255,209,0.05), inset 0 0 60px rgba(0,0,0,0.3)',
          animation:'flicker 8s infinite',
        }}>
          {/* Top status bar */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginBottom:28, paddingBottom:16,
            borderBottom:'1px solid rgba(0,255,209,0.1)',
          }}>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(0,255,209,0.5)', letterSpacing:2 }}>
              CLEARANCE: PUBLIC
            </span>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(0,255,209,0.5)', letterSpacing:2 }}>
              {new Date().toLocaleTimeString('en-US',{hour12:false})}
              <span style={{animation:'blink 1s infinite', marginLeft:4}}>_</span>
            </span>
          </div>

          {/* Name field */}
          <div style={{ marginBottom:24 }}>
            <label style={{
              display:'block', fontFamily:"'Share Tech Mono',monospace",
              fontSize:10, color:'rgba(0,255,209,0.7)', letterSpacing:3,
              textTransform:'uppercase', marginBottom:10,
            }}>// OPERATOR IDENTIFICATION</label>
            <input
              className="login-input"
              value={name}
              onChange={e => { setName(e.target.value); setErr(''); }}
              onKeyDown={e => e.key==='Enter' && handle()}
              placeholder="Enter display name..."
              autoFocus
              style={{
                width:'100%', padding:'13px 16px',
                background:'rgba(0,255,209,0.03)',
                border:'1px solid rgba(0,255,209,0.2)',
                borderRadius:2, color:'#FFFFFF',
                fontFamily:"'Share Tech Mono',monospace", fontSize:14,
                transition:'all .2s', letterSpacing:1,
              }}
            />
            {err && (
              <div style={{
                fontFamily:"'Share Tech Mono',monospace", fontSize:10,
                color:'#FF3B3B', marginTop:8, letterSpacing:2,
              }}>⚠ {err}</div>
            )}
          </div>

          {/* Room selector */}
          <div style={{ marginBottom:28 }}>
            <label style={{
              display:'block', fontFamily:"'Share Tech Mono',monospace",
              fontSize:10, color:'rgba(0,255,209,0.7)', letterSpacing:3,
              textTransform:'uppercase', marginBottom:10,
            }}>// SELECT OPERATION ZONE</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {ROOMS.map(r => (
                <button key={r} className="room-btn" onClick={() => setRoom(r)} style={{
                  padding:'10px 8px',
                  background: room===r ? 'rgba(0,255,209,0.08)' : 'transparent',
                  border: room===r ? '1px solid #00FFD1' : '1px solid rgba(0,255,209,0.15)',
                  borderRadius:2,
                  color: room===r ? '#00FFD1' : 'rgba(255,255,255,0.4)',
                  fontFamily:"'Share Tech Mono',monospace", fontSize:11,
                  cursor:'pointer', transition:'all .15s', letterSpacing:1,
                  textAlign:'left', paddingLeft:12,
                }}>
                  <span style={{ color: room===r ? '#00FFD1' : 'rgba(0,255,209,0.3)', marginRight:6 }}>{room===r?'▶':'○'}</span>
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Enter button */}
          <button className="enter-btn" onClick={handle} style={{
            width:'100%', padding:'15px',
            background:'linear-gradient(135deg,rgba(0,255,209,0.1),rgba(0,153,255,0.1))',
            border:'1px solid #00FFD1',
            borderRadius:2, color:'#00FFD1',
            fontFamily:"'Orbitron',monospace", fontWeight:700, fontSize:13,
            cursor:'pointer', letterSpacing:4, transition:'all .2s',
            textTransform:'uppercase',
          }}>
            ENTER PROTECTED ZONE →
          </button>

          {/* Threat tags */}
          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid rgba(0,255,209,0.08)' }}>
            <div style={{
              fontFamily:"'Share Tech Mono',monospace", fontSize:9,
              color:'rgba(0,255,209,0.35)', letterSpacing:2, marginBottom:8,
            }}>ACTIVE DETECTION MODULES:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {threats.map(t => (
                <span key={t} style={{
                  fontFamily:"'Share Tech Mono',monospace", fontSize:9,
                  color:'rgba(0,255,209,0.4)', letterSpacing:1,
                  padding:'2px 6px',
                  background:'rgba(0,255,209,0.03)',
                  border:'1px solid rgba(0,255,209,0.1)',
                  borderRadius:1,
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display:'flex', justifyContent:'space-between', marginTop:12,
          padding:'8px 4px',
        }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'rgba(0,255,209,0.2)', letterSpacing:1 }}>
            BERT · 20-CLASS · v5.1.0
          </span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'rgba(0,255,209,0.2)', letterSpacing:1 }}>
            ENCRYPTED · SECURE
          </span>
        </div>
      </div>
    </div>
  );
}