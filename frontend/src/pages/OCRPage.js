import React, { useState, useRef } from 'react';

const BACKEND = 'http://localhost:8000';

export default function OCRPage({ user, onBack }) {
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [drag, setDrag]       = useState(false);
  const [step, setStep]       = useState(0); // 0=idle 1=ocr 2=classify 3=done
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG, BMP, TIFF).');
      return;
    }
    setImage(file);
    setResult(null);
    setError(null);
    setStep(0);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setStep(1);

    try {
      const formData = new FormData();
      formData.append('file', image);

      // Step 1: OCR + classify via backend
      setStep(1);
      await new Promise(r => setTimeout(r, 400)); // visual delay for OCR step
      setStep(2);

      const res = await fetch(`${BACKEND}/classify-image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setStep(3);
      await new Promise(r => setTimeout(r, 300));
      setResult(data);

    } catch (err) {
      // Check if it's a network/connection error
      if (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Cannot connect to backend (localhost:8000). Make sure your FastAPI server is running:\n\nuvicorn main:app --reload');
      } else if (err.message.includes('OCR not installed')) {
        setError('Tesseract OCR is not installed on the server.\n\nInstall it with: pip install pytesseract pillow\nAnd: apt install tesseract-ocr (Linux) or brew install tesseract (Mac)');
      } else {
        setError(err.message);
      }
    }

    setStep(0);
    setLoading(false);
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setStep(0);
  };

  // ── Severity badge colour ──────────────────────────────────────────────
  const severityColors = {
    NONE:     { bg: 'rgba(39,174,96,0.12)',  border: 'rgba(39,174,96,0.35)',  text: '#2ECC71' },
    LOW:      { bg: 'rgba(125,102,8,0.12)',  border: 'rgba(125,102,8,0.35)',  text: '#F1C40F' },
    MEDIUM:   { bg: 'rgba(26,82,118,0.15)',  border: 'rgba(41,128,185,0.35)', text: '#3498DB' },
    HIGH:     { bg: 'rgba(211,84,0,0.12)',   border: 'rgba(211,84,0,0.35)',   text: '#E67E22' },
    CRITICAL: { bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.35)',  text: '#E74C3C' },
  };

  // ── Step labels ──────────────────────────────────────────────────────
  const steps = [
    { n: '01', title: 'UPLOAD SCREENSHOT', sub: 'PNG · JPG · JPEG · BMP · TIFF', icon: '📸', active: step === 0 },
    { n: '02', title: 'TESSERACT OCR',     sub: 'Extracting text from image…',    icon: '🔍', active: step === 1 },
    { n: '03', title: 'BERT CLASSIFY',     sub: 'Running threat classification…', icon: '🤖', active: step === 2 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#04080F', fontFamily: "'Share Tech Mono', monospace", color: '#FFFFFF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes scanline{ 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes stepGlow{ 0%,100%{box-shadow:0 0 0 rgba(0,255,209,0)} 50%{box-shadow:0 0 12px rgba(0,255,209,0.3)} }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: #04080F }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,209,0.2); border-radius: 2px }
        .ocr-upload-zone:hover { border-color: rgba(0,255,209,0.5) !important; background: rgba(0,255,209,0.04) !important; }
        .ocr-analyze-btn:hover:not(:disabled) { background: rgba(0,255,209,0.12) !important; }
        .ocr-reset-btn:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(8,18,32,0.98)',
        borderBottom: '1px solid rgba(0,255,209,0.15)',
        padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button onClick={onBack} style={{
          padding: '6px 14px', borderRadius: 2,
          border: '1px solid rgba(0,255,209,0.2)', background: 'transparent',
          color: 'rgba(0,255,209,0.6)', fontSize: 9, cursor: 'pointer', letterSpacing: 2,
          transition: 'all .2s',
        }}>← RETURN</button>

        <span style={{ fontSize: 18 }}>🖼️</span>

        <div>
          <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 13, letterSpacing: 3 }}>
            OCR SCREENSHOT ANALYSIS
          </div>
          <div style={{ fontSize: 9, color: 'rgba(0,255,209,0.4)', letterSpacing: 2 }}>
            TESSERACT OCR → BERT CLASSIFICATION · {image ? image.name : 'NO FILE SELECTED'}
          </div>
        </div>

        {/* live dot */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: loading ? '#F1C40F' : '#00FFD1',
            animation: 'pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 9, color: 'rgba(0,255,209,0.4)', letterSpacing: 2 }}>
            {loading ? 'PROCESSING' : 'READY'}
          </span>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: 820, margin: '0 auto' }}>

        {/* ── Step indicators ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              background: s.active ? 'rgba(0,255,209,0.06)' : 'rgba(8,18,32,0.8)',
              border: `1px solid ${s.active ? 'rgba(0,255,209,0.5)' : 'rgba(0,255,209,0.1)'}`,
              borderRadius: 3, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all .3s',
              animation: s.active ? 'stepGlow 1s infinite' : 'none',
            }}>
              <div style={{
                fontFamily: "'Orbitron',monospace", fontSize: 22, fontWeight: 900,
                color: s.active ? 'rgba(0,255,209,0.6)' : 'rgba(0,255,209,0.12)', lineHeight: 1,
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 22, marginBottom: 3 }}>
                  {s.active && loading
                    ? <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
                    : s.icon}
                </div>
                <div style={{
                  fontFamily: "'Orbitron',monospace", fontSize: 9,
                  color: s.active ? 'rgba(0,255,209,0.9)' : 'rgba(0,255,209,0.5)',
                  letterSpacing: 2, marginBottom: 2,
                }}>{s.title}</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {s.active && loading ? s.sub : (i === 0 ? 'PNG · JPG · JPEG · BMP · TIFF' : i === 1 ? 'Extracts text from image' : 'Detects 20 threat classes')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upload zone ─────────────────────────────────────────── */}
        <div
          className="ocr-upload-zone"
          onClick={() => !loading && fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); if (!loading) handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${drag ? '#00FFD1' : 'rgba(0,255,209,0.2)'}`,
            borderRadius: 3, padding: preview ? 12 : '32px 24px',
            textAlign: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 14,
            background: drag ? 'rgba(0,255,209,0.04)' : 'rgba(8,18,32,0.5)',
            transition: 'all .2s',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />

          {/* scanline effect when loading */}
          {loading && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '30%',
              background: 'linear-gradient(transparent, rgba(0,255,209,0.04), transparent)',
              animation: 'scanline 1.5s linear infinite', pointerEvents: 'none',
            }} />
          )}

          {preview ? (
            <div style={{ position: 'relative' }}>
              <img
                src={preview}
                alt="preview"
                style={{
                  width: '100%', maxHeight: 280, objectFit: 'contain',
                  borderRadius: 2, border: '1px solid rgba(0,255,209,0.15)',
                  opacity: loading ? 0.5 : 1, transition: 'opacity .3s',
                }}
              />
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(4,8,15,0.5)',
                }}>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: '#00FFD1', letterSpacing: 3, animation: 'pulse 1s infinite' }}>
                    {step === 1 ? '🔍 EXTRACTING TEXT...' : '🤖 CLASSIFYING...'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🖼️</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 11, color: 'rgba(0,255,209,0.6)', letterSpacing: 3, marginBottom: 6 }}>
                CLICK TO UPLOAD
              </div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                or drag & drop · PNG, JPG, JPEG, BMP, TIFF
              </div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(0,255,209,0.25)', marginTop: 10, letterSpacing: 1 }}>
                Screenshots from WhatsApp · Telegram · Instagram DMs · SMS · Email
              </div>
            </>
          )}
        </div>

        {/* ── File info bar ────────────────────────────────────────── */}
        {image && (
          <div style={{
            marginBottom: 12, padding: '8px 14px',
            background: 'rgba(8,18,32,0.8)', borderRadius: 2,
            border: '1px solid rgba(0,255,209,0.1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: 'rgba(0,255,209,0.6)', letterSpacing: 1 }}>
              📎 {image.name}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
                {(image.size / 1024).toFixed(1)} KB · {image.type.split('/')[1].toUpperCase()}
              </span>
              {!loading && (
                <button
                  className="ocr-reset-btn"
                  onClick={reset}
                  style={{
                    fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 1,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2, padding: '3px 8px', cursor: 'pointer', transition: 'all .2s',
                  }}
                >✕ CLEAR</button>
              )}
            </div>
          </div>
        )}

        {/* ── Analyze button ───────────────────────────────────────── */}
        <button
          className="ocr-analyze-btn"
          onClick={analyze}
          disabled={!image || loading}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 3,
            background: loading ? 'rgba(0,255,209,0.03)' : image ? 'rgba(0,255,209,0.07)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${loading ? 'rgba(0,255,209,0.3)' : image ? '#00FFD1' : 'rgba(0,255,209,0.1)'}`,
            color: loading ? 'rgba(0,255,209,0.5)' : image ? '#00FFD1' : 'rgba(0,255,209,0.2)',
            fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 10,
            cursor: (!image || loading) ? 'not-allowed' : 'pointer',
            letterSpacing: 4, transition: 'all .2s', marginBottom: 20,
          }}
        >
          {loading
            ? <span style={{ animation: 'pulse 1s infinite', display: 'inline-block' }}>
                {step === 1 ? '🔍 RUNNING TESSERACT OCR...' : step === 2 ? '🤖 BERT CLASSIFYING...' : '⚙️ PROCESSING...'}
              </span>
            : '🔍 ANALYZE IMAGE  ·  TESSERACT + BERT'}
        </button>

        {/* ── Error panel ─────────────────────────────────────────── */}
        {error && (
          <div style={{
            marginBottom: 20, background: 'rgba(192,57,43,0.06)',
            border: '1px solid rgba(192,57,43,0.3)',
            borderRadius: 3, padding: '16px 20px',
            animation: 'fadeIn .3s ease',
          }}>
            <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 10, color: '#E74C3C', letterSpacing: 3, marginBottom: 10 }}>
              ⚠ ERROR
            </div>
            <pre style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: 11,
              color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-wrap',
              margin: 0, lineHeight: 1.8,
            }}>{error}</pre>
          </div>
        )}

        {/* ── Result panel ─────────────────────────────────────────── */}
        {result && (
          <div style={{
            background: `${result.color || '#00FFD1'}08`,
            border: `2px solid ${result.color || '#00FFD1'}44`,
            borderRadius: 3, padding: '22px 26px',
            animation: 'fadeIn .35s ease',
          }}>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 20, flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 700, fontSize: 14, letterSpacing: 3, color: result.color || '#00FFD1' }}>
                {result.icon} {result.is_threat ? 'THREAT DETECTED IN IMAGE' : 'IMAGE APPEARS SAFE'}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {result.model && (
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                    color: 'rgba(0,255,209,0.4)', letterSpacing: 2,
                    border: '1px solid rgba(0,255,209,0.15)', borderRadius: 2, padding: '3px 8px',
                  }}>MODEL: {result.model}</span>
                )}
              </div>
            </div>

            {/* OCR output */}
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 2, padding: '16px',
              marginBottom: 18, border: '1px solid rgba(0,255,209,0.08)',
              position: 'relative',
            }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(0,255,209,0.4)', letterSpacing: 3, marginBottom: 10 }}>
                // TESSERACT OCR OUTPUT
              </div>
              <div style={{
                fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                color: 'rgba(255,255,255,0.65)', lineHeight: 1.8,
                fontStyle: 'italic', whiteSpace: 'pre-wrap',
                maxHeight: 180, overflowY: 'auto',
              }}>
                "{result.extracted_text?.trim() || '(no text extracted)'}"
              </div>
              <div style={{
                position: 'absolute', top: 10, right: 12,
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                color: 'rgba(0,255,209,0.25)', letterSpacing: 1,
              }}>
                {result.extracted_text?.trim().split(/\s+/).filter(Boolean).length || 0} WORDS
              </div>
            </div>

            {/* Classification */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(0,255,209,0.4)', letterSpacing: 3, marginBottom: 12 }}>
                // BERT CLASSIFICATION RESULT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* Label */}
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 12,
                  color: result.color, background: `${result.color}18`,
                  borderRadius: 2, padding: '6px 16px', letterSpacing: 2,
                  border: `1px solid ${result.color}44`, fontWeight: 700,
                }}>
                  {result.icon} {result.label}
                </span>

                {/* Confidence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>
                    CONFIDENCE: <strong style={{ color: '#FFFFFF' }}>{Math.round((result.confidence || 0) * 100)}%</strong>
                  </span>
                  <div style={{ width: 120, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.round((result.confidence || 0) * 100)}%`,
                      background: result.color, transition: 'width .6s ease',
                    }} />
                  </div>
                </div>

                {/* Severity */}
                {(() => {
                  const sc = severityColors[result.severity] || severityColors.NONE;
                  return (
                    <span style={{
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                      color: sc.text, background: sc.bg,
                      border: `1px solid ${sc.border}`,
                      borderRadius: 2, padding: '4px 12px', letterSpacing: 2,
                    }}>
                      ⬡ {result.severity}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Advice */}
            {result.advice && (
              <div style={{
                background: result.is_threat ? 'rgba(255,45,85,0.05)' : 'rgba(39,174,96,0.05)',
                borderRadius: 2, padding: '13px 16px',
                border: `1px solid ${result.is_threat ? 'rgba(255,45,85,0.2)' : 'rgba(39,174,96,0.2)'}`,
              }}>
                <span style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                  color: result.is_threat ? '#FF2D55' : '#2ECC71',
                  letterSpacing: 2, marginRight: 10,
                }}>
                  {result.is_threat ? '⚠ SAFETY ADVICE:' : '✓ STATUS:'}
                </span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                  {result.advice}
                </span>
              </div>
            )}

            {/* Analyse another */}
            <button
              className="ocr-reset-btn"
              onClick={reset}
              style={{
                marginTop: 16, padding: '8px 20px', borderRadius: 2,
                border: '1px solid rgba(0,255,209,0.15)', background: 'transparent',
                color: 'rgba(0,255,209,0.4)', fontFamily: "'Share Tech Mono',monospace",
                fontSize: 9, cursor: 'pointer', letterSpacing: 2, transition: 'all .2s',
              }}
            >
              ↩ ANALYSE ANOTHER IMAGE
            </button>
          </div>
        )}

        {/* ── How it works (footer) ────────────────────────────────── */}
        {!result && !loading && (
          <div style={{
            marginTop: 24, padding: '16px 20px',
            background: 'rgba(8,18,32,0.6)', borderRadius: 3,
            border: '1px solid rgba(0,255,209,0.06)',
          }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'rgba(0,255,209,0.3)', letterSpacing: 3, marginBottom: 10 }}>
              // HOW IT WORKS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
              {[
                ['📸', 'Upload a screenshot from any chat (WhatsApp, Telegram, Instagram…)'],
                ['🔍', 'Tesseract OCR extracts all visible text from the image'],
                ['🤖', 'BERT model classifies across 20 threat categories'],
                ['🛡️', 'Instant advice to help you stay safe online'],
              ].map(([icon, text], i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, lineHeight: 1.4 }}>{icon}</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}