#!/bin/bash
set -e
echo "[build] Python: $(python --version 2>&1)"
echo "[build] Node: $(node --version 2>&1 || echo 'MISSING')"

echo "[build] Installing Python dependencies..."
pip install -r requirements.txt

echo "[build] Downloading lxserver v1.9.3 (26MB)..."
mkdir -p lxserver-app && cd lxserver-app
if wget -nv -O server.zip https://github.com/xcq0607/lxserver/releases/download/v1.9.3/lx-music-sync-server-v1.9.3-server.zip; then
  echo "[build] Extracting..."
  unzip -o server.zip >/dev/null
  rm server.zip
  echo "[build] lxserver entry: $(ls lx-music-sync-server/server/index.js 2>&1)"
  echo "[build] lxserver player: $(ls lx-music-sync-server/public/music/index.html 2>&1)"
else
  echo "[build] lxserver download FAILED"
fi
cd ..

echo "[build] Done."
