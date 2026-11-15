import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    url, out, w = sys.argv[1], sys.argv[2], int(sys.argv[3])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':w,'height':800})
        msgs=[]; pg.on('console', lambda m: msgs.append(m.type+': '+m.text)); pg.on('pageerror', lambda e: msgs.append('ERR '+str(e)))
        await pg.goto(url, timeout=180000); 
        try: await pg.wait_for_function("document.title==='done'", timeout=120000)
        except Exception as e: print('timeout', e)
        await pg.screenshot(path=out, full_page=True)
        for m in msgs[:20]: print(m)
        await b.close()
asyncio.run(main())
