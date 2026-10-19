import { animalSounds } from './animal-sounds.js';

// Every source, including noise and modulation, belongs to one cancellable run.
// onended (the audio clock) advances the sequence, never a visual timeout.
export function createAudioPlayer(getContext) {
  let generation = 0;
  const active = new Set();
  const pending = new Set();
  function stop() {
    generation++;
    for (const cancel of pending) cancel();
    pending.clear();
    for (const source of active) { try { source.stop(); } catch { /* Already ended. */ } }
    active.clear();
  }
  function play(notes, token) {
    const context = getContext();
    if (token !== generation || !context || context.state !== 'running') return Promise.resolve(false);
    return new Promise(resolve => {
      let count = 0, settled = false;
      const settle = ok => { if (settled) return; settled = true; pending.delete(cancel); resolve(ok); };
      const cancel = () => settle(false);
      pending.add(cancel);
      const track = (source, connections, start, end) => {
        count++; active.add(source);
        source.onended = () => {
          active.delete(source);
          for (const node of [source, ...connections]) node.disconnect();
          if (--count === 0) settle(token === generation);
        };
        source.start(start); source.stop(end);
      };
      try {
        const base = context.currentTime + .015;
        for (const note of notes) {
          const start = base + note.at, end = start + note.duration;
          const gain = context.createGain(), filter = context.createBiquadFilter();
          filter.type = 'lowpass'; filter.frequency.value = note.filter;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(note.level, start + Math.min(.035, note.duration / 4));
          gain.gain.exponentialRampToValueAtTime(.0001, end);
          filter.connect(gain).connect(context.destination);
          const oscillator = context.createOscillator();
          oscillator.type = note.wave;
          note.pitches.forEach((pitch, i) => {
            const at = start + i * note.duration / (note.pitches.length - 1);
            if (i === 0) oscillator.frequency.setValueAtTime(pitch, at);
            else oscillator.frequency.exponentialRampToValueAtTime(pitch, at);
          });
          oscillator.connect(filter);
          track(oscillator, [filter, gain], start, end);
          if (note.vibrato) {
            const lfo = context.createOscillator(), depth = context.createGain();
            lfo.frequency.value = note.rate; depth.gain.value = note.vibrato;
            lfo.connect(depth).connect(oscillator.frequency);
            track(lfo, [depth], start, end);
          }
          if (note.noise) {
            const source = context.createBufferSource(), noiseGain = context.createGain();
            const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * note.duration), context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            source.buffer = buffer; noiseGain.gain.value = note.noise;
            source.connect(noiseGain).connect(filter);
            track(source, [noiseGain], start, end);
          }
        }
        if (count === 0) settle(true);
      } catch { stop(); settle(false); }
    });
  }
  async function reveal(animalId) {
    stop();
    const token = generation;
    const jingle = [523.25,659.25,783.99,1046.5].map((pitch,i) => ({ at:i*.16, duration:.7, pitches:[pitch,pitch], wave:'sine', level:.075, filter:4000 }));
    if (await play(jingle, token) && token === generation && animalSounds[animalId]) {
      await play(animalSounds[animalId], token);
    }
  }
  return { stop, reveal };
}

let context;
const player = createAudioPlayer(() => context);
export const stopAudio = () => player.stop();
export const playReveal = id => player.reveal(id);
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
