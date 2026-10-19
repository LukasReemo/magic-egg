import { animals } from './animals.js';
import { clampMinutes, minuteLabel, remaining, formatTime, countdownProgress } from './timer.js';
import { readState, saveState, startSession, completeSession, resetSession } from './state.js';
import { unlockAudio, playReveal, stopAudio, prepareRecording } from './audio.js';
import { confetti } from './celebration.js';
const $ = id => document.getElementById(id);
let storage;
try { storage = window.localStorage; } catch { /* Private browsing can block access. */ }
const state = readState(storage);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let frame, interval, revealTimeout, celebrationTimeout, wakeLock, wakeRequest = 0;
function persist() { $('storage-note').hidden = saveState(storage, state); }
function updatePreferences() {
  $('minutes').textContent = state.minutes;
  $('minute-word').textContent = minuteLabel(state.minutes).split(' ')[1];
  $('minus').disabled = state.minutes === 1;
  $('plus').disabled = state.minutes === 10;
  $('sound').setAttribute('aria-pressed', String(state.sound));
  $('sound').setAttribute('aria-label', state.sound ? 'Vypnout zvuk' : 'Zapnout zvuk');
  $('sound-label').textContent = state.sound ? 'Zvuk zapnutý' : 'Zvuk vypnutý';
}
function screen(mode, focus = false) {
  $('app').dataset.state = mode;
  for (const key of ['ready', 'countdown', 'hatched']) $(key + '-controls').hidden = key !== mode;
  const titles = { ready: ['CHVILKA ČEKÁNÍ, KOUSEK KOUZLA', 'Kouzelné vajíčko', 'Za jak dlouho se vajíčko vylíhne?'], countdown: ['KOUZLO POTŘEBUJE CHVILKU', 'Copak se asi vylíhne?', 'Počkejme spolu na překvapení.'], hatched: ['A UŽ JE NA SVĚTĚ', 'Ahoj, malé zvířátko!', 'Tak tohle bylo naše malé kouzlo.'] };
  [$('eyebrow').textContent, $('heading').textContent, $('message').textContent] = titles[mode];
  if (focus) $(mode === 'ready' ? 'start' : mode === 'hatched' ? 'done' : 'cancel').focus({ preventScroll: true });
}
async function acquireWakeLock() {
  if (!('wakeLock' in navigator) || document.hidden || state.session?.status !== 'countdown' || wakeLock) return;
  const request = ++wakeRequest;
  try {
    const lock = await navigator.wakeLock.request('screen');
    if (request !== wakeRequest || state.session?.status !== 'countdown' || document.hidden) { await lock.release(); return; }
    wakeLock = lock;
    lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; }, { once: true });
  } catch { /* Wake Lock is best effort (battery settings and Safari support vary). */ }
}
function releaseWakeLock() {
  wakeRequest++;
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
function clearTimers() {
  cancelAnimationFrame(frame); stopAudio();
  clearInterval(interval); clearTimeout(revealTimeout); clearTimeout(celebrationTimeout);
  frame = interval = revealTimeout = celebrationTimeout = undefined;
  releaseWakeLock();
}
function prepareEgg() {
  $('scene').className = 'scene';
  $('scene').dataset.crackStage = '1';
  $('progress-arc').style.strokeDashoffset = '0';
  $('progress-arc').style.visibility = 'visible';
  $('animal').hidden = true;
  $('animal').removeAttribute('src');
  $('animal').alt = '';
  $('confetti').replaceChildren();
  $('egg-motion').setAttribute('aria-hidden', 'false');
}
function showAnimal(animal, animate) {
  // The chosen character is kept out of the accessibility tree during shell choreography.
  $('animal').src = animal.asset;
  $('animal').alt = '';
  $('animal').setAttribute('aria-hidden', 'true');
  $('animal').hidden = false;
  const finish = () => {
    $('scene').className = 'scene hatched';
    $('egg-motion').setAttribute('aria-hidden', 'true');
    $('animal').alt = animal.name;
    $('animal').removeAttribute('aria-hidden');
    $('animal-name').textContent = animal.name;
    screen('hatched', animate);
    $('announcement').textContent = `Vylíhlo se zvířátko: ${animal.name}.`;
  };
  if (!animate) { finish(); return; }
  if (state.sound) void prepareRecording(animal.id);
  $('scene').className = 'scene hatching';
  $('time').textContent = '00:00';
  $('cancel').disabled = true;
  $('message').textContent = 'Už se klube na svět…';
  const delay = reducedMotion.matches ? 150 : 3100;
  celebrationTimeout = setTimeout(() => {
    if (state.sound && !document.hidden) void playReveal(animal.id);
    confetti($('confetti'), reducedMotion.matches);
  }, reducedMotion.matches ? 150 : 2450);
  revealTimeout = setTimeout(finish, delay);
}
function tick(immediate = false) {
  if (state.session?.status !== 'countdown') return;
  const now = Date.now();
  const seconds = remaining(state.session.deadline, now);
  const { fraction, stage } = countdownProgress(state.session.deadline, state.session.minutes * 60_000, now);
  $('progress-arc').style.strokeDashoffset = String(1 - fraction);
  $('progress-arc').style.visibility = fraction === 0 ? 'hidden' : 'visible';
  const scene = $('scene');
  scene.classList.toggle('syncing-cracks', immediate);
  if (scene.dataset.crackStage !== String(stage)) scene.dataset.crackStage = String(stage);
  const label = formatTime(seconds);
  if ($('time').textContent !== label) $('time').textContent = label;
  scene.classList.toggle('anticipating', stage === 3 && seconds > 0);
  scene.classList.toggle('imminent', stage === 4 && seconds > 0);
  if (seconds > 0) return;
  const animal = completeSession(state);
  if (!animal) return;
  persist(); // Save once before any animation, including when Safari resumes late.
  clearTimers();
  showAnimal(animal, true);
}
function resumeCountdown(focus = false) {
  clearTimers(); prepareEgg();
  $('cancel').disabled = false;
  screen('countdown', focus);
  tick(true);
  if (state.session?.status === 'countdown') {
    // The interval is a lifecycle fallback; both callbacks read the same deadline.
    interval = setInterval(tick, 250);
    const draw = () => {
      if (state.session?.status !== 'countdown') return;
      tick();
      if (state.session?.status === 'countdown') frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    acquireWakeLock();
  }
}
function reset() {
  clearTimers(); resetSession(state); persist(); prepareEgg();
  $('announcement').textContent = '';
  screen('ready', true);
}
$('plus').addEventListener('click', () => { state.minutes = clampMinutes(state.minutes + 1); updatePreferences(); persist(); });
$('minus').addEventListener('click', () => { state.minutes = clampMinutes(state.minutes - 1); updatePreferences(); persist(); });
$('sound').addEventListener('click', () => { state.sound = !state.sound; if (state.sound) unlockAudio(); else stopAudio(); updatePreferences(); persist(); });
$('start').addEventListener('click', () => {
  if (state.session) return;
  if (state.sound) unlockAudio();
  startSession(state); persist(); resumeCountdown(true);
});
$('cancel').addEventListener('click', reset);
$('done').addEventListener('click', reset);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { releaseWakeLock(); stopAudio(); }
  else if (state.session?.status === 'countdown') { tick(true); acquireWakeLock(); }
});
window.addEventListener('pagehide', clearTimers);
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  if (state.session?.status === 'countdown') resumeCountdown();
  else if (state.session?.status === 'hatched') showAnimal(animals.find(a => a.id === state.session.animal), false);
});
updatePreferences();
if (state.session?.status === 'countdown') resumeCountdown();
else if (state.session?.status === 'hatched') showAnimal(animals.find(a => a.id === state.session.animal), false);
else screen('ready');
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
