#!/bin/bash
echo "============================================="
echo "  Sentinel AI — Backend Starting..."
echo "============================================="
pip install -r requirements.txt --quiet
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
