type SoundType = "success" | "notification" | "warning" | "click" | "celebration";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playSound(type: SoundType) {
  try {
    switch (type) {
      case "success": {
        playTone(523, 0.12, "sine", 0.12);
        setTimeout(() => playTone(659, 0.12, "sine", 0.12), 80);
        setTimeout(() => playTone(784, 0.2, "sine", 0.14), 160);
        break;
      }
      case "notification": {
        playTone(880, 0.08, "sine", 0.1);
        setTimeout(() => playTone(880, 0.08, "sine", 0.1), 120);
        break;
      }
      case "warning": {
        playTone(220, 0.3, "triangle", 0.12);
        break;
      }
      case "click": {
        playTone(600, 0.04, "square", 0.05);
        break;
      }
      case "celebration": {
        playTone(523, 0.12, "sine", 0.12);
        setTimeout(() => playTone(659, 0.1, "sine", 0.12), 100);
        setTimeout(() => playTone(784, 0.1, "sine", 0.13), 200);
        setTimeout(() => playTone(1047, 0.25, "sine", 0.15), 320);
        break;
      }
    }
  } catch {
    // Silently fail — audio not supported or blocked
  }
}
