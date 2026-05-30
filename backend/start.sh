#!/bin/bash
set -e

# Start Node.js music API server in background
echo "[start] Launching music-api (Node.js)..."
cd music-api && node index.js &
MUSIC_PID=$!

# Start Python FastAPI server
echo "[start] Launching FastAPI (Python)..."
cd ..
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
