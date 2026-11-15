import os, sys
os.makedirs('dist', exist_ok=True)
t=open('template2.html').read()
js='\n'.join(open(f).read() for f in ['engine.js','moves.js','data.js','body.js','stage.js','form.js','coach.js','app2.js'])
cdn='<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>\n'
out=t.replace('<!--SCRIPTS-->', cdn+'<script>\n'+js+'\n</script>')
open('dist/formwork-trainer.html','w').write(out)
local=t.replace('<!--SCRIPTS-->','<script src="/node_modules/three/build/three.min.js"></script>\n<script>\n'+js+'\n</script>')
prev='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'+local+'</body></html>'
open('dist/preview.html','w').write(prev)
print(len(out))
