const AudioCtor =
  window.AudioContext ||
  (window as unknown as { webkitAudioContext: typeof window.AudioContext })
    .webkitAudioContext

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioCtor()
  // Some browsers suspend the context until a user gesture.
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  return audioCtx
}

/** Fill a buffer with white noise. */
function fillWhiteNoise(data: Float32Array, amplitude = 1) {
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * amplitude
  }
}

/**
 * Generate "crinkly" pink-ish noise: random bursts of varying amplitude that
 * sound more like crumpling paper than pure white noise.
 */
function fillCrinkleNoise(data: Float32Array, amplitude = 1) {
  let env = 0
  for (let i = 0; i < data.length; i++) {
    // Occasional micro-bursts simulate paper fibers releasing
    if (Math.random() < 0.004) env = 1
    env *= 0.985
    const sample = (Math.random() * 2 - 1) * (0.35 + 0.65 * env)
    data[i] = sample * amplitude
  }
}

/**
 * Play the user's custom page-turn MP3.
 */
export function playPageTurnSound(_direction?: 1 | -1) {
  // Create a new Audio object each time to allow overlapping rapid page turns
  const audio = new Audio('/sounds/paper_flip.mp3')
  audio.play().catch((err) => {
    console.warn('Audio play failed (maybe no user interaction yet?):', err)
  })
}

/**
 * Sound when the book is opened from the cover: a soft "thunk" + a gentle
 * paper rustle, as if a hardcover settles onto the desk.
 */
export function playBookOpenSound() {
  const ctx = getAudioContext()
  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)

  // Layer A: low thump (cover landing)
  {
    const dur = 0.32
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    fillWhiteNoise(buf.getChannelData(0))
    const src = ctx.createBufferSource()
    src.buffer = buf

    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 250
    lp.Q.value = 1.0

    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(0.13, now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

    src.connect(lp)
    lp.connect(g)
    g.connect(master)
    src.start(now)
    src.stop(now + dur)
  }

  // Layer B: paper rustle (pages settling)
  {
    const start = now + 0.05
    const dur = 0.55
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    fillCrinkleNoise(buf.getChannelData(0))
    const src = ctx.createBufferSource()
    src.buffer = buf

    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 1.4

    const g = ctx.createGain()
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(0.06, start + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur)

    src.connect(bp)
    bp.connect(g)
    g.connect(master)
    src.start(start)
    src.stop(start + dur)
  }
}
