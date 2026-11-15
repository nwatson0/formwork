import os, re, json, zipfile, hashlib
V = '3'
t = open('template2.html').read()
head, body = t.split('</style>', 1)
head = head + '</style>'
head = head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
js = '\n'.join(open(f).read() for f in ['engine.js','moves.js','data.js','body.js','stage.js','form.js','coach.js','app2.js'])
ver = hashlib.sha1(js.encode()).hexdigest()[:8]
open('site/app.js','w').write(js)
pre = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Formwork">
<meta name="theme-color" content="#000000">
<meta name="description" content="Pick muscles, tick your gear, get a workout — every exercise demonstrated by a 3D mannequin with form guides.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
'''
scripts = f'''<script src="three.min.js"></script>
<script src="app.js?v={ver}"></script>
<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {{
  window.addEventListener('load', function () {{ navigator.serviceWorker.register('sw.js').catch(function () {{}}); }});
}}
</script>'''
body = body.replace('<!--SCRIPTS-->', scripts)
html = pre + head + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n'
open('site/index.html','w').write(html)
manifest = {
  "name": "Formwork Trainer", "short_name": "Formwork",
  "description": "Pick muscles, tick your gear, get a workout with 3D form demos.",
  "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
  "background_color": "#000000", "theme_color": "#000000",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
open('site/manifest.webmanifest','w').write(json.dumps(manifest, indent=2))
sw = f'''// Offline support: keeps the app working in the gym with no signal.
const CACHE = 'formwork-{ver}';
const ASSETS = ['./', 'index.html', 'app.js?v={ver}', 'three.min.js', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
const put = (req, res) => {{ const c = res.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return res; }};
self.addEventListener('fetch', e => {{
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {{ e.respondWith(fetch(req).then(r => put('index.html', r)).catch(() => caches.match('index.html'))); return; }}
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {{
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r)).catch(() => hit)));
  }}
}});
'''
open('site/sw.js','w').write(sw)
open('site/README.txt','w').write('''Formwork Trainer — your workout app

To put it on your iPhone as a real app:
1. Host this folder on any free static web host (for example: drag this whole folder onto https://app.netlify.com/drop on a computer, then sign up free so the site is kept).
2. Open the web address you get in Safari on your iPhone.
3. Tap Share, then "Add to Home Screen".

It opens full-screen with its own icon and keeps working offline after the first visit.
''')
with zipfile.ZipFile('/home/claude/formwork-app.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir('site')):
        z.write(os.path.join('site',f), f)
print('ver', ver, 'index', len(html), 'app.js', len(js), 'zip', os.path.getsize('/home/claude/formwork-app.zip'))
