#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "[start] CWD: $(pwd)"
echo "[start] Node: $(node --version 2>&1 || echo 'MISSING')"

# Start Node.js music API server
if command -v node &>/dev/null && [ -f music-api/index.js ]; then
  echo "[start] Launching music-api..."
  cd music-api && node index.js &
  cd "$SCRIPT_DIR"
fi

echo "[start] Launching FastAPI on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
