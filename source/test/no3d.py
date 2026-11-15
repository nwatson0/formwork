import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8767/dist/preview_no3d.html'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='/tmp/claude-0/no3d_a.png')
        await pg.evaluate("window.__fw.openSheet('back-squat')"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='/tmp/claude-0/no3d_b.png')
        print('errors', errs); await b.close()
asyncio.run(main())
