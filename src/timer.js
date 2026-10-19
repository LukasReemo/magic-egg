export function clampMinutes(value) {
  const number = Number(value);
  return value != null && value !== '' && Number.isFinite(number)
    ? Math.max(1, Math.min(10, Math.round(number))) : 3;
}
export const minuteLabel = n => `${n} ${n === 1 ? 'minuta' : n < 5 ? 'minuty' : 'minut'}`;
export const remaining = (deadline, now = Date.now()) => Math.max(0, Math.ceil((deadline - now) / 1000));
export const formatTime = seconds => {
  const n = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};
// Rejecting the tiny partial range avoids modulo bias with cryptographic randomness.
export function randomIndex(length) {
  const limit = Math.floor(2 ** 32 / length) * length;
  const buffer = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % length;
}
export function chooseAnimal(animals, previous, pick = randomIndex) {
  const available = animals.filter(animal => animal.id !== previous);
  return available[pick(available.length)];
}

// Both visual cues use the saved wall-clock deadline, including after suspension.
export function countdownProgress(deadline, totalDurationMilliseconds, now = Date.now()) {
  const fraction = Math.max(0, Math.min(1, (deadline - now) / totalDurationMilliseconds));
  const stage = fraction <= 0.1 ? 4 : fraction <= 0.25 ? 3 : fraction <= 0.5 ? 2 : 1;
  return { fraction, stage };
}
