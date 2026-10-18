import { animals } from './animals.js';
import { clampMinutes, chooseAnimal, remaining } from './timer.js';
export const STORAGE_KEY = 'magic-egg-v1';
export const freshState = () => ({ minutes: 3, sound: true, previous: null, session: null });
export function restoreState(raw) {
  const state = freshState();
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return state;
    state.minutes = clampMinutes(saved.minutes);
    state.sound = typeof saved.sound === 'boolean' ? saved.sound : true;
    state.previous = animals.some(a => a.id === saved.previous) ? saved.previous : null;
    const s = saved.session;
    if (s?.status === 'countdown' && Number.isFinite(s.deadline) && Number.isInteger(s.minutes) && s.minutes >= 1 && s.minutes <= 10) {
      state.session = { status: 'countdown', deadline: s.deadline, minutes: s.minutes };
    } else if (s?.status === 'hatched' && animals.some(a => a.id === s.animal)) {
      state.session = { status: 'hatched', animal: s.animal };
    }
  } catch { /* Storage can be absent, blocked, or from an interrupted write. */ }
  return state;
}
export function startSession(state, now = Date.now()) {
  state.session = { status: 'countdown', minutes: state.minutes, deadline: now + state.minutes * 60_000 };
}
export function completeSession(state, now = Date.now(), pick) {
  if (state.session?.status !== 'countdown' || remaining(state.session.deadline, now) > 0) return null;
  const animal = chooseAnimal(animals, state.previous, pick);
  state.previous = animal.id;
  state.session = { status: 'hatched', animal: animal.id };
  return animal;
}
export function resetSession(state) { state.session = null; }
export function readState(storage) {
  try { return restoreState(storage.getItem(STORAGE_KEY)); } catch { return freshState(); }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}
