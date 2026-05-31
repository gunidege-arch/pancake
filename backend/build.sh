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

  echo "[build] Setting up SixYin audio source..."
  SRC_DIR="lx-music-sync-server/data/users/source/_open"
  mkdir -p "$SRC_DIR"

  # Download SixYin script
  if wget -nv -O "$SRC_DIR/sixyin.js" https://raw.githubusercontent.com/pdone/lx-music-source/main/sixyin/latest.js; then
    SIZE=$(wc -c < "$SRC_DIR/sixyin.js")
    echo "[build] SixYin script: ${SIZE} bytes"

    # Create sources.json to register the source
    cat > "$SRC_DIR/sources.json" << 'SRCEOF'
[
  {
    "id": "sixyin.js",
    "name": "六音音源",
    "version": "1.0.0",
    "author": "SixYin",
    "description": "聚合音乐搜索音源，支持酷狗/酷我/网易/QQ/咪咕",
    "homepage": "https://github.com/pdone/lx-music-source",
    "size": SIZE_PLACEHOLDER,
    "supportedSources": ["kg","kw","tx","wy","mg"],
    "enabled": true,
    "uploadTime": "2026-05-31T00:00:00.000Z",
    "allowUnsafeVM": true,
    "requireUnsafe": false
  }
]
SRCEOF
    # Replace placeholder with actual size
    sed -i "s/SIZE_PLACEHOLDER/${SIZE}/" "$SRC_DIR/sources.json"
    echo "[build] sources.json created"
  else
    echo "[build] SixYin download FAILED"
  fi
else
  echo "[build] lxserver download FAILED"
fi
cd ..

echo "[build] Done."
