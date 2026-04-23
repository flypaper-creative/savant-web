#!/data/data/com.termux/files/usr/bin/bash
set -e
cd ~/newid/site2

python - <<'PY'
from pathlib import Path
import re, time
p = Path("index.html")
s = p.read_text()
stamp = int(time.time())
s = re.sub(r'src="\./logo7-reactor\.js\?v=[^"]+"', f'src="./logo7-reactor.js?v={stamp}"', s)
p.write_text(s)
print("cache busted:", stamp)
PY

if [ -f package.json ]; then
  npm run dev
else
  python -m http.server 3000
fi
