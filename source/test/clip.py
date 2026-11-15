import sys, asyncio, json
from playwright.async_api import async_playwright
async def main():
    qs = sys.argv[1] if len(sys.argv) > 1 else ''
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(); pg.on('pageerror', lambda e: print('PAGEERR', e))
        await pg.goto('http://127.0.0.1:8767/test/clip.html?' + qs, timeout=600000)
        await pg.wait_for_function("document.title==='done'", timeout=600000)
        r = await pg.evaluate('window.__clip')
        print(len(r), 'flagged')
        for x in r: print(json.dumps(x))
        await b.close()
asyncio.run(main())
