from pathlib import Path

p = Path("index.html")
s = p.read_text()

importmap = """<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/"
  }
}
</script>"""

if "importmap" not in s:
    s = s.replace("<head>", "<head>\n" + importmap)

p.write_text(s)
print("CDN importmap injected")
