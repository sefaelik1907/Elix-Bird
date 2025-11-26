
// Simple Web Audio API Synthesizer for Arcade Sounds
// No external assets required

let audioCtx: AudioContext | null = null;
let isSystemMuted = false;

export const setAudioMuted = (muted: boolean) => {
  isSystemMuted = muted;
};

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const playJumpSound = () => {
  if (isSystemMuted) return;

  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
};

export const playScoreSound = () => {
  if (isSystemMuted) return;

  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
};

export const playCrashSound = () => {
  if (isSystemMuted) return;

  const ctx = initAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  // Cartoon "Fart" / "Bırtt" Sound
  osc.type = 'sawtooth';
  
  // Start low, go lower rapidly with some wobble
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
  osc.frequency.linearRampToValueAtTime(20, ctx.currentTime + 0.3);

  // Envelope
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.05); // Attack
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3); // Decay

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};
