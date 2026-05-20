#!/bin/bash
echo ""
echo "=========================================="
echo "  SENTINEL AI - Starting All Services"
echo "  Group 13 | ITER, SOA University"
echo "=========================================="
echo ""

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/3] Installing Python backend dependencies..."
cd "$DIR/backend"
pip install -r requirements.txt --quiet

echo "[2/3] Starting FastAPI Backend on port 8000..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 3

echo "[3/3] Starting React Frontend on port 3000..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages (first time only)..."
    npm install
fi

npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo "  Open http://localhost:3000 in browser"
echo "  Press Ctrl+C to stop both services"
echo "=========================================="

wait $FRONTEND_PID
kill $BACKEND_PID
