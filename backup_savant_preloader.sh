#!/bin/bash
set -e

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$HOME/newid/site2_backup_$STAMP"

mkdir -p "$BACKUP_DIR"

cp -f index.html "$BACKUP_DIR/index.html"
cp -f logo7-reactor.js "$BACKUP_DIR/logo7-reactor.js"

if [ -f public/assets/logo7/logo7.glb ]; then
  mkdir -p "$BACKUP_DIR/public/assets/logo7"
  cp -f public/assets/logo7/logo7.glb "$BACKUP_DIR/public/assets/logo7/logo7.glb"
fi

echo "Backup created at: $BACKUP_DIR"
