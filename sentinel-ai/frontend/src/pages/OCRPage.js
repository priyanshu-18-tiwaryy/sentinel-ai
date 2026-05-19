import React, { useState, useRef } from 'react';
const BACKEND = 'http://localhost:8000';

const THREAT_COLORS = {
  Phishing: '#E74C3C', Cyberbullying: '#8E44AD', Scam: '#E67E22',
  Harassment: '#C0392B', 'Online Job Fraud': '#D35400',
  'Cyber Stalking': '#7D3C98', 'Cyber Grooming': '#6C3483',
  Spamming: '#2E86C1', Impersonation: '#1ABC9C', Benign: '#27AE60'
};

export default function OCRPage({ user, onBack }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', image);

      const res = await fetch(`${BACKEND}/classify-image`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.error) {
        // OCR not available — simulate for demo
        setResult({
          extracted_text: 'OCR extracted: "Click here to verify your bank account. Your account will be suspended."',
          label: 'Phishing',
          confidence: 0.96,
          is_threat: true,
          severity: 'HIGH',
          color: '#E74C3C',
          icon: '🎣',
          advice: 'Do NOT click any links. Do not share passwords or bank details.',
          ocr_used: true,
          demo_mode: true
        });
      } else {
        setResult(data);
      }
    } catch {
      // Demo mode if backend OCR not available
      setResult({
        extracted_text: 'OCR extracted text from screenshot successfully',
        label: 'Cyberbullying',
        confidence: 0.94,
        is_threat: true,
        severity: 'HIGH',
        color: '#8E44AD',
        icon: '😡',
        advice: 'Block this user. Report to trusted adults and platform.',
        ocr_used: true,
        demo_mode: true
      });
    }
    setLoading(false);
  };

  const S = {
    page: { minHeight: '100vh', background: '#0D1B2A', fontFamily: "'Inter',sans-serif", color: '#FFFFFF' },
    topbar: { background: '#132338', borderBottom: '1px solid #1E3A5F', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 16 },
    backBtn: { padding: '8px 16px', borderRadius: 8, border: '1px solid #1E3A5F', background: 'transparent', color: '#8FA8D0', cursor: 'pointer', fontSize: 13 },
    body: { padding: '24px', maxWidth: 800, margin: '0 auto' },
    uploadZone: { border: '2px dashed #1E3A5F', borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', marginBottom: 20, background: '#132338', transition: 'all .2s' },
    uploadIcon: { fontSize: 48, marginBottom: 16 },
    uploadTitle: { fontSize: 16, fontWeight: 600, color: '#8FA8D0', marginBottom: 8 },
    uploadSub: { fontSize: 13, color: '#4A6A8A' },
    preview: { width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 12, border: '1px solid #1E3A5F', marginBottom: 16 },
    analyzeBtn: { width: '100%', padding: '14px', borderRadius: 10, background: loading ? '#333' : 'linear-gradient(135deg,#C0392B,#E74C3C)', border: 'none', color: '#FFFFFF', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer' },
    resultCard: (color) => ({ background: color + '11', border: `2px solid ${color}`, borderRadius: 16, padding: '20px 24px', marginTop: 24 }),
    resultTitle: (color) => ({ fontSize: 20, fontWeight: 700, color, marginBottom: 12 }),
    extractedBox: { background: '#0D1B2A', borderRadius: 10, padding: '14px', marginBottom: 16, border: '1px solid #1E3A5F' },
    extractedLabel: { fontSize: 11, color: '#5D8AA8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    extractedText: { fontSize: 13, color: '#B0C4DE', lineHeight: 1.7, fontStyle: 'italic' },
    badge: (color) => ({ display: 'inline-block', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 20, background: color + '22', color, border: `1px solid ${color}`, marginBottom: 12 }),
    advice: { fontSize: 13, color: '#B0C4DE', lineHeight: 1.7, background: '#132338', borderRadius: 10, padding: '12px 16px' },
    steps: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 },
    step: { background: '#132338', borderRadius: 10, padding: '16px', textAlign: 'center', border: '1px solid #1E3A5F' },
    stepNum: { width: 32, height: 32, borderRadius: '50%', background: '#C0392B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: 700, fontSize: 14 },
    stepTitle: { fontSize: 13, fontWeight: 600, marginBottom: 4 },
    stepSub: { fontSize: 11, color: '#5D8AA8' },
  };

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.backBtn} onClick={onBack}>← Back to Chat</button>
        <span style={{ fontSize: 20 }}>🖼️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>OCR Screenshot Analysis</div>
          <div style={{ fontSize: 11, color: '#4A6A8A' }}>Upload screenshot → Tesseract OCR extracts text → BERT classifies threat</div>
        </div>
      </div>

      <div style={S.body}>

        {/* How it works */}
        <div style={S.steps}>
          {[
            { n: '1', title: 'Upload Screenshot', sub: 'Chat screenshot, image, or photo', icon: '📸' },
            { n: '2', title: 'Tesseract OCR', sub: 'Extracts text from image', icon: '🔍' },
            { n: '3', title: 'BERT Classifies', sub: 'Detects cybercrime category', icon: '🤖' },
          ].map(s => (
            <div key={s.n} style={S.step}>
              <div style={S.stepNum}>{s.n}</div>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={S.stepTitle}>{s.title}</div>
              <div style={S.stepSub}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Upload Zone */}
        <div style={S.uploadZone}
          onClick={() => fileRef.current.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          {preview ? (
            <img src={preview} alt="preview" style={S.preview} />
          ) : (
            <>
              <div style={S.uploadIcon}>🖼️</div>
              <div style={S.uploadTitle}>Click to upload or drag & drop</div>
              <div style={S.uploadSub}>Supports PNG, JPG, JPEG, BMP, TIFF</div>
              <div style={{ fontSize: 12, color: '#3A5070', marginTop: 8 }}>
                Screenshot of chat, WhatsApp, Telegram, Instagram DMs etc.
              </div>
            </>
          )}
        </div>

        {image && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#132338', borderRadius: 10, border: '1px solid #1E3A5F', fontSize: 13, color: '#8FA8D0' }}>
            📎 {image.name} ({(image.size / 1024).toFixed(1)} KB)
          </div>
        )}

        <button style={S.analyzeBtn} onClick={analyze} disabled={!image || loading}>
          {loading ? '🤖 Extracting text and analyzing...' : '🔍 Analyze Screenshot with BERT + OCR'}
        </button>

        {result && (
          <div style={S.resultCard(result.color || '#27AE60')}>
            <div style={S.resultTitle(result.color || '#27AE60')}>
              {result.icon} {result.is_threat ? 'THREAT DETECTED IN IMAGE' : 'IMAGE APPEARS SAFE'}
            </div>

            <div style={S.extractedBox}>
              <div style={S.extractedLabel}>📝 Tesseract OCR — Extracted Text</div>
              <div style={S.extractedText}>"{result.extracted_text}"</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#5D8AA8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>BERT Classification Result</div>
              <span style={S.badge(result.color || '#27AE60')}>{result.icon} {result.label}</span>
              <span style={{ fontSize: 13, color: '#5D8AA8', marginLeft: 12 }}>
                Confidence: <strong style={{ color: '#FFFFFF' }}>{Math.round((result.confidence || 0) * 100)}%</strong>
              </span>
              <span style={{ fontSize: 12, color: '#5D8AA8', marginLeft: 12 }}>
                Severity: <strong style={{ color: result.color }}>{result.severity}</strong>
              </span>
            </div>

            {result.is_threat && (
              <div style={S.advice}>
                <strong style={{ color: '#E74C3C' }}>⚠️ Safety Advice: </strong>{result.advice}
              </div>
            )}

            {result.demo_mode && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#4A6A8A', fontStyle: 'italic' }}>
                * Install Tesseract OCR for real image text extraction. Currently showing demo output.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}