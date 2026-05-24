import React, { useState, useEffect } from 'react';
const BACKEND = 'http://localhost:8000';

const THREAT_COLORS = {
  Phishing:'#FF2D55', Cyberbullying:'#A855F7', Scam:'#FF6B35',
  Harassment:'#FF2D55', HateSpeech:'#FF2D55', SexualContent:'#FF2D55',
  Radicalization:'#FF2D55', Malware:'#FF2D55', Grooming:'#A855F7',
  SelfHarm:'#FF6B35', FakeNews:'#FFB800', Spam:'#0099FF',
  Doxxing:'#FF6B35', Impersonation:'#A855F7', Aggression:'#FF6B35',
  Toxic:'#FFB800', Defacement:'#0099FF', Misinformation:'#FFB800',
};

export default function DashboardPage({ user, onBack }) {
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const fetchData = async () => {
    try {
      const [s, f] = await Promise.all([
        fetch(`${BACKEND}/stats`).then(r=>r.json()),
        fetch(`${BACKEND}/flagged`).then(r=>r.json()),
      ]);
      setStats(s);
      setFlagged(f.flagged_messages||[]);
    } catch {
      setStats({total_messages:0,threats_detected:0,threat_breakdown:{},online_users:0,active_rooms:[]});
    } finally { setLoading(false); }
  };

  useEffect(()=>{
    fetchData();
    const t=setInterval(()=>{ fetchData(); setTick(p=>p+1); },5000);
    return ()=>clearInterval(t);
  },[]);

  const total = stats?.threats_detected||0;
  const threatRate = stats?.total_messages>0 ? Math.round((stats.threats_detected/stats.total_messages)*100) : 0;

  return (
    <div style={{minHeight:'100vh',background:'#04080F',fontFamily:"'Share Tech Mono',monospace",color:'#FFFFFF'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes bar-fill{from{width:0}to{width:var(--w)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#04080F}
        ::-webkit-scrollbar-thumb{background:rgba(0,255,209,0.2);border-radius:2px}
      `}</style>

      {/* Topbar */}
      <div style={{background:'rgba(8,18,32,0.98)',borderBottom:'1px solid rgba(0,255,209,0.15)',padding:'0 24px',height:58,display:'flex',alignItems:'center',gap:16,backdropFilter:'blur(10px)'}}>
        <button onClick={onBack} style={{padding:'6px 14px',borderRadius:2,border:'1px solid rgba(0,255,209,0.2)',background:'transparent',color:'rgba(0,255,209,0.6)',fontSize:9,cursor:'pointer',letterSpacing:2,fontFamily:"'Share Tech Mono',monospace"}}>← RETURN</button>
        <span style={{fontSize:20}}>🛡️</span>
        <div>
          <div style={{fontFamily:"'Orbitron',monospace",fontWeight:700,fontSize:13,letterSpacing:3}}>THREAT INTELLIGENCE CENTER</div>
          <div style={{fontSize:9,color:'rgba(0,255,209,0.4)',letterSpacing:2}}>SENTINEL AI · REAL-TIME ANALYTICS</div>
        </div>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,padding:'4px 12px',borderRadius:2,background:'rgba(0,255,50,0.05)',border:'1px solid rgba(0,255,50,0.2)'}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#00FF32',animation:'blink 1.4s infinite'}}/>
          <span style={{fontSize:9,color:'#00FF32',letterSpacing:2}}>LIVE · REFRESH 5S</span>
        </div>
      </div>

      <div style={{padding:'20px 24px'}}>
        {loading ? (
          <div style={{textAlign:'center',padding:80,fontSize:11,color:'rgba(0,255,209,0.3)',letterSpacing:4}}>LOADING INTELLIGENCE DATA...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
              {[
                {n:stats?.total_messages??0, l:'MSGS ANALYZED', color:'#0099FF'},
                {n:stats?.threats_detected??0, l:'THREATS FOUND', color:'#FF2D55'},
                {n:stats?.online_users??0, l:'USERS ONLINE', color:'#00FFD1'},
                {n:(stats?.active_rooms||[]).length, l:'ACTIVE ROOMS', color:'#A855F7'},
                {n:threatRate+'%', l:'THREAT RATE', color:'#FFB800'},
                {n:'20', l:'CLASSES ACTIVE', color:'#FF6B35'},
              ].map((s,i)=>(
                <div key={i} style={{background:'rgba(8,18,32,0.8)',border:`1px solid ${s.color}22`,borderRadius:3,padding:'16px',borderLeft:`3px solid ${s.color}`,animation:`fadeIn .3s ease ${i*.05}s forwards`,opacity:0}}>
                  <div style={{fontFamily:"'Orbitron',monospace",fontSize:26,fontWeight:700,color:s.color,lineHeight:1}}>{s.n}</div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:'rgba(255,255,255,0.3)',marginTop:8,letterSpacing:2}}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              {/* Threat breakdown */}
              <div style={{background:'rgba(8,18,32,0.8)',border:'1px solid rgba(0,255,209,0.1)',borderRadius:3,padding:20}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,255,209,0.5)',letterSpacing:3,marginBottom:16,paddingBottom:10,borderBottom:'1px solid rgba(0,255,209,0.08)'}}>// THREAT CATEGORY BREAKDOWN</div>
                {Object.keys(THREAT_COLORS).slice(0,10).map(label=>{
                  const count=stats?.threat_breakdown?.[label]||0;
                  const pct=total>0?Math.round((count/total)*100):0;
                  const color=THREAT_COLORS[label];
                  return (
                    <div key={label} style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,marginBottom:4,color:'rgba(255,255,255,0.5)',letterSpacing:1}}>
                        <span style={{color:'rgba(255,255,255,0.7)'}}>{label.toUpperCase()}</span>
                        <span style={{color}}>{count}</span>
                      </div>
                      <div style={{height:3,background:'rgba(255,255,255,0.05)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{height:'100%',width:pct+'%',background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:2,transition:'width .5s ease'}}/>
                      </div>
                    </div>
                  );
                })}
                {total===0&&<div style={{fontSize:10,color:'rgba(0,255,209,0.2)',letterSpacing:2,textAlign:'center',padding:20}}>NO THREATS DETECTED</div>}
              </div>

              {/* Flagged log */}
              <div style={{background:'rgba(8,18,32,0.8)',border:'1px solid rgba(0,255,209,0.1)',borderRadius:3,padding:20,overflow:'hidden'}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,255,209,0.5)',letterSpacing:3,marginBottom:16,paddingBottom:10,borderBottom:'1px solid rgba(0,255,209,0.08)'}}>// FLAGGED MESSAGE LOG</div>
                <div style={{overflowY:'auto',maxHeight:280}}>
                  {flagged.length===0&&<div style={{fontSize:10,color:'rgba(0,255,209,0.2)',letterSpacing:2,textAlign:'center',padding:20}}>NO FLAGGED MESSAGES</div>}
                  {flagged.slice(-20).reverse().map((m,i)=>(
                    <div key={i} style={{padding:'8px 0',borderBottom:'1px solid rgba(0,255,209,0.05)',fontSize:11}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                        <span style={{color:'rgba(0,255,209,0.6)',fontFamily:"'Share Tech Mono',monospace",fontSize:9}}>{m.username}</span>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:8,background:(THREAT_COLORS[m.label]||'#FF2D55')+'15',color:THREAT_COLORS[m.label]||'#FF2D55',border:`1px solid ${(THREAT_COLORS[m.label]||'#FF2D55')}33`,padding:'1px 6px',borderRadius:1,letterSpacing:1}}>{m.label}</span>
                          <span style={{fontSize:8,color:'rgba(255,255,255,0.2)',letterSpacing:1}}>{Math.round(m.confidence*100)}%</span>
                        </div>
                      </div>
                      <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,fontStyle:'italic',fontFamily:"'Rajdhani',sans-serif"}}>"{m.text?.slice(0,70)}{m.text?.length>70?'…':''}"</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Model info */}
            <div style={{background:'rgba(8,18,32,0.8)',border:'1px solid rgba(0,255,209,0.1)',borderRadius:3,padding:20}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'rgba(0,255,209,0.5)',letterSpacing:3,marginBottom:16,paddingBottom:10,borderBottom:'1px solid rgba(0,255,209,0.08)'}}>// MODEL SPECIFICATIONS</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
                {[['MODEL','bert-base-uncased'],['ARCHITECTURE','Transformer Encoder'],['LAYERS','12'],['HIDDEN DIM','768'],['ATTENTION HEADS','12'],['PARAMETERS','110M'],['CLASSES','20'],['FRAMEWORK','PyTorch + HuggingFace'],['OPTIMIZER','AdamW'],['LOSS FN','Cross-Entropy'],['MAX LENGTH','128 tokens'],['VERSION','5.1.0']].map(([k,v])=>(
                  <div key={k} style={{background:'rgba(0,255,209,0.02)',borderRadius:2,padding:'10px 12px',border:'1px solid rgba(0,255,209,0.06)'}}>
                    <div style={{fontSize:8,color:'rgba(0,255,209,0.3)',letterSpacing:2,marginBottom:4}}>{k}</div>
                    <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.7)'}}>{v}</div>
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