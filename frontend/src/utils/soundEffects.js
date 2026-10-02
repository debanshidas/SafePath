// Web Audio API Sound Generator for SOS Siren and Fake Call Ringtone
// Self-contained: does not depend on any external audio files.

let audioCtx = null;
let activeSirenInterval = null;
let activeRingtoneInterval = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Emergency Siren Sound
export function playSiren() {
  stopSiren();
  const ctx = getAudioContext();
  if (!ctx) return;

  let highPitch = false;

  const playTone = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(highPitch ? 960 : 640, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
      highPitch = !highPitch;
    } catch {
      // Audio autoplay policy fallback
    }
  };

  playTone();
  activeSirenInterval = setInterval(playTone, 380);
}

export function stopSiren() {
  if (activeSirenInterval) {
    clearInterval(activeSirenInterval);
    activeSirenInterval = null;
  }
}

// Telephone Ringtone Sound for Fake Call
export function playRingtone() {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const ringBurst = () => {
    try {
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.8);
      });
    } catch {
      // Audio policy
    }
  };

  ringBurst();
  activeRingtoneInterval = setInterval(ringBurst, 3500);
}

export function stopRingtone() {
  if (activeRingtoneInterval) {
    clearInterval(activeRingtoneInterval);
    activeRingtoneInterval = null;
  }
}

// Gentle Check-in confirmation chime
export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.45);
    });
  } catch {
    // Audio policy
  }
}
