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
