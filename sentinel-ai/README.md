# 🛡️ Sentinel AI
## Transformer-Based Real-Time Intelligent Conversation Safety Platform

**Group 13 | Dept. of CSE | ITER, SOA University, Bhubaneswar**
**Supervisor: Dr. MD. Shabab Anwar**
**FYP Review | 2024–2025**

---

## 📋 Project Overview

Sentinel AI is a real-time multi-user chat platform powered by a fine-tuned BERT model that automatically detects and classifies cybercrime content — including phishing, cyberbullying, scams, harassment, stalking, grooming, spam, fraud, and impersonation — in real-time during live conversations.

### 🎯 10 Cybercrime Categories Detected
1. Phishing
2. Scam
3. Harassment
4. Cyberbullying
5. Online Job Fraud
6. Cyber Stalking
7. Cyber Grooming
8. Spamming
9. Impersonation & Identity Theft
10. Benign (Safe)

---

## 🚀 How to Run (Step-by-Step)

### Prerequisites
- **Python 3.8+** → https://www.python.org/downloads/
- **Node.js 16+** → https://nodejs.org/

### ▶️ Windows — Double click to start:
```
START_PROJECT.bat
```

### ▶️ Mac/Linux:
```bash
chmod +x start_project.sh
./start_project.sh
```

### ▶️ Manual start:

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm start
```

Then open **http://localhost:3000**

---

## 🏗️ Architecture

```
React.js (Frontend)
    ↕ WebSocket (real-time)
FastAPI Backend (Python)
    ↕ HTTP
Fine-tuned BERT Classifier
    ↕ 
PostgreSQL (Audit Logs)
```

---

## 🧠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, WebSocket |
| Backend | FastAPI (Python) |
| AI Model | Fine-tuned BERT (bert-base-uncased) |
| OCR | Tesseract OCR (pytesseract) |
| Database | PostgreSQL |
| Training | PyTorch, HuggingFace Transformers |

---

## 📊 Model Performance

| Metric | Score |
|--------|-------|
| Validation Accuracy | 99.96% |
| Macro Precision | 1.00 |
| Macro Recall | 1.00 |
| Macro F1-Score | 1.00 |

---

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/classify` | POST | Classify a message |
| `/stats` | GET | Get threat statistics |
| `/flagged` | GET | Get flagged messages log |
| `/health` | GET | Health check |
| `/ws/{room}/{username}` | WS | WebSocket chat connection |

---

## 📄 Reference Paper

**CyGuardNLP: Chat Log Analysis for Cybercrime Detection**
Yashaswini N & Dr. S Vidhya
IJRASET, Volume 13, Issue XI, November 2025
DOI: 10.22214/ijraset.2025.75573 | Impact Factor: 7.538

---

## 🔮 Future Work

- Phase 3: Multilingual detection (mBERT for Hindi/Odia)
- Phase 4: Docker + Cloud deployment, Mobile app
- Advanced OCR for better image moderation
- Conversation-level sequential threat analysis

---

*Sentinel AI — Protecting Digital Conversations with Artificial Intelligence*
