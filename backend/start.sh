#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "[start] CWD: $(pwd)"
echo "[start] Node: $(node --version 2>&1 || echo 'MISSING')"

# Start lxserver
if command -v node &>/dev/null && [ -f lxserver-app/lx-music-sync-server/server/index.js ]; then
  echo "[start] Launching lxserver on port ${LXSERVER_PORT:-9527}..."
  cd lxserver-app/lx-music-sync-server
  PORT="${LXSERVER_PORT:-9527}" node index.js &
  cd "$SCRIPT_DIR"
  echo "[start] lxserver PID: $!"
else
  echo "[start] lxserver SKIPPED"
fi

echo "[start] Launching FastAPI on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
