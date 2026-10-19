// Development only. Start npm run dev first; screenshots are never deployed.
import { chromium } from '@playwright/test';
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']} : {});
for (const [orientation,viewport] of [['portrait',{width:820,height:1180}],['landscape',{width:1024,height:768}]]) {
  const page = await browser.newPage({viewport,serviceWorkers:'block'});
  await page.addInitScript(() => {
    localStorage.setItem('magic-egg-v1',JSON.stringify({minutes:3,sound:false,previous:null,session:null}));
    crypto.getRandomValues = values => { values.fill(0); return values; };
  });
  await page.clock.install();
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:4173/magic-egg/');
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
  const capture = name => page.screenshot({path:`docs/${name}-${orientation}.png`});
  await capture('ready');
  await page.locator('#start').click();
  const startedAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('magic-egg-v1')).session.deadline-180_000);
  for (const [stage,elapsed] of [['full',0],['half',90_000],['cracks',135_000],['final',162_000]]) {
    const advance=startedAt+elapsed-await page.evaluate(()=>Date.now());
    if (advance>0) await page.clock.fastForward(advance);
    await page.clock.runFor(400);
    // CSS/SVG transitions use the browser timeline, independently of the JS clock.
    await new Promise(resolve=>setTimeout(resolve,450));
    await capture(`countdown-${stage}`);
  }
  await page.clock.fastForward(18_000);
  await page.clock.fastForward(4000);
  await new Promise(resolve=>setTimeout(resolve,450));
  await capture('hatched');
  await page.close();
}
await browser.close();
