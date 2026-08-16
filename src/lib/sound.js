class SoundEngine {
  constructor() {
    this.ctx = null
    this.enabled = true
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      this.ctx = new Ctx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  setEnabled(value) {
    this.enabled = value
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.18, at = 0, glideTo = null }) {
    const ctx = this.ensure()
    if (!ctx || !this.enabled) return
    const t0 = ctx.currentTime + at
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (glideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(glideTo, 1), t0 + dur)
    }
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  click() {
    this.tone({ freq: 620, dur: 0.06, type: 'square', gain: 0.08 })
  }

  tick(speed = 1) {
    this.tone({ freq: 1150 + (1 - speed) * 700 + Math.random() * 220, dur: 0.03, type: 'square', gain: 0.05 })
  }

  spin() {
    const ctx = this.ensure()
    if (!ctx || !this.enabled) return
    const t0 = ctx.currentTime
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.9, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2)
    }
    const src = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const g = ctx.createGain()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(220, t0)
    filter.frequency.exponentialRampToValueAtTime(2600, t0 + 0.85)
    filter.Q.value = 1.2
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9)
    src.buffer = buffer
    src.connect(filter)
    filter.connect(g)
    g.connect(ctx.destination)
    src.start(t0)
  }

  reveal() {
    this.tone({ freq: 523.25, dur: 0.16, type: 'triangle', gain: 0.14, glideTo: 659.25 })
    this.tone({ freq: 783.99, dur: 0.22, type: 'triangle', gain: 0.12, at: 0.06 })
    this.tone({ freq: 1046.5, dur: 0.3, type: 'sine', gain: 0.1, at: 0.14 })
  }

  whoosh() {
    this.tone({ freq: 320, dur: 0.22, type: 'sawtooth', gain: 0.06, glideTo: 960 })
  }
}

export const sound = new SoundEngine()
