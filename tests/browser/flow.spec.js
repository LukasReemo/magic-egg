import { test, expect } from '@playwright/test';
const key = 'magic-egg-v1';
const saved = {minutes:3,sound:false,previous:null,session:null};
async function seed(page, state) {
  await page.addInitScript(({key,state}) => localStorage.setItem(key,JSON.stringify(state)), {key,state});
}
async function cached(page) {
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active?.state !== 'activated') await new Promise(resolve => registration.active.addEventListener('statechange',resolve,{once:true}));
  });
}
test('duration boundaries, preferences, cancellation and a pristine egg', async ({page}) => {
  await page.goto('./');
  await expect(page.locator('#minutes')).toHaveText('3');
  for (let i=0;i<7;i++) await page.locator('#plus').click();
  await expect(page.locator('#minutes')).toHaveText('10');
  await expect(page.locator('#plus')).toBeDisabled();
  for (let i=0;i<9;i++) await page.locator('#minus').click();
  await expect(page.locator('#minute-word')).toHaveText('minuta');
  await expect(page.locator('#minus')).toBeDisabled();
  await page.locator('#plus').click();
  await page.reload();
  await expect(page.locator('#minutes')).toHaveText('2');
  await page.locator('#sound').click();
  await page.locator('#start').click();
  await expect(page.locator('#time')).toHaveText('02:00');
  await expect(page.locator('#animal')).toBeHidden();
  await page.locator('.egg').click({force:true});
  await expect(page.locator('#app')).toHaveAttribute('data-state','countdown');
  await page.locator('#cancel').click();
  await expect(page.locator('#app')).toHaveAttribute('data-state','ready');
  await page.reload();
  await expect(page.locator('#minutes')).toHaveText('2');
  await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','false');
});
test('deadline completes once, reveal survives reload, Hotovo resets', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await page.locator('#sound').click();
  await page.locator('#start').click();
  await page.clock.fastForward(170_000);
  await expect(page.locator('#time')).toHaveText('00:10');
  await expect(page.locator('#scene')).toHaveClass(/imminent/);
  await page.clock.fastForward(10_000);
  await expect(page.locator('#scene')).toHaveClass(/hatching/);
  await expect(page.locator('#animal-name')).not.toBeVisible();
  await page.clock.fastForward(4000);
  await expect(page.locator('#app')).toHaveAttribute('data-state','hatched');
  const name = await page.locator('#animal-name').textContent();
  await expect(page.locator('#animal')).toBeVisible();
  await page.reload();
  await expect(page.locator('#animal-name')).toHaveText(name);
  await page.locator('#done').click();
  await expect(page.locator('#app')).toHaveAttribute('data-state','ready');
  await expect(page.locator('#scene')).not.toHaveClass(/hatched|hatching/);
  await expect(page.locator('#animal')).toBeHidden();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).session, key)).toBeNull();
});
test('expired timer restores to one stable animal after reopening', async ({page}) => {
  await seed(page,{...saved,previous:'dog',session:{status:'countdown',minutes:3,deadline:Date.now()-5000}});
  await page.goto('./');
  await expect(page.locator('#done')).toBeVisible();
  const animal = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).session.animal,key);
  expect(animal).not.toBe('dog');
  await page.locator('#done').click();
  await expect(page.locator('#start')).toBeVisible();
});
test('offline reload includes all thirty artworks and an expired reveal', async ({page,context}) => {
  await page.goto('./'); await cached(page);
  await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify({...saved,session:{status:'countdown',minutes:1,deadline:Date.now()-1}})),{key,saved});
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#done')).toBeVisible();
  const allAssets = await page.evaluate(async () => {
    const {animals} = await import('./src/animals.js');
    return Promise.all(animals.map(async animal => {
      const response = await fetch(animal.asset); return response.ok && (await response.text()).includes('<svg');
    }));
  });
  expect(allAssets).toEqual(Array(30).fill(true));
  await page.locator('#done').click();
  await expect(page.locator('#start')).toBeVisible();
});
test('viewport fits, SVG images decode, reduced motion still reveals', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await seed(page,{...saved,session:{status:'countdown',minutes:1,deadline:Date.now()-1}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#done')).toBeVisible();
  const bounds = await page.locator('#done').boundingBox();
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  expect(await page.locator('#animal').evaluate(image=>image.complete && image.naturalWidth>0)).toBeTruthy();
  expect(errors).toEqual([]);
});

test('smooth progress and cumulative cracking follow the deadline through resume and reload', async ({page}) => {
  await page.clock.install();
  await page.goto('./');
  await page.locator('#sound').click(); await page.locator('#start').click();
  const arc=page.locator('#progress-arc'), scene=page.locator('#scene');
  expect(Number(await arc.evaluate(el=>el.style.strokeDashoffset))).toBeLessThan(.002);
  await expect(scene).toHaveAttribute('data-crack-stage','1');
  await page.clock.fastForward(89_000);
  await expect(scene).toHaveAttribute('data-crack-stage','1');
  await page.clock.fastForward(1000);
  await expect(scene).toHaveAttribute('data-crack-stage','2');
  expect(Number(await arc.evaluate(el=>el.style.strokeDashoffset))).toBeCloseTo(.5,2);
  await page.clock.runFor(100);
  const before=Number(await arc.evaluate(el=>el.style.strokeDashoffset));
  await page.clock.runFor(50);
  expect(Number(await arc.evaluate(el=>el.style.strokeDashoffset))).toBeGreaterThan(before);
  await page.clock.fastForward(44_850);
  await expect(scene).toHaveAttribute('data-crack-stage','3');
  await page.clock.fastForward(27_000);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await expect(scene).toHaveAttribute('data-crack-stage','4');
  const deadline=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).session.deadline,key);
  await page.reload();
  await expect(scene).toHaveAttribute('data-crack-stage','4');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).session.deadline,key)).toBe(deadline);
  for (const stage of [2,3,4]) await expect(page.locator(`.crack-stage-${stage}`)).toHaveCSS('opacity','1');
  await page.clock.fastForward(18_000);
  await expect(arc).toHaveCSS('visibility','hidden');
  await expect(scene).toHaveAttribute('data-crack-stage','4');
  await page.clock.fastForward(4000);
  await expect(page.locator('#progress-ring')).toHaveCSS('opacity','0');
  const animal=await page.locator('#animal-name').textContent();
  await page.evaluate(()=>{for(let i=0;i<3;i++)document.dispatchEvent(new Event('visibilitychange'));});
  await expect(page.locator('#animal-name')).toHaveText(animal);
});

test('animated shell stays within the ring at each stage and viewport', async ({page}) => {
  await page.clock.install(); await page.goto('./');
  await page.locator('#sound').click(); await page.locator('#start').click();
  for (const elapsed of [0,90_000,45_000,27_000]) {
    if(elapsed) await page.clock.fastForward(elapsed);
    // Sample the curved shell at multiple points in every rocking cycle.
    for(let sample=0;sample<12;sample++) {
      await page.clock.runFor(100);
      const fit=await page.evaluate(()=>{
        const ring=document.querySelector('#progress-ring').getBoundingClientRect();
        const svg=document.querySelector('.egg');
        const matrix=svg.getScreenCTM();
        // Sample the real curved artwork outline in SVG coordinates.
        const path=document.querySelector('#eggSurface > path');
        const length=path.getTotalLength(); let clearance=Infinity;
        const radius=ring.width*(174-4.5)/360;
        for(let i=0;i<=160;i++) {
          const p=path.getPointAtLength(length*i/160);
          const point=new DOMPoint(p.x,p.y).matrixTransform(matrix);
          clearance=Math.min(clearance,radius-Math.hypot(point.x-ring.x-ring.width/2,point.y-ring.y-ring.height/2));
        }
        return {clearance,inside:ring.x>=0 && ring.right<=innerWidth && ring.y>=0,overflow:document.documentElement.scrollWidth>innerWidth};
      });
      expect(fit.clearance).toBeGreaterThan(10);
      expect(fit.inside).toBe(true); expect(fit.overflow).toBe(false);
    }
  }
});

test('mute, Hotovo and audio failure leave no queued sound and never block the reveal', async ({page}) => {
  await page.clock.install();
  await page.addInitScript(()=>{
    window.audioSources=[];
    const Original=window.AudioContext||window.webkitAudioContext;
    window.AudioContext=class extends Original {
      createOscillator(){const s=super.createOscillator();window.audioSources.push(s);return s;}
    };
  });
  await page.goto('./');
  await page.locator('#sound').click(); await page.locator('#start').click();
  await page.clock.fastForward(184_000);
  await expect(page.locator('#done')).toBeVisible();
  expect(await page.evaluate(()=>window.audioSources.length)).toBe(0);
  await page.locator('#done').click(); await page.locator('#sound').click();
  // Force an unavailable audio device after the gesture unlock.
  await page.evaluate(()=>{AudioContext.prototype.createGain=()=>{throw Error('Audio unavailable');};});
  await page.locator('#start').click(); await page.clock.fastForward(184_000);
  await expect(page.locator('#done')).toBeVisible();
  await page.locator('#done').click(); await expect(page.locator('#start')).toBeVisible();
});

test('Hotovo and mute stop real audio orchestration, including queued animal playback', async ({page}) => {
  await page.clock.install();
  await page.addInitScript(()=>{
    window.voices=[];
    const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
    const node=()=>({connect(){return this;},disconnect(){},gain:param(),frequency:param()});
    const source=()=>{const s={...node(),start(){},stop(at){if(at===undefined)this.cancelled=true;}}; window.voices.push(s); return s;};
    window.AudioContext=class {
      state='running'; currentTime=0; sampleRate=1000; destination=node();
      createOscillator(){const s=source();s.voice=true;return s;}
      createBufferSource(){return source();}
      createGain(){return node();} createBiquadFilter(){return node();}
      createBuffer(c,n){return {getChannelData:()=>new Float32Array(n)};}
    };
  });
  await page.goto('./'); await page.locator('#start').click();
  await page.clock.fastForward(180_000); await page.clock.fastForward(3_200);
  await expect(page.locator('#done')).toBeVisible();
  expect(await page.evaluate(()=>voices.filter(s=>s.voice).length)).toBe(4);
  await page.locator('#done').click();
  expect(await page.evaluate(()=>voices.filter(s=>s.voice).every(s=>s.cancelled))).toBe(true);
  await page.evaluate(()=>voices.forEach(s=>s.onended?.()));
  expect(await page.evaluate(()=>voices.filter(s=>s.voice).length)).toBe(4);
  await page.locator('#start').click(); await page.clock.fastForward(180_000); await page.clock.fastForward(3_200);
  expect(await page.evaluate(()=>voices.filter(s=>s.voice).length)).toBe(8);
  await page.evaluate(()=>voices.filter(s=>s.voice).slice(4).forEach(s=>s.onended?.()));
  expect(await page.evaluate(()=>voices.filter(s=>s.voice).length)).toBeGreaterThan(8);
  await page.locator('#sound').click();
  expect(await page.evaluate(()=>voices.filter(s=>s.voice).slice(8).every(s=>s.cancelled))).toBe(true);
  await page.locator('#done').click();
  await expect(page.locator('#start')).toBeVisible();
});

test('ring, timer and controls fit compact and full iPad layouts', async ({page}) => {
  await page.clock.install(); await page.goto('./');
  await page.locator('#sound').click(); await page.locator('#start').click();
  for (const [width,height] of [[768,1024],[1024,768],[820,1180],[1180,820],[600,800],[390,844],[320,568]]) {
    await page.setViewportSize({width,height});
    const ring=await page.locator('#progress-ring').boundingBox();
    const time=await page.locator('#time').boundingBox();
    const cancel=await page.locator('#cancel').boundingBox();
    expect(ring.x).toBeGreaterThanOrEqual(0); expect(ring.x+ring.width).toBeLessThanOrEqual(width);
    expect(time.y).toBeGreaterThan(ring.y+ring.height);
    expect(time.y+time.height).toBeLessThanOrEqual(height);
    expect(cancel.y+cancel.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
});

test('cracks actually render in the SVG use instances at every stage', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.clock.install(); await page.goto('./');
  await page.locator('#sound').click(); await page.locator('#start').click();
  const images=[];
  for(const advance of [0,90_000,45_000,27_000]) {
    if(advance) await page.clock.fastForward(advance);
    const box=await page.locator('.egg').boundingBox();
    // Only the shell interior: the progress ring, numbers and scenery cannot
    // account for these pixel changes. This catches unstyled SVG use clones.
    images.push(await page.screenshot({clip:{x:box.x+box.width*.2,y:box.y+box.height*.38,width:box.width*.6,height:box.height*.42}}));
  }
  for(let i=1;i<images.length;i++) expect(images[i].equals(images[i-1])).toBe(false);
});
