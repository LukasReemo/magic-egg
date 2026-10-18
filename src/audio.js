let context;
export function unlockAudio() {
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume().catch(() => {});
    // A silent source on the initiating gesture also unlocks older Safari versions.
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, context.sampleRate);
    source.connect(context.destination);
    source.start();
  } catch { /* Visual completion never depends on audio availability. */ }
}
export function playHatch() {
  if (!context || context.state !== 'running') return;
  try {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, i) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const when = context.currentTime + i * 0.16;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(0.075, when + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.65);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(when);
      oscillator.stop(when + 0.7);
    });
  } catch { /* A suspended audio device must not interrupt the reveal. */ }
}
