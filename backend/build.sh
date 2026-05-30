#!/bin/bash
set -e

echo "[build] CWD: $(pwd)"
echo "[build] Node: $(node --version 2>&1 || echo 'NOT FOUND')"
echo "[build] Python: $(python --version 2>&1)"

echo "[build] Installing Python dependencies..."
pip install -r requirements.txt

echo "[build] Installing music-api npm packages..."
cd music-api && npm install
cd ..

echo "[build] Downloading lxserver v1.9.3 (26MB)..."
mkdir -p lxserver-app && cd lxserver-app
if wget -nv -O server.zip https://github.com/xcq0607/lxserver/releases/download/v1.9.3/lx-music-sync-server-v1.9.3-server.zip; then
  echo "[build] Extracting..."
  unzip -o server.zip
  rm server.zip
  echo "[build] lxserver entry: $(ls lx-music-sync-server/server/index.js 2>&1)"
  echo "[build] Loading SixYin audio source..."
  mkdir -p lx-music-sync-server/data/users/source/_open
  wget -nv -O lx-music-sync-server/data/users/source/_open/sixyin.js https://raw.githubusercontent.com/pdone/lx-music-source/main/sixyin/latest.js || echo "[build] SixYin download failed, skipping"
  echo "[build] SixYin: $(wc -c < lx-music-sync-server/data/users/source/_open/sixyin.js 2>&1 || echo 'missing') bytes"
else
  echo "[build] lxserver download FAILED — will skip at runtime"
fi
cd ..

echo "[build] Done."
