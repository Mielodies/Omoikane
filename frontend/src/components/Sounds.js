const ctx = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

export function playFlip() { playTone(800, 0.08, 'sine', 0.1); }
export function playCorrect() { playTone(523, 0.1, 'sine'); setTimeout(() => playTone(659, 0.1, 'sine'), 100); setTimeout(() => playTone(784, 0.15, 'sine'), 200); }
export function playIncorrect() { playTone(300, 0.15, 'sawtooth', 0.08); setTimeout(() => playTone(250, 0.2, 'sawtooth', 0.08), 150); }
export function playLevelUp() { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.15, 'sine'), i * 100)); }
export function playAchievement() { [784,988,1175,1319].forEach((f,i) => setTimeout(() => playTone(f, 0.12, 'triangle'), i * 80)); }
export function playChallenge() { playTone(880, 0.1, 'triangle', 0.12); setTimeout(() => playTone(1100, 0.15, 'triangle', 0.12), 100); }
