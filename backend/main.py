from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from datetime import datetime
import asyncio
import json
import os
import io

app = FastAPI(title="Sentinel AI", version="5.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LABEL MAP  —  20 classes
# =========================

label_map = {
    "LABEL_0":  "Benign",
    "LABEL_1":  "Harassment",
    "LABEL_2":  "Cyberbullying",
    "LABEL_3":  "Toxic",
    "LABEL_4":  "Phishing",
    "LABEL_5":  "Scam",
    "LABEL_6":  "HateSpeech",
    "LABEL_7":  "SexualContent",
    "LABEL_8":  "Misinformation",
    "LABEL_9":  "Radicalization",
    "LABEL_10": "Aggression",
    "LABEL_11": "Malware",
    "LABEL_12": "Defacement",
    "LABEL_13": "Offensive",
    "LABEL_14": "Spam",
    "LABEL_15": "SelfHarm",
    "LABEL_16": "Grooming",
    "LABEL_17": "FakeNews",
    "LABEL_18": "Doxxing",
    "LABEL_19": "Impersonation",
}

LABEL_META = {
    "Benign":         {"color": "#27AE60", "icon": "✅",  "severity": "NONE"},
    "Harassment":     {"color": "#C0392B", "icon": "⚠️",  "severity": "CRITICAL"},
    "Cyberbullying":  {"color": "#8E44AD", "icon": "😡",  "severity": "HIGH"},
    "Toxic":          {"color": "#E67E22", "icon": "☣️",  "severity": "HIGH"},
    "Phishing":       {"color": "#E74C3C", "icon": "🎣",  "severity": "HIGH"},
    "Scam":           {"color": "#D35400", "icon": "💰",  "severity": "HIGH"},
    "HateSpeech":     {"color": "#922B21", "icon": "🚫",  "severity": "CRITICAL"},
    "SexualContent":  {"color": "#CB4335", "icon": "🔞",  "severity": "CRITICAL"},
    "Misinformation": {"color": "#1A5276", "icon": "📰",  "severity": "MEDIUM"},
    "Radicalization": {"color": "#6E2F2F", "icon": "💣",  "severity": "CRITICAL"},
    "Aggression":     {"color": "#B7950B", "icon": "👊",  "severity": "HIGH"},
    "Malware":        {"color": "#1B2631", "icon": "🦠",  "severity": "CRITICAL"},
    "Defacement":     {"color": "#117A65", "icon": "🖥️",  "severity": "HIGH"},
    "Offensive":      {"color": "#784212", "icon": "🤬",  "severity": "MEDIUM"},
    "Spam":           {"color": "#7D6608", "icon": "📧",  "severity": "LOW"},
    "SelfHarm":       {"color": "#880E4F", "icon": "🩸",  "severity": "CRITICAL"},
    "Grooming":       {"color": "#1A237E", "icon": "🧒",  "severity": "CRITICAL"},
    "FakeNews":       {"color": "#37474F", "icon": "🗞️", "severity": "MEDIUM"},
    "Doxxing":        {"color": "#BF360C", "icon": "📍",  "severity": "HIGH"},
    "Impersonation":  {"color": "#4A148C", "icon": "🎭",  "severity": "MEDIUM"},
}

ADVICE = {
    "Benign":         "Conversation appears safe.",
    "Harassment":     "Threat detected. Report to platform and authorities.",
    "Cyberbullying":  "Block and report this user immediately.",
    "Toxic":          "Toxic content detected. Consider muting this user.",
    "Phishing":       "Do NOT click links or share OTP/password.",
    "Scam":           "Do not send money or share personal details.",
    "HateSpeech":     "Hate speech detected. Report and block this user.",
    "SexualContent":  "Explicit/sexual content detected. Report this user immediately.",
    "Misinformation": "Potential misinformation. Verify facts from trusted sources.",
    "Radicalization": "Extremist content detected. Report to authorities immediately.",
    "Aggression":     "Aggressive behavior detected. Do not engage. Report the user.",
    "Malware":        "Malicious link or file detected. Do NOT download or click.",
    "Defacement":     "Web defacement threat detected. Alert your IT/security team.",
    "Offensive":      "Offensive language detected. Report if it escalates.",
    "Spam":           "Unsolicited message detected. Mark as spam and ignore.",
    "SelfHarm":       "Self-harm content detected. Please reach out: iCall 9152987821.",
    "Grooming":       "Child grooming behavior detected. Report to law enforcement NOW.",
    "FakeNews":       "Possible fake news. Cross-check with reliable news outlets.",
    "Doxxing":        "Private info shared without consent. Report immediately.",
    "Impersonation":  "Someone may be impersonating another person. Verify identity.",
}

# =========================
# THRESHOLDS
# =========================

BERT_CONFIDENCE_THRESHOLD = 0.65
MIN_WORD_COUNT = 3

# =========================
# BERT MODEL
# =========================

BERT_LOADED = False
classifier  = None

try:
    if os.path.exists("./sentinel_model"):
        classifier = pipeline(
            "text-classification",
            model="./sentinel_model",
            tokenizer="./sentinel_model",
        )
        BERT_LOADED = True
        print("✅ BERT model loaded (20-class)")
except Exception as e:
    print(f"⚠️  BERT loading failed: {e}")

# =========================
# RULE-BASED PATTERNS
# Extended with many more phrases for better coverage
# =========================

PATTERNS = {
    # ── Sexual Content ─────────────────────────────────────────────────────
    "SexualContent": [
        # explicit wants/requests
        "i want to sex", "want to have sex", "i want sex", "let's have sex",
        "wanna have sex", "want to fuck", "wanna fuck", "i want to fuck",
        "let's fuck", "sleep with me", "come to bed", "want to sleep with you",
        "i want to make love", "show me your body", "take off your clothes",
        "i want your body", "let me touch you", "touch me there",
        # nudes / explicit media
        "send nudes", "send nude", "send me nudes", "send a nude",
        "explicit photo", "naked picture", "send naked", "send your pic",
        "send me a pic", "video call naked", "strip for me",
        # sexual harassment phrases
        "sexual favor", "sexting", "sex chat", "sex call", "phone sex",
        "inappropriate image", "dirty photo", "dirty pic",
        "you're so hot", "you turn me on", "i'm horny", "make me horny",
        "sexual", "sex with you", "have sex with",
    ],

    # ── Grooming ───────────────────────────────────────────────────────────
    "Grooming": [
        "don't tell your parents", "our little secret", "keep it secret",
        "how old are you", "you're so mature for your age",
        "you're mature for your age", "act so grown up",
        "send me a photo", "send me your photo", "meet me alone",
        "i'll give you gifts", "i'll buy you gifts", "i'll give you money",
        "no one needs to know", "just between us", "don't tell anyone",
        "you're special to me", "our secret", "meet in person alone",
        "you're not like other kids",
    ],

    # ── Harassment ─────────────────────────────────────────────────────────
    "Harassment": [
        "kill you", "i know where you live", "watch your back",
        "i will hurt you", "you'll regret this", "i'm coming for you",
        "i will find you", "you can't hide", "i'll destroy you",
        "you better watch out", "i'm going to hurt you", "make you pay",
        "pay for this", "come after you",
    ],

    # ── Cyberbullying ──────────────────────────────────────────────────────
    "Cyberbullying": [
        "stupid", "idiot", "loser", "worthless",
        "nobody likes you", "go die", "you're pathetic", "kill yourself",
        "you're ugly", "you're fat", "no one likes you", "you're a loser",
        "you're stupid", "you're an idiot", "you're worthless",
        "everyone hates you", "you have no friends", "you're a freak",
        "you're disgusting",
    ],

    # ── Toxic ──────────────────────────────────────────────────────────────
    "Toxic": [
        "shut up", "you suck", "go to hell", "trash",
        "piece of garbage", "moron", "you're garbage", "piece of trash",
        "shut your mouth", "you're a joke",
    ],

    # ── Phishing ───────────────────────────────────────────────────────────
    "Phishing": [
        "verify account", "bank account", "click here", "login now",
        "otp", "confirm your details", "update your password",
        "suspicious activity on your account", "verify your identity",
        "account will be suspended", "account suspended", "your account",
        "verify your account", "confirm your account", "update payment",
        "enter your credentials", "reset your password", "pay-now",
        "limited time offer click", "claim your account",
    ],

    # ── Scam ───────────────────────────────────────────────────────────────
    "Scam": [
        "send money", "lottery", "won prize", "pay me",
        "registration fee", "claim your reward", "wire transfer", "gift card",
        "you have won", "you've won", "you won", "congratulations you won",
        "free money", "invest now", "double your money", "crypto investment",
        "bitcoin investment", "send bitcoin", "send btc",
        "advance fee", "processing fee", "transfer fee",
    ],

    # ── HateSpeech ─────────────────────────────────────────────────────────
    "HateSpeech": [
        "go back to your country", "your kind", "they are inferior",
        "ethnic cleansing", "white power", "racial hatred",
        "all muslims", "all hindus", "all christians", "all jews",
        "those people", "your race", "inferior race",
    ],

    # ── Misinformation ─────────────────────────────────────────────────────
    "Misinformation": [
        "vaccines cause", "5g causes", "the government is hiding",
        "doctors don't want you to know", "miracle cure",
        "scientists are lying", "plandemic", "fake pandemic",
        "covid is fake", "vaccine is poison", "chips in vaccine",
        "bill gates", "deep state", "illuminati controls",
    ],

    # ── Radicalization ─────────────────────────────────────────────────────
    "Radicalization": [
        "join the cause", "infidels must", "die for the movement",
        "take up arms", "violent revolution", "martyrdom", "holy war",
        "kill the infidels", "death to", "jihad", "crusade against",
    ],

    # ── Aggression ─────────────────────────────────────────────────────────
    "Aggression": [
        "i will fight you", "you want to fight", "come outside",
        "i'll smash you", "threatening you now", "i'll attack you",
        "step outside", "fight me", "come fight", "i'll beat you",
        "i'll knock you out",
    ],

    # ── Malware ────────────────────────────────────────────────────────────
    "Malware": [
        "download this exe", "run this script", "install this file",
        "free crack download", "keygen", "patch.exe", "bypass antivirus",
        "crack software", "download crack", "nulled", "warez",
        "trojan", "ransomware", "install this apk",
    ],

    # ── Defacement ─────────────────────────────────────────────────────────
    "Defacement": [
        "hacked by", "website defaced", "we own your site",
        "your server is compromised", "page defaced", "site owned",
        "r00ted", "owned by", "defaced by",
    ],

    # ── Offensive ──────────────────────────────────────────────────────────
    "Offensive": [
        "what the hell", "bloody idiot", "dumb fool",
        "absolute garbage", "disgrace", "pathetic excuse",
        "you're a disgrace", "utter garbage",
    ],

    # ── Spam ───────────────────────────────────────────────────────────────
    "Spam": [
        "buy now", "limited offer", "free trial", "unsubscribe",
        "click to win", "earn money fast", "work from home", "make $",
        "act now", "limited time", "special offer", "best price",
        "guaranteed income", "passive income", "make money online",
    ],

    # ── SelfHarm ───────────────────────────────────────────────────────────
    "SelfHarm": [
        "want to hurt myself", "end my life", "no reason to live",
        "cut myself", "suicide plan", "i want to die",
        "nobody would miss me", "overdose", "want to kill myself",
        "thinking about suicide", "end it all", "not worth living",
        "better off dead", "take my own life", "self harm",
    ],

    # ── FakeNews ───────────────────────────────────────────────────────────
    "FakeNews": [
        "breaking: scientists confirm", "mainstream media hiding",
        "exclusive truth revealed", "they don't want you to see this",
        "share before deleted", "banned documentary",
        "100% confirmed by insiders", "viral proof that",
        "media is lying", "mainstream media lies",
    ],

    # ── Doxxing ────────────────────────────────────────────────────────────
    "Doxxing": [
        "here is your address", "i found where you work",
        "posting your personal info", "your phone number is",
        "leaking your details", "exposing your location",
        "i have your id", "sharing your private",
        "i know your address", "found your home address",
        "publishing your info",
    ],

    # ── Impersonation ──────────────────────────────────────────────────────
    "Impersonation": [
        "i am the ceo", "this is your bank", "i am from microsoft",
        "acting as your doctor", "i am your teacher",
        "this is paypal", "pretending to be", "fake account",
        "i am from google", "i am from amazon", "i am from apple",
        "this is your it department", "this is support",
    ],
}

# =========================
# HELPER
# =========================

def _build_result(label: str, confidence: float, model: str) -> dict:
    meta = LABEL_META.get(label, LABEL_META["Benign"])
    return {
        "label":      label,
        "confidence": confidence,
        "is_threat":  label != "Benign",
        "severity":   meta["severity"],
        "color":      meta["color"],
        "icon":       meta["icon"],
        "advice":     ADVICE.get(label, ""),
        "model":      model,
    }

# =========================
# RULE CLASSIFIER
# Uses substring matching — catches partial phrases too
# =========================

def rule_classify(text: str):
    text_lower = text.lower()
    # Priority order: critical threats first
    priority = [
        "SexualContent", "Grooming", "SelfHarm", "Radicalization",
        "Malware", "HateSpeech", "Harassment", "Phishing", "Scam",
        "Cyberbullying", "Doxxing", "Impersonation", "FakeNews",
        "Aggression", "Misinformation", "Toxic", "Defacement",
        "Spam", "Offensive",
    ]
    for label in priority:
        keywords = PATTERNS.get(label, [])
        for kw in keywords:
            if kw in text_lower:
                return label, 0.97
    return "Benign", 0.99

# =========================
# MAIN CLASSIFIER
# =========================

def classify_message(text: str) -> dict:
    clean_text = text.split(":", 1)[1].strip() if ":" in text else text.strip()

    # Guard: too short
    if len(clean_text.split()) < MIN_WORD_COUNT:
        return _build_result("Benign", 0.99, "Guard")

    # Rule-based (runs first — always)
    rule_label, rule_conf = rule_classify(clean_text)
    if rule_label != "Benign":
        return _build_result(rule_label, rule_conf, "Rules")

    # BERT fallback
    if BERT_LOADED and classifier:
        try:
            result     = classifier(clean_text)[0]
            label      = label_map.get(result["label"], "Benign")
            confidence = round(result["score"], 2)
            if confidence < BERT_CONFIDENCE_THRESHOLD:
                return _build_result("Benign", confidence, "BERT-LowConf")
            return _build_result(label, confidence, "BERT")
        except Exception as e:
            print(f"⚠️  BERT error: {e}")

    return _build_result("Benign", 0.99, "Fallback")

# =========================
# OCR
# =========================

OCR_LOADED = False

try:
    import pytesseract
    from PIL import Image
    tesseract_path = os.getenv("TESSERACT_PATH")
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
    else:
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    OCR_LOADED = True
    print("✅ OCR ready")
except Exception as e:
    print(f"⚠️  OCR not available: {e}")

@app.post("/classify-image")
async def classify_image(file: UploadFile = File(...)):
    if not OCR_LOADED:
        return {"error": "OCR not installed."}
    from PIL import Image as PILImage
    import pytesseract
    contents = await file.read()
    image    = PILImage.open(io.BytesIO(contents))
    text     = pytesseract.image_to_string(image)
    result   = classify_message(text)
    result["extracted_text"] = text
    return result

# =========================
# REST ENDPOINTS
# =========================

class ClassifyRequest(BaseModel):
    text: str

@app.post("/classify")
def classify_endpoint(req: ClassifyRequest):
    return classify_message(req.text)

@app.get("/labels")
def get_labels():
    return {
        label: {
            "color":    meta["color"],
            "icon":     meta["icon"],
            "severity": meta["severity"],
            "advice":   ADVICE.get(label, ""),
        }
        for label, meta in LABEL_META.items()
    }

# Stats & flagged messages storage
_stats = {
    "total_messages": 0,
    "threats_detected": 0,
    "threat_breakdown": {},
    "online_users": 0,
    "active_rooms": [],
}
_flagged = []

@app.get("/stats")
def get_stats():
    return _stats

@app.get("/flagged")
def get_flagged():
    return {"flagged_messages": _flagged[-100:]}

# =========================
# CONNECTION MANAGER
# =========================

class ConnectionManager:
    def __init__(self):
        self.rooms: dict = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket, room: str):
        await ws.accept()
        async with self._lock:
            self.rooms.setdefault(room, []).append(ws)
            if room not in _stats["active_rooms"]:
                _stats["active_rooms"].append(room)
            _stats["online_users"] = sum(len(v) for v in self.rooms.values())

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            for room in self.rooms:
                if ws in self.rooms[room]:
                    self.rooms[room].remove(ws)
                    break
            _stats["online_users"] = sum(len(v) for v in self.rooms.values())

    async def broadcast(self, room: str, message: dict):
        dead = []
        for ws in self.rooms.get(room, []):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        async with self._lock:
            for ws in dead:
                if ws in self.rooms.get(room, []):
                    self.rooms[room].remove(ws)

manager = ConnectionManager()

# =========================
# WEBSOCKET
# =========================

@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(websocket: WebSocket, room: str, username: str):
    await manager.connect(websocket, room)
    try:
        while True:
            data    = await websocket.receive_text()
            payload = json.loads(data)
            text    = payload["text"]
            result  = classify_message(text)

            # Update stats
            _stats["total_messages"] += 1
            if result["is_threat"]:
                _stats["threats_detected"] += 1
                lb = result["label"]
                _stats["threat_breakdown"][lb] = _stats["threat_breakdown"].get(lb, 0) + 1
                _flagged.append({
                    "username":   username,
                    "text":       text,
                    "label":      lb,
                    "confidence": result["confidence"],
                    "severity":   result["severity"],
                })

            response = {
                "type":       "message",
                "username":   username,
                "text":       text,
                "timestamp":  datetime.now().strftime("%H:%M"),
                "label":      result["label"],
                "confidence": result["confidence"],
                "is_threat":  result["is_threat"],
                "severity":   result["severity"],
                "color":      result["color"],
                "icon":       result["icon"],
            }
            await manager.broadcast(room, response)

            if result["is_threat"]:
                alert = {
                    "type":       "threat_alert",
                    "username":   username,
                    "title":      "Threat Detected",
                    "message":    f"{username} sent {result['label']} content",
                    "label":      result["label"],
                    "advice":     result["advice"],
                    "severity":   result["severity"],
                    "color":      result["color"],
                    "icon":       result["icon"],
                    "confidence": result["confidence"],
                }
                await manager.broadcast(room, alert)

    except WebSocketDisconnect:
        await manager.disconnect(websocket)

# =========================
# HEALTH
# =========================

@app.get("/")
def root():
    return {
        "status":        "Sentinel AI Running",
        "version":       "5.2.0",
        "bert_loaded":   BERT_LOADED,
        "ocr_loaded":    OCR_LOADED,
        "total_classes": len(label_map),
        "classes":       list(label_map.values()),
        "thresholds": {
            "bert_confidence": BERT_CONFIDENCE_THRESHOLD,
            "min_word_count":  MIN_WORD_COUNT,
        },
    }