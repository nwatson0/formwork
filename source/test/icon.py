import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':1024,'height':1024}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8767/test/icon.html'); await pg.wait_for_function("document.title==='done'")
        await pg.wait_for_timeout(300)
        await (await pg.query_selector('#w')).screenshot(path='/tmp/claude-0/icon1024.png'); await b.close()
asyncio.run(main())
