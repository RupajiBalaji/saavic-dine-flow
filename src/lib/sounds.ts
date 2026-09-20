/**
 * Audio Synthesizer for Saavic Healthy Café Staff & Kitchen
 * Built on Web Audio API - no external file downloads needed, zero latency.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn("Could not initialize audio context:", err);
    return null;
  }
}

// Auto-unlock audio on first click or touch anywhere on the page
if (typeof window !== "undefined") {
  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
    } catch {}
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("saavic:sound-enabled") !== "false";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("saavic:sound-enabled", enabled ? "true" : "false");
}

let lastTingTime = 0;
let lastChimeTime = 0;

/**
 * 1. "TING" SOUND (Counter Service Bell)
 * Played when a new order is received at Kitchen & Manager
 * Dual-harmonic metallic bell chime with fast strike and sweet decay
 */
export function playNewOrderTing(): void {
  if (!isSoundEnabled()) return;
  const nowMs = Date.now();
  if (nowMs - lastTingTime < 1500) return; // Prevent duplicate overlapping triggers
  lastTingTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primary bell tone (1318.5 Hz - E6)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1318.51, now);

  // Harmonic bell overtone (2637 Hz - E7)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(2637.02, now);

  // Metallic shimmer overtone (3136 Hz - G7)
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = "triangle";
  osc3.frequency.setValueAtTime(3135.96, now);

  // Master output
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.3, now);
  master.connect(ctx.destination);

  // Envelope for osc1: strike and ring
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(0.7, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

  // Envelope for osc2: high sparkle ring
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(0.35, now + 0.005);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  // Envelope for osc3: instant crisp strike
  gain3.gain.setValueAtTime(0, now);
  gain3.gain.linearRampToValueAtTime(0.15, now + 0.002);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc1.connect(gain1);
  gain1.connect(master);

  osc2.connect(gain2);
  gain2.connect(master);

  osc3.connect(gain3);
  gain3.connect(master);

  osc1.start(now);
  osc2.start(now);
  osc3.start(now);

  osc1.stop(now + 0.9);
  osc2.stop(now + 0.9);
  osc3.stop(now + 0.9);
}

/**
 * 2. "ORDER READY TO SERVE" CHIME (Dining Bell Chime)
 * Played to Manager indicating food is prepared and ready to serve
 * Three-tone ascending hotel/dining bell: C5 -> E5 -> G5
 */
export function playOrderReadyChime(): void {
  if (!isSoundEnabled()) return;
  const nowMs = Date.now();
  if (nowMs - lastChimeTime < 1500) return; // Prevent duplicate overlapping triggers
  lastChimeTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.5 },  // C5
    { freq: 659.25, time: 0.16, dur: 0.5 }, // E5
    { freq: 783.99, time: 0.32, dur: 0.8 }, // G5
  ];

  notes.forEach(({ freq, time, dur }) => {
    const t = now + time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    // Warm harmonics
    const oscHarmonic = ctx.createOscillator();
    const gainHarmonic = ctx.createGain();
    oscHarmonic.type = "triangle";
    oscHarmonic.frequency.setValueAtTime(freq * 2, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    gainHarmonic.gain.setValueAtTime(0, t);
    gainHarmonic.gain.linearRampToValueAtTime(0.12, t + 0.01);
    gainHarmonic.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    oscHarmonic.connect(gainHarmonic);
    gainHarmonic.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + dur);

    oscHarmonic.start(t);
    oscHarmonic.stop(t + dur);
  });
}
