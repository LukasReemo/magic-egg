import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { animals } from '../src/animals.js';
import { clampMinutes, minuteLabel, remaining, formatTime, chooseAnimal } from '../src/timer.js';
import { freshState, restoreState, startSession, completeSession, resetSession, readState, saveState } from '../src/state.js';

test('durations are whole minutes within 1–10, defaulting to three', () => {
  for (const [input, expected] of [[-4,1],[0,1],[1,1],[2.7,3],[3.5,4],[10,10],[99,10],[undefined,3],['broken',3]]) assert.equal(clampMinutes(input), expected);
  for (let n = 1; n <= 10; n++) assert.equal(clampMinutes(n), n);
  assert.deepEqual([1,2,4,5,10].map(minuteLabel), ['1 minuta','2 minuty','4 minuty','5 minut','10 minut']);
});
test('remaining seconds use a deadline and never turn negative', () => {
  assert.equal(remaining(61_000,1000),60);
  assert.equal(remaining(61_000,1001),60);
  assert.equal(remaining(61_000,60_999),1);
  assert.equal(remaining(61_000,61_000),0);
  assert.equal(remaining(61_000,100_000),0);
});
test('MM:SS formatting includes padded values', () => {
  assert.deepEqual([0,1,59,60,180,600,-2].map(formatTime), ['00:00','00:01','00:59','01:00','03:00','10:00','00:00']);
});
test('completion is once per session, never early, and persists its animal', () => {
  const state = freshState();
  startSession(state, 1000);
  assert.equal(state.session.deadline,181_000);
  assert.equal(completeSession(state,180_999,()=>0),null);
  const animal = completeSession(state,181_000,()=>0);
  assert.equal(animal.id,'dog');
  assert.equal(completeSession(state,200_000,()=>1),null);
  assert.equal(state.session.animal,'dog');
  assert.deepEqual(restoreState(JSON.stringify(state)),state);
});
test('background and refresh restore the original deadline, including an expired countdown', () => {
  const state = freshState(); startSession(state,0);
  const restored = restoreState(JSON.stringify(state));
  assert.equal(remaining(restored.session.deadline,120_000),60);
  assert.equal(restored.session.deadline,180_000);
  assert.equal(completeSession(restored,400_000,()=>10).id,'lion');
  assert.equal(restoreState(JSON.stringify(restored)).session.animal,'lion');
});
test('Hotovo clears only the active session, retaining duration, sound and previous animal', () => {
  const state = freshState(); state.minutes = 7; state.sound = false;
  startSession(state,0); completeSession(state,420_000,()=>2); resetSession(state);
  assert.deepEqual(state,{minutes:7,sound:false,previous:'rabbit',session:null});
  startSession(state,1_000_000); assert.equal(state.session.deadline,1_420_000);
});
test('storage persists preferences and handles corrupt or inaccessible data', () => {
  let stored; const storage = { setItem:(k,v)=>{stored=v;}, getItem:()=>stored };
  const state = freshState(); state.minutes=8; state.sound=false;
  assert.equal(saveState(storage,state),true); assert.deepEqual(readState(storage),state);
  assert.deepEqual(restoreState('{bad'),freshState());
  assert.deepEqual(readState(undefined),freshState()); assert.equal(saveState(undefined,state),false);
  assert.equal(restoreState('{"session":{"status":"countdown","deadline":null}}').session,null);
  assert.equal(restoreState('{"session":{"status":"hatched","animal":"unicorn"}}').session,null);
});
test('all eligible animals have one equally likely index and no consecutive duplicate', () => {
  for (const previous of [null, ...animals.map(a=>a.id)]) {
    const count = previous ? 29 : 30; const ids = new Set();
    for (let n=0;n<count;n++) {
      const animal = chooseAnimal(animals,previous,length=>{assert.equal(length,count);return n;});
      assert.notEqual(animal.id,previous); ids.add(animal.id);
    }
    assert.equal(ids.size,count);
  }
});
test('exactly 30 unique definitions and original local SVG assets exist', async () => {
  assert.equal(animals.length,30); assert.equal(new Set(animals.map(a=>a.id)).size,30);
  assert.equal((await readdir(new URL('../assets/animals/',import.meta.url))).length,30);
  for (const animal of animals) {
    const svg = await readFile(new URL('../'+animal.asset.slice(2),import.meta.url),'utf8');
    assert.match(svg,/viewBox="0 0 400 400"/); assert.match(svg,/<title/);
    assert.ok(svg.includes(animal.name)); assert.doesNotMatch(svg,/<image/);
  }
});
test('HTML and manifest use relative paths for GitHub Pages subpath hosting', async () => {
  const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.doesNotMatch(html,/(?:src|href)=["']\//);
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.start_url,'./'); assert.equal(manifest.scope,'./');
  for (const icon of manifest.icons) await access(new URL('../'+icon.src.slice(2),import.meta.url));
  await access(new URL('../assets/apple-touch-icon.png',import.meta.url));
});
test('production cache includes all application and animal files and changes with content', async () => {
  await import('../scripts/build.mjs');
  const worker = await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
  assert.match(worker,/magic-egg-[a-f0-9]{16}/);
  for (const animal of animals) assert.ok(worker.includes(animal.asset));
  for (const asset of ['./index.html','./src/app.js','./src/audio.js','./src/animal-sounds.js','./style.css','./manifest.webmanifest']) assert.ok(worker.includes(asset));
  assert.ok(worker.includes('self.registration.scope'));
  assert.ok(!worker.includes('skipWaiting()'));
});

import { countdownProgress } from '../src/timer.js';
import { animalSounds } from '../src/animal-sounds.js';
import { createAudioPlayer } from '../src/audio.js';
test('visual progress clamps the deadline fraction and changes cracks at exact boundaries', () => {
  const duration = 60_000;
  for (const [elapsed, fraction, stage] of [[-100,1,1],[0,1,1],[29999,30001/60000,1],[30000,.5,2],[44999,15001/60000,2],[45000,.25,3],[53999,6001/60000,3],[54000,.1,4],[59999,1/60000,4],[60000,0,4],[90000,0,4]]) {
    assert.deepEqual(countdownProgress(duration,duration,elapsed),{fraction,stage});
  }
  const state = freshState(); startSession(state,0);
  const restored = restoreState(JSON.stringify(state));
  assert.deepEqual(countdownProgress(restored.session.deadline,180_000,162_000),{fraction:.1,stage:4});
});
test('all thirty animal IDs have distinct, bounded, locally synthesized voices', () => {
  assert.deepEqual(Object.keys(animalSounds).sort(),animals.map(a=>a.id).sort());
  assert.equal(new Set(Object.values(animalSounds).map(JSON.stringify)).size,30);
  for (const notes of Object.values(animalSounds)) {
    const duration = Math.max(...notes.map(n=>n.at+n.duration));
    assert.ok(duration>=.5 && duration<=2);
    for (const n of notes) {
      assert.ok(n.level<=.075 && n.level>0);
      assert.ok(n.pitches.length>=2 && n.pitches.every(p=>p>0 && p<4000));
    }
  }
});
function fakeAudio() {
  const sources = [];
  const param = () => ({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node = () => ({connect(){return this;},disconnect(){},gain:param(),frequency:param()});
  const source = () => {
    const s = {...node(),start(at){this.startAt=at;},stop(at){if(at===undefined)this.cancelled=true;else this.endAt=at;},end(){this.onended?.();}};
    sources.push(s); return s;
  };
  return {sources,context:{state:'running',currentTime:0,sampleRate:1000,destination:node(),createOscillator:source,createGain:node,createBiquadFilter:node,createBufferSource:source,createBuffer:(channels,length)=>({getChannelData:()=>new Float32Array(length)})}};
}
test('animal playback waits for every celebration source to actually finish', async () => {
  const {sources,context} = fakeAudio(); const player=createAudioPlayer(()=>context);
  const run=player.reveal('dog');
  assert.equal(sources.length,4);
  sources[3].end(); sources[0].end(); sources[1].end();
  await Promise.resolve(); assert.equal(sources.length,4);
  context.currentTime=2; sources[2].end(); await Promise.resolve();
  assert.ok(sources.length>4); assert.ok(sources.slice(4).every(s=>s.startAt>=2));
  for (const s of sources.slice(4)) s.end(); await run;
});
test('cancellation drops pending animal calls and stops active voices', async () => {
  for (const duringAnimal of [false,true]) {
    const {sources,context}=fakeAudio(); const player=createAudioPlayer(()=>context);
    const run=player.reveal('cat');
    if (duringAnimal) { sources.slice().forEach(s=>s.end()); await Promise.resolve(); }
    const count=sources.length; player.stop();
    assert.ok(sources.slice(duringAnimal?4:0).every(s=>s.cancelled));
    sources.slice().forEach(s=>s.end()); await run;
    assert.equal(sources.length,count);
  }
});
test('unavailable, suspended and failing audio settles without blocking visuals', async () => {
  for (const context of [undefined,{state:'suspended'},{state:'running',createGain(){throw Error('no device');}}]) {
    await createAudioPlayer(()=>context).reveal('dog');
  }
});
