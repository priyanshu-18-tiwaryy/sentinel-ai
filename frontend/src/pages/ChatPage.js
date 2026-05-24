import React, { useState, useEffect, useRef, useCallback } from 'react';

const BACKEND_WS = 'ws://localhost:8000/ws';
const SEV_COLOR = { CRITICAL:'#FF2D55', HIGH:'#FF6B35', MEDIUM:'#FFB800', LOW:'#FFE033', NONE:'#00FFD1' };

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
  const roomSlug = user.room.replace(/\s+/g,'-').toLowerCase();

  const connect = useCallback(() => {
    const socket = new WebSocket(`${BACKEND_WS}/${roomSlug}/${encodeURIComponent(user.username)}`);
    ws.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
    socket.onerror = () => setConnected(false);
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'threat_alert') {
        if (data.username !== user.username) {
          setAlert(data); setShowAlert(true); setThreatCount(c=>c+1);
          setTimeout(()=>setShowAlert(false), 8000);
        }
      } else {
        setMessages(prev=>[...prev.slice(-200), data]);
        if (data.type==='message' && data.is_threat) setThreatCount(c=>c+1);
      }
    };
  }, [roomSlug, user.username]);

  useEffect(() => { connect(); return ()=>ws.current?.close(); }, [connect]);
  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const send = () => {
    if (!input.trim()||!connected) return;
    ws.current?.send(JSON.stringify({text:input.trim()}));
    setInput('');
  };

  const blockUser = (username) => {
    setBlockedUsers(prev=>new Set([...prev,username]));
    setShowAlert(false); setBlockedPopup(username);
    setTimeout(()=>setBlockedPopup(null), 4000);
  };

  const visibleMessages = messages.filter(m=>!blockedUsers.has(m.username));

  const avatarColor = (name) => {
    const colors=['#FF2D55','#00FFD1','#FFB800','#0099FF','#FF6B35','#A855F7'];
    let h=0; for(const c of name) h+=c.charCodeAt(0);
    return colors[h%colors.length];
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'#04080F',fontFamily:"'Share Tech Mono',monospace",color:'#FFFFFF',overflow:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes slideInRight{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(0,255,209,0.4)}70%{box-shadow:0 0 0 8px rgba(0,255,209,0)}}
        @keyframes scan{0%{background-position:0 0}100%{background-position:0 100px}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#04080F}
        ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.2);border-radius:2px}
        .chat-input:focus{border-color:#00FFD1!important;outline:none;}
        .top-btn:hover{border-color:#00FFD1!important;color:#00FFD1!important;}
        .send-btn:hover{background:linear-gradient(135deg,#00FFD1,#0099FF)!important;color:#04080F!important;}
        .msg-bubble{animation:fadeIn .2s ease forwards;}
      `}</style>

      {/* Topbar */}
      <div style={{
        background:'rgba(8,18,32,0.98)',
        borderBottom:'1px solid rgba(0,255,209,0.15)',
        padding:'0 20px', height:58,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0, backdropFilter:'blur(10px)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{
            width:36,height:36,borderRadius:3,
            background:'linear-gradient(135deg,rgba(0,255,209,0.1),rgba(0,100,80,0.2))',
            border:'1px solid rgba(0,255,209,0.3)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,
          }}>🛡️</div>
          <div>
            <div style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:14,color:'#FFFFFF',letterSpacing:3}}>SENTINEL AI</div>
            <div style={{fontSize:9,color:'rgba(0,255,209,0.5)',letterSpacing:2}}>TRANSFORMER-BASED THREAT DETECTION</div>
          </div>
          <div style={{
            padding:'3px 12px', borderRadius:2,
            background:'rgba(0,255,209,0.05)',
            border:'1px solid rgba(0,255,209,0.2)',
            fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(0,255,209,0.7)', letterSpacing:2,
          }}>#{user.room.toUpperCase()}</div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:2,background:connected?'rgba(0,255,50,0.05)':'rgba(255,45,85,0.05)',border:`1px solid ${connected?'rgba(0,255,50,0.3)':'rgba(255,45,85,0.3)'}`}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:connected?'#00FF32':'#FF2D55',animation:connected?'pulse-dot 2s infinite':'blink 1s infinite'}}/>
            <span style={{fontSize:9,color:connected?'#00FF32':'#FF2D55',letterSpacing:2}}>{connected?'SECURE':'RECONNECTING'}</span>
          </div>
          {threatCount>0&&<div style={{padding:'4px 10px',borderRadius:2,background:'rgba(255,45,85,0.08)',border:'1px solid rgba(255,45,85,0.3)',fontSize:9,color:'#FF2D55',letterSpacing:2}}>⚠ {threatCount} THREATS</div>}
          <div style={{padding:'4px 10px',borderRadius:2,background:'rgba(0,153,255,0.05)',border:'1px solid rgba(0,153,255,0.2)',fontSize:9,color:'#0099FF',letterSpacing:2}}>BERT ACTIVE</div>
          {[['📄','CHAT LOG','chatlog'],['🖼️','OCR','ocr'],['📊','INTEL','dashboard']].map(([ic,lb,pg])=>(
            <button key={pg} className="top-btn" onClick={()=>{ if(pg==='chatlog'){const f=visibleMessages.filter(m=>m.type==='message').map(m=>`${m.username}: ${m.text}`).join('\n');localStorage.setItem('chat_analysis',f);} onNavigate(pg); }} style={{padding:'5px 10px',borderRadius:2,border:'1px solid rgba(0,255,209,0.15)',background:'transparent',color:'rgba(255,255,255,0.4)',fontSize:9,cursor:'pointer',letterSpacing:2,transition:'all .15s'}}>
              {ic} {lb}
            </button>
          ))}
          <button onClick={onLogout} style={{padding:'5px 10px',borderRadius:2,border:'1px solid rgba(255,45,85,0.3)',background:'transparent',color:'rgba(255,45,85,0.7)',fontSize:9,cursor:'pointer',letterSpacing:2,transition:'all .15s'}}>LEAVE</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:4}}>
        {visibleMessages.length===0&&(
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',opacity:.4}}>
            <div style={{fontSize:48,marginBottom:16}}>🛡️</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:13,color:'#00FFD1',letterSpacing:4,marginBottom:8}}>SENTINEL ACTIVE</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'rgba(0,255,209,0.5)',letterSpacing:2,textAlign:'center'}}>ALL MESSAGES ANALYZED IN REAL-TIME<br/>BERT MODEL MONITORING FOR 20 THREAT CLASSES</div>
          </div>
        )}

        {visibleMessages.map((msg,i)=>{
          if(msg.type==='system') return <div key={i} style={{textAlign:'center',fontSize:9,color:'rgba(0,255,209,0.25)',letterSpacing:3,padding:'4px 0'}}>— {msg.text} —</div>;
          const isMine=msg.username===user.username;
          const color=SEV_COLOR[msg.severity]||'#00FFD1';
          return (
            <div key={i} className="msg-bubble" style={{display:'flex',flexDirection:isMine?'row-reverse':'row',alignItems:'flex-end',gap:8,marginBottom:2}}>
              <div style={{width:28,height:28,borderRadius:2,background:avatarColor(msg.username||'U')+'22',border:`1px solid ${avatarColor(msg.username||'U')}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,color:avatarColor(msg.username||'U'),fontFamily:"'Orbitron',monospace"}}>
                {(msg.username||'U')[0].toUpperCase()}
              </div>
              <div style={{maxWidth:'60%'}}>
                {!isMine&&<div style={{fontSize:9,color:'rgba(0,255,209,0.4)',marginBottom:3,paddingLeft:2,letterSpacing:2}}>{msg.username}</div>}
                <div style={{
                  padding:'10px 14px',
                  borderRadius: isMine?'12px 2px 12px 12px':'2px 12px 12px 12px',
                  background: msg.is_threat&&!isMine ? `rgba(${color==='#FF2D55'?'255,45,85':color==='#FF6B35'?'255,107,53':'255,184,0'},0.07)` : isMine?'rgba(0,153,255,0.12)':'rgba(0,255,209,0.04)',
                  border: msg.is_threat&&!isMine ? `1px solid ${color}44` : isMine?'1px solid rgba(0,153,255,0.2)':'1px solid rgba(0,255,209,0.08)',
                  fontSize:13,lineHeight:1.5,color:'#FFFFFF',
                  fontFamily:"'Rajdhani',sans-serif",fontWeight:500,
                  borderLeft: msg.is_threat&&!isMine?`3px solid ${color}`:undefined,
                }}>
                  {msg.text}
                  {msg.is_threat&&!isMine&&(
                    <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      <span style={{fontSize:9,color,background:color+'15',borderRadius:2,padding:'2px 8px',letterSpacing:2,border:`1px solid ${color}33`,fontFamily:"'Share Tech Mono',monospace"}}>
                        {msg.icon} {msg.label} · {Math.round(msg.confidence*100)}%
                      </span>
                      <button onClick={()=>blockUser(msg.username)} style={{fontSize:9,color:'#FF2D55',background:'rgba(255,45,85,0.1)',border:'1px solid rgba(255,45,85,0.3)',padding:'2px 8px',borderRadius:2,cursor:'pointer',letterSpacing:2,fontFamily:"'Share Tech Mono',monospace"}}>🚫 BLOCK</button>
                    </div>
                  )}
                </div>
                <div style={{fontSize:9,color:'rgba(0,255,209,0.15)',marginTop:2,paddingLeft:2,letterSpacing:1,textAlign:isMine?'right':'left'}}>{msg.timestamp}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:'12px 20px',background:'rgba(8,18,32,0.98)',borderTop:'1px solid rgba(0,255,209,0.1)',display:'flex',gap:10,alignItems:'center',flexShrink:0}}>
        <div style={{flex:1,position:'relative'}}>
          <input
            className="chat-input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&send()}
            placeholder={connected?`Message #${user.room}...`:'Establishing secure connection...'}
            style={{width:'100%',padding:'12px 16px',borderRadius:3,border:'1px solid rgba(0,255,209,0.15)',background:'rgba(0,255,209,0.03)',color:'#FFFFFF',fontSize:13,fontFamily:"'Rajdhani',sans-serif",fontWeight:500,transition:'border .2s'}}
          />
        </div>
        <button className="send-btn" onClick={send} disabled={!connected} style={{
          padding:'12px 24px',borderRadius:3,
          background:connected?'rgba(0,255,209,0.08)':'rgba(255,255,255,0.03)',
          border:`1px solid ${connected?'#00FFD1':'rgba(255,255,255,0.1)'}`,
          color:connected?'#00FFD1':'rgba(255,255,255,0.2)',
          fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:10,
          cursor:connected?'pointer':'not-allowed',letterSpacing:3,transition:'all .2s',
        }}>SEND 🛡️</button>
      </div>

      {/* Threat alert */}
      {showAlert&&alert&&(
        <div style={{position:'fixed',top:70,right:16,zIndex:998,maxWidth:340,animation:'slideInRight .3s ease'}}>
          <div style={{background:'rgba(4,8,15,0.97)',border:`2px solid ${SEV_COLOR[alert.severity]||'#FF2D55'}`,borderRadius:4,padding:'16px 18px',boxShadow:`0 0 40px ${(SEV_COLOR[alert.severity]||'#FF2D55')}22`}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:SEV_COLOR[alert.severity],letterSpacing:3,marginBottom:8}}>⚠ {alert.severity} THREAT INTERCEPTED</div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:'#FFFFFF',marginBottom:4}}><strong>{alert.username}</strong> · {alert.label}</div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,color:'rgba(255,255,255,0.6)',marginBottom:12,lineHeight:1.5}}>{alert.advice}</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>blockUser(alert.username)} style={{flex:1,padding:'7px',borderRadius:2,border:`1px solid ${SEV_COLOR[alert.severity]}`,background:`${SEV_COLOR[alert.severity]}15`,color:SEV_COLOR[alert.severity],fontSize:9,fontFamily:"'Share Tech Mono',monospace",cursor:'pointer',letterSpacing:2}}>🚫 BLOCK USER</button>
              <button onClick={()=>setShowAlert(false)} style={{flex:1,padding:'7px',borderRadius:2,border:'1px solid rgba(0,255,209,0.2)',background:'transparent',color:'rgba(0,255,209,0.5)',fontSize:9,fontFamily:"'Share Tech Mono',monospace",cursor:'pointer',letterSpacing:2}}>DISMISS</button>
            </div>
          </div>
        </div>
      )}

      {/* Block popup */}
      {blockedPopup&&(
        <div style={{position:'fixed',inset:0,background:'rgba(4,8,15,0.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'rgba(8,18,32,0.99)',border:'2px solid #FF2D55',borderRadius:4,padding:'48px 40px',textAlign:'center',maxWidth:380,boxShadow:'0 0 80px rgba(255,45,85,0.2)'}}>
            <div style={{fontSize:56,marginBottom:16}}>🚫</div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:700,color:'#FF2D55',letterSpacing:4,marginBottom:12}}>USER BLOCKED</div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:15,color:'rgba(255,255,255,0.7)',marginBottom:6}}><strong style={{color:'#FFFFFF'}}>{blockedPopup}</strong> has been blocked</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'rgba(0,255,209,0.4)',marginBottom:24,lineHeight:1.8,letterSpacing:1}}>ALL MESSAGES HIDDEN<br/>NO FURTHER CONTACT POSSIBLE</div>
            <button onClick={()=>setBlockedPopup(null)} style={{background:'transparent',border:'1px solid rgba(0,255,209,0.2)',borderRadius:2,padding:'8px 24px',color:'rgba(0,255,209,0.5)',cursor:'pointer',fontFamily:"'Share Tech Mono',monospace",fontSize:10,letterSpacing:2}}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}