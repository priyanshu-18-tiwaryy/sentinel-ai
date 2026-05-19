import pandas as pd
from datasets import Dataset
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer
)
from sklearn.preprocessing import LabelEncoder

# =========================
# LOAD CSV FILES
# =========================

df1 = pd.read_csv("datasets/aggression_parsed_dataset.csv")
df2 = pd.read_csv("datasets/toxicity_parsed_dataset.csv")
df3 = pd.read_csv("datasets/twitter_parsed_dataset.csv")
df4 = pd.read_csv("datasets/malicious_phish.csv")

# =========================
# RENAME COLUMNS
# =========================

df1 = df1.rename(columns={
    "Text": "text",
    "oh_label": "label"
})

df2 = df2.rename(columns={
    "Text": "text",
    "oh_label": "label"
})

df3 = df3.rename(columns={
    "Text": "text",
    "oh_label": "label"
})

# =========================
# PHISHING DATASET
# =========================

df4 = df4.rename(columns={
    "url": "text"
})

df4["label"] = "Phishing"

# =========================
# KEEP REQUIRED COLUMNS
# =========================

df1 = df1[["text", "label"]]
df2 = df2[["text", "label"]]
df3 = df3[["text", "label"]]
df4 = df4[["text", "label"]]

# =========================
# MERGE DATASETS
# =========================

df = pd.concat([df1, df2, df3, df4])

# =========================
# CLEAN DATA
# =========================

df = df.dropna()

# CONVERT LABELS TO STRING
df["label"] = df["label"].astype(str)

# LIMIT DATA FOR QUICK TRAINING
df = df.sample(1000)

# =========================
# LABEL ENCODING
# =========================

encoder = LabelEncoder()

df["label_encoded"] = encoder.fit_transform(
    df["label"]
)

print("LABEL MAPPING:")
print(dict(zip(
    encoder.classes_,
    encoder.transform(encoder.classes_)
)))

# =========================
# HUGGINGFACE DATASET
# =========================

dataset = Dataset.from_pandas(
    df[["text", "label_encoded"]]
)

# =========================
# TOKENIZER
# =========================

tokenizer = BertTokenizer.from_pretrained(
    "bert-base-uncased"
)

def tokenize(batch):

    tokens = tokenizer(
        batch["text"],
        padding="max_length",
        truncation=True,
        max_length=64
    )

    tokens["labels"] = batch["label_encoded"]

    return tokens

dataset = dataset.map(tokenize)

# =========================
# TORCH FORMAT
# =========================

dataset.set_format(
    type="torch",
    columns=[
        "input_ids",
        "attention_mask",
        "labels"
    ]
)

# =========================
# TRAIN TEST SPLIT
# =========================

dataset = dataset.train_test_split(
    test_size=0.2
)

# =========================
# LOAD BERT MODEL
# =========================

model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=len(encoder.classes_)
)

# =========================
# TRAINING ARGUMENTS
# =========================

training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=1,
    per_device_train_batch_size=4,
    logging_steps=10,
    save_strategy="no"
)

# =========================
# TRAINER
# =========================

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"]
)

# =========================
# TRAIN MODEL
# =========================

trainer.train()

# =========================
# SAVE MODEL
# =========================

model.save_pretrained("./sentinel_model")

tokenizer.save_pretrained("./sentinel_model")

print("MODEL TRAINED SUCCESSFULLY")