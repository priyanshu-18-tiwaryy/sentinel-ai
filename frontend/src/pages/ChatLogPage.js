import React, { useState, useEffect } from 'react';
const BACKEND = 'http://localhost:8000';

const THREAT_COLORS = {
  Phishing:'#FF2D55',Cyberbullying:'#A855F7',Scam:'#FF6B35',Harassment:'#FF2D55',
  HateSpeech:'#FF2D55',SexualContent:'#FF2D55',Radicalization:'#FF2D55',
  Malware:'#FF2D55',Grooming:'#A855F7',SelfHarm:'#FF6B35',FakeNews:'#FFB800',
  Spam:'#0099FF',Doxxing:'#FF6B35',Impersonation:'#A855F7',Aggression:'#FF6B35',
  Toxic:'#FFB800',Defacement:'#0099FF',Misinformation:'#FFB800',Benign:'#00FFD1',
};

const currentUser = sessionStorage.getItem('username');

const exampleLog = `User1: Hey can I talk to you privately?
User2: Sure what's up
User1: I have screenshots of you. Pay me $500 or I'll send them to everyone you know
User2: What? That's not true
User1: Don't ignore me. I know where you live
User2: Please stop this
User1: You're worthless. Nobody likes you anyway
User1: Click here to verify your payment account immediately http://pay-now.xyz`;

export default function ChatLogPage({ onBack }) {
  const [chatLog, setChatLog] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(()=>{
    const saved=localStorage.getItem('chat_analysis');
    if(saved) setChatLog(saved);
  },[]);

  const analyze = async () => {
    if(!chatLog.trim()) return;
    setLoading(true); setResults([]); setSummary(null); setProgress(0);
    const lines=chatLog.split('\n').filter(l=>l.trim().length>3);
    const analyzed=[];
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      setProgress(Math.round(((i+1)/lines.length)*100));
      try {
        const res=await fetch(`${BACKEND}/classify`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:line.trim()})});
        const data=await res.json();
        analyzed.push({text:line.trim(),...data});
      } catch {
        analyzed.push({text:line.trim(),label:'Error',confidence:0,is_threat:false,color:'#888',icon:'❓'});
      }
    }
    setResults(analyzed);
    const threats=analyzed.filter(r=>r.is_threat);
    const breakdown={};
    threats.forEach(t=>{breakdown[t.label]=(breakdown[t.label]||0)+1;});
    setSummary({
      total:analyzed.length,threats:threats.length,safe:analyzed.length-threats.length,breakdown,
      verdict:threats.length===0?'SAFE':threats.length<=2?'SUSPICIOUS':'DANGEROUS',
    });
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'#04080F',fontFamily:"'Share Tech Mono',monospace",color:'#FFFFFF'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes progress-fill{from{width:0}to{width:100%}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#04080F}
        ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.2);border-radius:2px}
        .log-textarea:focus{border-color:rgba(0,255,209,0.4)!important;outline:none;}
      `}</style>

      {/* Topbar */}
      <div style={{background:'rgba(8,18,32,0.98)',borderBottom:'1px solid rgba(0,255,209,0.15)',padding:'0 24px',height:58,display:'flex',alignItems:'center',gap:16}}>
        <button onClick={onBack} style={{padding:'6px 14px',borderRadius:2,border:'1px solid rgba(0,255,209,0.2)',background:'transparent',color:'rgba(0,255,209,0.6)',fontSize:9,cursor:'pointer',letterSpacing:2}}>← RETURN</button>
        <span style={{fontSize:18}}>🛡️</span>
        <div>
          <div style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:13,letterSpacing:3}}>CHAT LOG ANALYZER</div>
          <div style={{fontSize:9,color:'rgba(0,255,209,0.4)',letterSpacing:2}}>PASTE CONVERSATION · BERT CLASSIFIES EACH MESSAGE</div>
        </div>
      </div>

      <div style={{padding:'24px',maxWidth:900,margin:'0 auto'}}>
        {/* Example format */}
        <div style={{background:'rgba(8,18,32,0.8)',border:'1px solid rgba(0,255,209,0.1)',borderRadius:3,padding:'16px 20px',marginBottom:20}}>
          <div style={{fontSize:9,color:'rgba(0,255,209,0.5)',letterSpacing:3,marginBottom:10}}>// EXAMPLE FORMAT</div>
          {exampleLog.split('\n').map((l,i)=>(
            <div key={i} style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,color:'rgba(255,255,255,0.35)',lineHeight:1.7}}>
              <span style={{color:'rgba(0,255,209,0.3)'}}>{l.split(':')[0]}:</span>
              {l.includes(':')?' '+l.split(':').slice(1).join(':'):''}
            </div>
          ))}
          <button onClick={()=>setChatLog(exampleLog)} style={{marginTop:12,padding:'6px 14px',borderRadius:2,border:'1px solid rgba(0,255,209,0.2)',background:'rgba(0,255,209,0.05)',color:'rgba(0,255,209,0.6)',fontSize:9,cursor:'pointer',letterSpacing:2,fontFamily:"'Share Tech Mono',monospace"}}>
            LOAD EXAMPLE →
          </button>
        </div>

        {/* Textarea */}
        <textarea
          className="log-textarea"
          value={chatLog}
          onChange={e=>setChatLog(e.target.value)}
          placeholder="Paste your full chat conversation here...&#10;&#10;Format:&#10;User1: message here&#10;User2: reply here"
          style={{
            width:'100%',minHeight:180,
            background:'rgba(8,18,32,0.8)',
            border:'1px solid rgba(0,255,209,0.15)',
            borderRadius:3,padding:'16px',
            color:'#FFFFFF',fontSize:13,
            fontFamily:"'Rajdhani',sans-serif",fontWeight:500,
            resize:'vertical',lineHeight:1.7,
            transition:'border .2s',
          }}
        />

        {/* Analyze button */}
        <button onClick={analyze} disabled={loading} style={{
          marginTop:10,width:'100%',padding:'14px',borderRadius:3,
          background:loading?'rgba(255,255,255,0.03)':'rgba(0,255,209,0.06)',
          border:`1px solid ${loading?'rgba(255,255,255,0.1)':'#00FFD1'}`,
          color:loading?'rgba(255,255,255,0.3)':'#00FFD1',
          fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:11,
          cursor:loading?'not-allowed':'pointer',letterSpacing:4,transition:'all .2s',
        }}>
          {loading?`🤖 ANALYZING... ${progress}%`:'🔍 ANALYZE WITH BERT'}
        </button>

        {/* Progress bar */}
        {loading&&(
          <div style={{marginTop:8,height:2,background:'rgba(0,255,209,0.08)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:progress+'%',background:'linear-gradient(90deg,#00FFD1,#0099FF)',borderRadius:2,transition:'width .2s ease'}}/>
          </div>
        )}

        {/* Summary */}
        {summary&&(
          <div style={{
            marginTop:20,
            background: summary.verdict==='SAFE'?'rgba(0,255,50,0.04)':summary.verdict==='SUSPICIOUS'?'rgba(255,184,0,0.04)':'rgba(255,45,85,0.04)',
            border: `2px solid ${summary.verdict==='SAFE'?'rgba(0,255,50,0.3)':summary.verdict==='SUSPICIOUS'?'rgba(255,184,0,0.3)':'rgba(255,45,85,0.3)'}`,
            borderRadius:3,padding:'20px 24px',animation:'fadeIn .3s ease',
          }}>
            <div style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:16,letterSpacing:4,color:summary.verdict==='SAFE'?'#00FF32':summary.verdict==='SUSPICIOUS'?'#FFB800':'#FF2D55',marginBottom:6}}>
              {summary.verdict==='SAFE'?'✅ CONVERSATION SECURE':summary.verdict==='SUSPICIOUS'?'⚠ SUSPICIOUS ACTIVITY':'🚨 DANGEROUS — THREATS FOUND'}
            </div>
            <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,color:'rgba(255,255,255,0.4)',letterSpacing:1,marginBottom:16}}>
              BERT analyzed {summary.total} messages · {summary.threats} threat{summary.threats!==1?'s':''} detected
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
              {[{n:summary.threats,l:'THREATS',c:'#FF2D55'},{n:summary.safe,l:'SAFE',c:'#00FFD1'},{n:summary.total,l:'TOTAL',c:'#0099FF'}].map(s=>(
                <div key={s.l} style={{background:'rgba(0,0,0,0.3)',borderRadius:2,padding:'12px',textAlign:'center',borderLeft:`3px solid ${s.c}`}}>
                  <div style={{fontFamily:"'Orbitron',monospace",fontSize:24,fontWeight:700,color:s.c}}>{s.n}</div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.3)',marginTop:4,letterSpacing:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            {Object.keys(summary.breakdown).length>0&&(
              <>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,255,209,0.4)',letterSpacing:3,marginBottom:8}}>BREAKDOWN:</div>
                {Object.entries(summary.breakdown).map(([label,count])=>(
                  <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',marginBottom:4,background:(THREAT_COLORS[label]||'#FF2D55')+'08',borderRadius:2,border:`1px solid ${(THREAT_COLORS[label]||'#FF2D55')}22`}}>
                    <span style={{color:THREAT_COLORS[label]||'#FF2D55',fontSize:10,letterSpacing:2}}>{label.toUpperCase()}</span>
                    <span style={{color:'#FFFFFF',fontWeight:700,fontSize:10}}>{count} MSG{count>1?'S':''}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Message results */}
        {results.length>0&&(
          <div style={{marginTop:20}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,255,209,0.4)',letterSpacing:3,marginBottom:12}}>// MESSAGE-BY-MESSAGE ANALYSIS</div>
            {results.map((r,i)=>{
              const sender=r.text.includes(':')?r.text.split(':')[0].trim():'Unknown';
              const color=r.color||'#888';
              return (
                <div key={i} style={{
                  background:r.is_threat?`${color}06`:'rgba(8,18,32,0.5)',
                  border:`1px solid ${r.is_threat?color+'33':'rgba(0,255,209,0.06)'}`,
                  borderRadius:2,padding:'10px 14px',marginBottom:6,
                  borderLeft:`3px solid ${r.is_threat?color:'rgba(0,255,209,0.1)'}`,
                  animation:`fadeIn .2s ease ${i*.02}s forwards`,opacity:0,
                }}>
                  <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:13,color:'rgba(255,255,255,0.8)',marginBottom:6,lineHeight:1.5}}>{r.text}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color,background:color+'15',borderRadius:1,padding:'2px 8px',letterSpacing:2,border:`1px solid ${color}33`}}>{r.icon} {r.label}</span>
                    <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(255,255,255,0.2)',letterSpacing:1}}>{Math.round((r.confidence||0)*100)}% CONFIDENCE</span>
                    {r.is_threat&&sender!==currentUser&&(['Harassment','Phishing','Cyberbullying','SelfHarm','Grooming'].includes(r.label))&&(
                      <button onClick={()=>alert(`${sender} blocked`)} style={{fontSize:9,color:'#FF2D55',background:'rgba(255,45,85,0.1)',border:'1px solid rgba(255,45,85,0.3)',padding:'2px 8px',borderRadius:1,cursor:'pointer',letterSpacing:2,fontFamily:"'Share Tech Mono',monospace"}}>🚫 BLOCK {sender.toUpperCase()}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}