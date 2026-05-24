import pandas as pd
import numpy as np
from datasets import Dataset
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from sklearn.preprocessing import LabelEncoder
from sklearn.utils import resample
from sklearn.metrics import classification_report

# =========================
# CONFIG
# =========================

SAMPLES_PER_CLASS = 2000       # FIX: was 5000 total (~250/class) → now 2000/class
MAX_LENGTH        = 128        # FIX: was 64 — too short for URLs and long messages
EPOCHS            = 3          # FIX: was 2 — extra epoch improves recall
BATCH_SIZE        = 16
OUTPUT_DIR        = "./sentinel_model"
RESULTS_DIR       = "./results"

# =========================
# LOAD DATASETS
# =========================

df1 = pd.read_csv("datasets/aggression_parsed_dataset.csv")
df2 = pd.read_csv("datasets/toxicity_parsed_dataset.csv")
df3 = pd.read_csv("datasets/twitter_parsed_dataset.csv")
df4 = pd.read_csv("datasets/malicious_phish.csv")
df5 = pd.read_csv("datasets/cyberbullying_tweets.csv")
df6 = pd.read_csv("datasets/spam.csv", encoding="latin-1")
df7 = pd.read_csv("datasets/Fake.csv")
df8 = pd.read_csv("datasets/Suicide_Detection.csv")

# =========================
# RENAME & STANDARDISE
# =========================

df1 = df1.rename(columns={"Text": "text", "oh_label": "label"})
df2 = df2.rename(columns={"Text": "text", "oh_label": "label"})
df3 = df3.rename(columns={"Text": "text", "oh_label": "label"})

# FIX NUMERIC LABELS

df1["label"] = df1["label"].replace({
    0: "Benign",
    1: "Aggression",
    "0": "Benign",
    "1": "Aggression",
    0.0: "Benign",
    1.0: "Aggression"
})

df2["label"] = df2["label"].replace({
    0: "Benign",
    1: "Toxic",
    "0": "Benign",
    "1": "Toxic",
    0.0: "Benign",
    1.0: "Toxic"
})

df3["label"] = df3["label"].replace({
    0: "Benign",
    1: "Cyberbullying",
    "0": "Benign",
    "1": "Cyberbullying",
    0.0: "Benign",
    1.0: "Cyberbullying"
})

df4 = df4.rename(columns={"url": "text"})
df4["label"] = "Phishing"

df5 = df5.rename(columns={"tweet_text": "text"})
df5["label"] = "Cyberbullying"

df6 = df6.rename(columns={"v2": "text", "v1": "label"})
df6["label"] = df6["label"].replace({"ham": "Benign", "spam": "Spam"})

# FIX: label was "Fake News" (space) — must match main.py label map exactly
df7 = df7.rename(columns={"text": "text"})
df7["label"] = "FakeNews"

# FIX: label was "Suicide Risk" — must match main.py label map exactly
df8 = df8.rename(columns={"text": "text", "class": "label"})
df8["label"] = df8["label"].replace({
    "suicide":     "SelfHarm",     # was "Suicide Risk"
    "non-suicide": "Benign",
})

# =========================
# KEEP REQUIRED COLUMNS
# =========================

dfs = [df1, df2, df3, df4, df5, df6, df7, df8]
dfs = [d[["text", "label"]] for d in dfs]

# =========================
# MERGE & CLEAN
# =========================

df = pd.concat(dfs, ignore_index=True)
df = df.dropna(subset=["text", "label"])
df["text"]  = df["text"].astype(str).str.strip()
df["label"] = df["label"].astype(str).str.strip()

# Drop empty text rows
df = df[df["text"].str.len() > 0]

print("\n📊 RAW CLASS DISTRIBUTION:")
print(df["label"].value_counts())

# =========================
# CLASS BALANCING
# FIX: oversample minority / cap majority to SAMPLES_PER_CLASS
# =========================

balanced = []
for label in df["label"].unique():
    subset = df[df["label"] == label]
    n      = min(len(subset), SAMPLES_PER_CLASS)   # don't oversample beyond actual data
    if len(subset) < SAMPLES_PER_CLASS:
        # oversample if too few
        sampled = resample(subset, n_samples=SAMPLES_PER_CLASS,
                           replace=True, random_state=42)
    else:
        sampled = subset.sample(n=SAMPLES_PER_CLASS, random_state=42)
    balanced.append(sampled)

df = pd.concat(balanced, ignore_index=True).sample(frac=1, random_state=42)

print(f"\n✅ BALANCED: {len(df)} rows across {df['label'].nunique()} classes")
print(df["label"].value_counts())

# =========================
# LABEL ENCODING
# =========================

encoder = LabelEncoder()
df["label_encoded"] = encoder.fit_transform(df["label"])

print("\n🏷️  LABEL MAPPING:")
for cls, idx in zip(encoder.classes_, encoder.transform(encoder.classes_)):
    print(f"  LABEL_{idx:02d}  →  {cls}")

# =========================
# CONVERT TO HF DATASET
# =========================

dataset = Dataset.from_pandas(df[["text", "label_encoded"]].reset_index(drop=True))

# =========================
# TOKENIZER
# FIX: max_length 64 → 128
# =========================

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

def tokenize(batch):
    tokens = tokenizer(
        batch["text"],
        padding="max_length",
        truncation=True,
        max_length=MAX_LENGTH,       # FIX: was 64
    )
    tokens["labels"] = batch["label_encoded"]
    return tokens

dataset = dataset.map(tokenize, batched=True)

dataset.set_format(
    type="torch",
    columns=["input_ids", "attention_mask", "labels"],
)

dataset = dataset.train_test_split(test_size=0.2, seed=42)

print(f"\n📦 Train: {len(dataset['train'])}  |  Test: {len(dataset['test'])}")

# =========================
# EVALUATION METRICS
# FIX: was missing — now reports per-class F1
# =========================

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds  = np.argmax(logits, axis=-1)
    report = classification_report(
        labels, preds,
        target_names=encoder.classes_,
        output_dict=True,
        zero_division=0,
    )
    print("\n📈 PER-CLASS REPORT:")
    print(classification_report(
        labels, preds,
        target_names=encoder.classes_,
        zero_division=0,
    ))
    return {
        "f1_weighted":  report["weighted avg"]["f1-score"],
        "f1_macro":     report["macro avg"]["f1-score"],
        "accuracy":     report["accuracy"],
    }

# =========================
# LOAD BERT MODEL
# =========================

model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=len(encoder.classes_),
)

# =========================
# TRAINING ARGUMENTS
# FIX: added warmup, weight decay, evaluation during training
# =========================

training_args = TrainingArguments(
    output_dir=RESULTS_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    warmup_steps=200,
    weight_decay=0.01,
    logging_steps=50,
    save_steps=500,
    save_total_limit=1,
    report_to="none",
)

# =========================
# TRAINER
# =========================

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    compute_metrics=compute_metrics,
)

# =========================
# TRAIN
# =========================

print("\n🚀 Starting training...")
trainer.train()

import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

# Loss curve
logs = trainer.state.log_history
train_loss = [x['loss'] for x in logs if 'loss' in x]
steps = [x['step'] for x in logs if 'loss' in x]

plt.figure(figsize=(10, 4))
plt.plot(steps, train_loss, color='blue')
plt.title('Training Loss Curve')
plt.xlabel('Steps')
plt.ylabel('Loss')
plt.savefig('training_loss.png')
print("✅ Saved training_loss.png")

# Confusion matrix
predictions = trainer.predict(dataset['test'])
preds = np.argmax(predictions.predictions, axis=-1)
labels = predictions.label_ids

print(classification_report(labels, preds, target_names=encoder.classes_))

cm = confusion_matrix(labels, preds)
disp = ConfusionMatrixDisplay(cm, display_labels=encoder.classes_)
fig, ax = plt.subplots(figsize=(18, 18))
disp.plot(ax=ax, xticks_rotation=45)
plt.tight_layout()
plt.savefig('confusion_matrix.png')
print("✅ Saved confusion_matrix.png")

# =========================
# SAVE
# FIX: also save label map so main.py can verify alignment
# =========================

model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

# Save label map for reference
import json, pathlib
label_map_out = {f"LABEL_{i}": cls for i, cls in enumerate(encoder.classes_)}
pathlib.Path(f"{OUTPUT_DIR}/label_map.json").write_text(
    json.dumps(label_map_out, indent=2)
)

print(f"\n✅ MODEL SAVED TO {OUTPUT_DIR}")
print(f"📄 Label map saved to {OUTPUT_DIR}/label_map.json")
print("\n⚠️  IMPORTANT: Copy the LABEL_X → ClassName mapping above")
print("   into the label_map dict in main.py to keep them in sync.")