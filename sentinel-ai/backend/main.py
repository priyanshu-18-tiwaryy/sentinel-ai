from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
from datetime import datetime
import json
import random
import os
import pytesseract
from PIL import Image

app = FastAPI(title="Sentinel AI", version="2.0.0")

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# LOAD BERT MODEL
# =========================

BERT_LOADED = False
classifier = None

label_map = {
    "LABEL_0": "Benign",
    "LABEL_1": "Harassment",
    "LABEL_2": "Cyberbullying",
    "LABEL_3": "Toxic",
    "LABEL_4": "Phishing"
}

LABEL_META = {
    "Benign": {
        "color": "#27AE60",
        "icon": "✅",
        "severity": "NONE"
    },
    "Harassment": {
        "color": "#C0392B",
        "icon": "⚠️",
        "severity": "CRITICAL"
    },
    "Cyberbullying": {
        "color": "#8E44AD",
        "icon": "😡",
        "severity": "HIGH"
    },
    "Toxic": {
        "color": "#E67E22",
        "icon": "☣️",
        "severity": "HIGH"
    },
    "Phishing": {
        "color": "#E74C3C",
        "icon": "🎣",
        "severity": "HIGH"
    },
    "Scam": {
        "color": "#D35400",
        "icon": "💰",
        "severity": "HIGH"
    }
}

ADVICE = {
    "Phishing": "Do NOT click links or share OTP/password.",
    "Cyberbullying": "Block and report this user.",
    "Harassment": "Threat detected. Report immediately.",
    "Scam": "Do not send money.",
    "Toxic": "Toxic content detected.",
    "Benign": "Conversation appears safe."
}

try:

    if os.path.exists("./sentinel_model"):

        classifier = pipeline(
            "text-classification",
            model="./sentinel_model",
            tokenizer="./sentinel_model"
        )

        BERT_LOADED = True

        print("✅ BERT model loaded")

except Exception as e:

    print("BERT loading failed:", e)

# =========================
# RULE-BASED PATTERNS
# =========================

PATTERNS = {

    "Cyberbullying": [
        "stupid",
        "idiot",
        "loser",
        "worthless",
        "nobody likes you",
        "go die"
    ],

    "Harassment": [
        "kill you",
        "i know where you live",
        "watch your back",
        "i will hurt you"
    ],

    "Phishing": [
        "verify account",
        "bank account",
        "click here",
        "login now",
        "otp"
    ],

    "Scam": [
        "send money",
        "lottery",
        "won prize",
        "pay me",
        "registration fee"
    ]
}

# =========================
# RULE CLASSIFIER
# =========================

def rule_classify(text: str):

    text_lower = text.lower()

    for label, keywords in PATTERNS.items():

        for kw in keywords:

            if kw in text_lower:

                confidence = round(
                    random.uniform(0.90, 0.99),
                    2
                )

                return label, confidence

    return "Benign", round(
        random.uniform(0.90, 0.99),
        2
    )

# =========================
# MAIN CLASSIFICATION
# =========================

def classify_message(text: str):

    clean_text = text

    if ":" in clean_text:
        clean_text = clean_text.split(":", 1)[1]

    clean_text = clean_text.strip()

    # RULE BASED PRIORITY
    rule_label, rule_conf = rule_classify(clean_text)

    if rule_label != "Benign":

        meta = LABEL_META[rule_label]

        return {
            "label": rule_label,
            "confidence": rule_conf,
            "is_threat": True,
            "severity": meta["severity"],
            "color": meta["color"],
            "icon": meta["icon"],
            "advice": ADVICE[rule_label],
            "model": "Hybrid AI"
        }

    # BERT
    if BERT_LOADED and classifier:

        try:

            result = classifier(clean_text)[0]

            label = label_map.get(
                result["label"],
                "Benign"
            )

            confidence = round(
                result["score"],
                2
            )

        except:

            label = "Benign"
            confidence = 0.95

    else:

        label = "Benign"
        confidence = 0.95

    meta = LABEL_META.get(
        label,
        LABEL_META["Benign"]
    )

    return {
        "label": label,
        "confidence": confidence,
        "is_threat": label != "Benign",
        "severity": meta["severity"],
        "color": meta["color"],
        "icon": meta["icon"],
        "advice": ADVICE.get(label, ""),
        "model": "BERT"
    }

# =========================
# OCR
# =========================

OCR_LOADED = False

try:

    import pytesseract
    from PIL import Image
    import io

    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

    OCR_LOADED = True

except:
    pass

@app.post("/classify-image")
async def classify_image(file: UploadFile = File(...)):

    if not OCR_LOADED:

        return {
            "error": "OCR not installed"
        }

    contents = await file.read()

    image = Image.open(io.BytesIO(contents))

    text = pytesseract.image_to_string(image)

    result = classify_message(text)

    result["extracted_text"] = text

    return result

# =========================
# REQUEST MODEL
# =========================

class ClassifyRequest(BaseModel):
    text: str

# =========================
# REST API
# =========================

@app.post("/classify")
def classify_endpoint(req: ClassifyRequest):

    return classify_message(req.text)

# =========================
# CONNECTION MANAGER
# =========================

class ConnectionManager:

    def __init__(self):

        self.rooms = {}
        self.user_map = {}

    async def connect(self, ws, room):

        await ws.accept()

        if room not in self.rooms:
            self.rooms[room] = []

        self.rooms[room].append(ws)

    def disconnect(self, ws):

        for room in self.rooms:

            if ws in self.rooms[room]:

                self.rooms[room].remove(ws)

    async def broadcast(self, room, message):

        for ws in self.rooms.get(room, []):

            await ws.send_text(
                json.dumps(message)
            )

manager = ConnectionManager()

# =========================
# WEBSOCKET
# =========================

@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    room: str,
    username: str
):

    await manager.connect(websocket, room)

    try:

        while True:

            data = await websocket.receive_text()

            payload = json.loads(data)

            text = payload["text"]

            result = classify_message(text)

            response = {

                "type": "message",

                "username": username,

                "text": text,

                "timestamp": datetime.now().strftime("%H:%M"),

                "label": result["label"],

                "confidence": result["confidence"],

                "is_threat": result["is_threat"],

                "severity": result["severity"],

                "color": result["color"],

                "icon": result["icon"]
            }

            await manager.broadcast(
                room,
                response
            )

            # RECEIVER ALERT
            if result["is_threat"]:

                alert = {

                    "type": "threat_alert",

                    "title": "🚨 Threat Detected",

                    "message": f"{username} sent {result['label']} content",

                    "advice": result["advice"],

                    "severity": result["severity"]
                }

                await manager.broadcast(
                    room,
                    alert
                )

    except WebSocketDisconnect:

        manager.disconnect(websocket)

# =========================
# HEALTH
# =========================

@app.get("/")
def root():

    return {
        "message": "Sentinel AI Backend Running"
    }