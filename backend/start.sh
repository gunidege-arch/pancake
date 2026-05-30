#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[start] CWD: $(pwd)"

# Start Node.js music API server in background
if command -v node &> /dev/null && [ -f music-api/index.js ]; then
  echo "[start] Launching music-api (Node.js)..."
  cd music-api && node index.js &
  cd "$SCRIPT_DIR"
else
  echo "[start] music-api skipped (no node or index.js not found)"
fi

# Start lxserver in background
if command -v node &> /dev/null && [ -f lxserver-app/lx-music-sync-server/server/index.js ]; then
  echo "[start] Launching lxserver..."
  cd lxserver-app/lx-music-sync-server && node index.js &
  cd "$SCRIPT_DIR"
else
  echo "[start] lxserver skipped (not built)"
fi

echo "[start] Directory before uvicorn: $(pwd)"
echo "[start] Launching FastAPI (Python)..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
