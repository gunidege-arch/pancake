#!/bin/bash
set -e

# Start Node.js music API server in background
echo "[start] Launching music-api (Node.js)..."
cd music-api && node index.js &
MUSIC_PID=$!
cd ..

# Start lxserver in background
echo "[start] Launching lxserver..."
cd lxserver-app/lx-music-sync-server && node index.js &
LX_PID=$!
cd ../..

# Start Python FastAPI server
echo "[start] Launching FastAPI (Python)..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
