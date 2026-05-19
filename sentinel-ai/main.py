from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
from transformers import pipeline
import json

app = FastAPI()

# LOAD TRAINED MODEL
classifier = pipeline(
    "text-classification",
    model="./sentinel_model",
    tokenizer="./sentinel_model"
)

label_map = {
    "LABEL_0": "Benign",
    "LABEL_1": "Harassment",
    "LABEL_2": "Cyberbullying",
    "LABEL_3": "Toxic",
    "LABEL_4": "Phishing"
}

# =========================
# REST API
# =========================

class Message(BaseModel):
    text: str

@app.post("/classify")
def classify(msg: Message):

    clean_text = msg.text

    if ":" in clean_text:
        clean_text = clean_text.split(":", 1)[1]

    result = classifier(
        clean_text.strip()
    )[0]

    label = label_map.get(
        result["label"],
        result["label"]
    )

    return {
        "label": label,
        "confidence": round(result["score"], 2),
        "is_threat": label != "LABEL_0",
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

            # CLEAN USERNAME
            clean_text = text

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

            is_threat = label != "Benign"

            response = {
                "type": "message",
                "username": username,
                "text": text,
                "label": label,
                "confidence": confidence,
                "is_threat": is_threat,
                "severity": "HIGH" if is_threat else "NONE",
                "icon": "⚠️" if is_threat else "✅",
                "timestamp": "Now"
            }

            for client in clients:
                await client.send_json(response)

    except:
        clients.remove(websocket)