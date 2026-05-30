#!/bin/bash
# Do NOT use set -e — background services may fail, that's OK

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "[start] CWD: $(pwd)"
echo "[start] Files: $(ls app/main.py music-api/index.js 2>&1)"
echo "[start] Node: $(node --version 2>&1 || echo 'MISSING')"
echo "[start] Python: $(python --version 2>&1)"
echo "[start] PORT env: ${PORT:-not set}"

# Start Node.js music API server in background
if command -v node &>/dev/null && [ -f music-api/index.js ]; then
  echo "[start] Launching music-api..."
  cd music-api && node index.js &
  cd "$SCRIPT_DIR"
else
  echo "[start] music-api SKIPPED"
fi

# Start lxserver in background
if command -v node &>/dev/null && [ -f lxserver-app/lx-music-sync-server/server/index.js ]; then
  echo "[start] Launching lxserver..."
  cd lxserver-app/lx-music-sync-server && node index.js &
  cd "$SCRIPT_DIR"
else
  echo "[start] lxserver SKIPPED (file missing or no node)"
fi

echo "[start] Final CWD: $(pwd)"
echo "[start] Launching FastAPI on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
