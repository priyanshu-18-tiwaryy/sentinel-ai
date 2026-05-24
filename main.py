from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from transformers import pipeline
import json

app = FastAPI()

# =========================
# LOAD TRAINED MODEL
# =========================

classifier = pipeline(
    "text-classification",
    model="./sentinel_model",
    tokenizer="./sentinel_model"
)

# =========================
# LABEL MAP
# =========================

label_map = {

    "LABEL_0": "Benign",
    "LABEL_1": "Harassment",
    "LABEL_2": "Cyberbullying",
    "LABEL_3": "Toxic",
    "LABEL_4": "Phishing",
    "LABEL_5": "Spam",
    "LABEL_6": "Fake News",
    "LABEL_7": "Suicide Risk",
    "LABEL_8": "Aggression"

}

# =========================
# THREAT CLASSES
# =========================

threat_labels = [
    "Harassment",
    "Cyberbullying",
    "Toxic",
    "Phishing",
    "Spam",
    "Fake News",
    "Suicide Risk",
    "Aggression"
]

# =========================
# REST API
# =========================

class Message(BaseModel):
    text: str


@app.post("/classify")
def classify(msg: Message):

    clean_text = msg.text

    # REMOVE USERNAME
    if ":" in clean_text:
        clean_text = clean_text.split(":", 1)[1]

    # MODEL PREDICTION
    result = classifier(
        clean_text.strip()
    )[0]

    label = label_map.get(
        result["label"],
        result["label"]
    )

    confidence = round(
        result["score"],
        2
    )

    is_threat = label in threat_labels

    # SEVERITY
    if confidence >= 0.95:
        severity = "HIGH"
    elif confidence >= 0.75:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    # ACTION
    if is_threat:
        action = "BLOCK USER"
    else:
        action = "SAFE"

    return {
        "label": label,
        "confidence": confidence,
        "is_threat": is_threat,
        "severity": severity,
        "recommended_action": action
    }

# =========================
# WEBSOCKET CHAT
# =========================

clients = []


@app.websocket("/ws/{room}/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    room: str,
    username: str
):

    await websocket.accept()

    clients.append(websocket)

    try:

        while True:

            data = await websocket.receive_text()

            data = json.loads(data)

            text = data["text"]

            clean_text = text

            # REMOVE USERNAME
            if ":" in clean_text:
                clean_text = clean_text.split(":", 1)[1]

            # AI PREDICTION
            result = classifier(
                clean_text.strip()
            )[0]

            label = label_map.get(
                result["label"],
                result["label"]
            )

            confidence = round(
                result["score"],
                2
            )

            is_threat = label in threat_labels

            # SEVERITY
            if confidence >= 0.95:
                severity = "HIGH"
            elif confidence >= 0.75:
                severity = "MEDIUM"
            else:
                severity = "LOW"

            # ICON
            if is_threat:
                icon = "⚠️"
            else:
                icon = "✅"

            response = {
                "type": "message",
                "room": room,
                "username": username,
                "text": text,
                "label": label,
                "confidence": confidence,
                "is_threat": is_threat,
                "severity": severity,
                "icon": icon,
                "timestamp": "Now"
            }

            # SEND TO ALL CLIENTS
            for client in clients:
                await client.send_json(response)

    except:

        if websocket in clients:
            clients.remove(websocket)