#!/bin/bash
set -e

echo "[build] Installing Python dependencies..."
pip install -r requirements.txt

echo "[build] Installing music-api npm packages..."
cd music-api && npm install
cd ..

echo "[build] Downloading lxserver v1.9.3..."
mkdir -p lxserver-app && cd lxserver-app
wget -q -O server.zip https://github.com/xcq0607/lxserver/releases/download/v1.9.3/lx-music-sync-server-v1.9.3-server.zip
unzip -o server.zip
rm server.zip

echo "[build] Loading SixYin audio source..."
mkdir -p lx-music-sync-server/data/users/source/_open
wget -q -O lx-music-sync-server/data/users/source/_open/sixyin.js https://raw.githubusercontent.com/pdone/lx-music-source/main/sixyin/latest.js

echo "[build] Done."
