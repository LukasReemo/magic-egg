import { animalSounds } from './animal-sounds.js';

const decoded = new Map();
async function fetchRecording(id, context) {
  const recording = animalSounds[id];
  if (!recording || !context) return null;
  if (!decoded.has(id)) {
    const loading = (async () => {
      const response = await fetch(recording.asset);
      if (!response.ok) throw new Error('Recording unavailable');
      return context.decodeAudioData(await response.arrayBuffer());
    })();
    decoded.set(id, loading);
    loading.catch(() => { if (decoded.get(id) === loading) decoded.delete(id); });
  }
  return decoded.get(id);
}

// The jingle keeps its original four notes and envelopes. Animal voices are
// decoded local recordings: no animal oscillators, modulation or noise recipes.
export function createAudioPlayer(getContext, loadRecording = fetchRecording) {
  let generation = 0;
  const active = new Map();
  const pending = new Set();
  function stop() {
    generation++;
    for (const cancel of pending) cancel();
    pending.clear();
    for (const [source, cleanup] of active) {
      try { source.stop(); } catch { /* Already ended. */ }
      cleanup();
    }
  }
  function play(token, schedule) {
    const context = getContext();
    if (token !== generation || !context || context.state !== 'running') return Promise.resolve(false);
    return new Promise(resolve => {
      let count = 0, settled = false;
      const settle = ok => { if (!settled) { settled = true; pending.delete(cancel); resolve(ok); } };
      const cancel = () => settle(false);
      pending.add(cancel);
      const track = (source, connections, start, end) => {
        count++;
        let ended = false;
        const cleanup = () => {
          if (ended) return;
          ended = true;
          active.delete(source);
          for (const node of [source, ...connections]) node.disconnect();
          if (--count === 0) settle(token === generation);
        };
        active.set(source, cleanup);
        source.onended = cleanup;
        source.start(start);
        if (end !== undefined) source.stop(end);
      };
      try {
        schedule(context, track);
        if (count === 0) settle(true);
      } catch { stop(); settle(false); }
    });
  }
  function celebration(token) {
    return play(token, (context, track) => {
      const base = context.currentTime + .015;
      [523.25,659.25,783.99,1046.5].forEach((pitch, i) => {
        const start = base + i * .16, end = start + .7;
        const gain = context.createGain(), filter = context.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 4000;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.075, start + .035);
        gain.gain.exponentialRampToValueAtTime(.0001, end);
        filter.connect(gain).connect(context.destination);
        const source = context.createOscillator();
        source.type = 'sine'; source.frequency.setValueAtTime(pitch, start);
        source.frequency.exponentialRampToValueAtTime(pitch, end);
        source.connect(filter);
        track(source, [filter, gain], start, end);
      });
    });
  }
  function prepare(id) {
    try { return Promise.resolve(loadRecording(id, getContext())).catch(() => null); }
    catch { return Promise.resolve(null); }
  }
  async function reveal(animalId) {
    stop();
    const token = generation;
    // Fetch/decode while the jingle plays; source creation still waits for ended.
    const recording = prepare(animalId);
    if (!await celebration(token) || token !== generation) return;
    const buffer = await recording;
    if (!buffer || token !== generation || buffer.duration > 3) return;
    await play(token, (context, track) => {
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = .8;
      source.connect(gain).connect(context.destination);
      track(source, [gain], context.currentTime + .015);
    });
  }
  return { stop, reveal, prepare };
}

let context;
const player = createAudioPlayer(() => context);
export const stopAudio = () => player.stop();
export const playReveal = id => player.reveal(id);
export const prepareRecording = id => player.prepare(id);
export function unlockAudio() {
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume().catch(() => {});
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start();
  } catch { /* Visual completion never depends on audio availability. */ }
}
