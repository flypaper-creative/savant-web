#!/data/data/com.termux/files/usr/bin/bash
set -e
STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$HOME/newid/site2_backup_$STAMP"
mkdir -p "$DEST/public/assets/logo7"
cp -f index.html "$DEST/index.html"
cp -f logo7-reactor.js "$DEST/logo7-reactor.js" 2>/dev/null || true
cp -f public/assets/logo7/logo7.glb "$DEST/public/assets/logo7/logo7.glb" 2>/dev/null || true
echo "backup created at: $DEST"
