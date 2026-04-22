#!/bin/bash

python - <<'PY'
from pathlib import Path
import re, time

p = Path("index.html")
s = p.read_text()
stamp = int(time.time())
s = re.sub(r'src="[^"]*logo7-reactor\.js[^"]*"', f'src="./logo7-reactor.js?v={stamp}"', s)
p.write_text(s)
print("cache busted:", stamp)
PY

git checkout publish-clean
git add index.html logo7-reactor.js
git commit -m "push to film-level realism" || true
git push
