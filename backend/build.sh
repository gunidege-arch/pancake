#!/bin/bash
set -e
echo "[build] Python: $(python --version 2>&1)"
echo "[build] Node: $(node --version 2>&1 || echo 'MISSING')"
echo "[build] Installing Python dependencies..."
pip install -r requirements.txt
echo "[build] Installing music-api npm packages..."
cd music-api && npm install
echo "[build] Done."
