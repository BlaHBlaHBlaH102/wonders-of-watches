import { useRef, useState } from 'react'
import { audioContext, useFrame } from '../lib/hooks.js'
import { Chapter, Photo, Segmented, Spec, Ticks } from './Parts.jsx'

const MODES = [
  { value: 'quartz', label: 'Quartz', beats: 1, note: 'One step a second. A battery pulses a stepper motor, and the hand stops to wait.' },
  { value: 'mech', label: '28,800 vph', beats: 8, note: 'Eight steps a second: a modern mechanical watch. Smooth from afar, a staircase up close.' },
  { value: 'hibeat', label: 'Hi-Beat', beats: 10, note: 'Ten steps a second at 36,000 vibrations an hour: Grand Seiko’s fast-beating mechanical movement.' },
  { value: 'spring', label: 'Spring Drive', beats: Infinity, note: 'No steps at all. Nothing in the train ever stops, so the hand glides, silently.' },
]
const SPEEDS = [
  { value: 1, label: 'Real time' },
  { value: 0.25, label: '¼ speed' },
  { value: 0.0625, label: '1/16' },
]
const WINDOW = 2 // seconds of hand travel shown on the graph

const stepped = (t, beats) => (beats === Infinity ? t : Math.floor(t * beats) / beats)

function tracePath(end, beats) {
  const start = end - WINDOW
  const x = (t) => ((t - start) / WINDOW) * 600
  const y = (t) => 150 - ((t - start) / WINDOW) * 140
  if (beats === Infinity) return `M0 ${y(start)} L600 ${y(end)}`
  let d = `M0 ${y(stepped(start, beats)).toFixed(1)}`
  for (let k = Math.ceil(start * beats); k / beats <= end; k += 1) {
    const t = k / beats
    d += ` L${x(t).toFixed(1)} ${y(t - 1 / beats).toFixed(1)} L${x(t).toFixed(1)} ${y(t).toFixed(1)}`
  }
  return `${d} L600 ${y(stepped(end, beats)).toFixed(1)}`
}

function click() {
  const ctx = audioContext()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 3400
  gain.gain.setValueAtTime(0.05, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.012)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.014)
}

function BeatLab() {
  const root = useRef(null)
  const hourHand = useRef(null)
  const minuteHand = useRef(null)
  const secondHand = useRef(null)
  const traces = useRef({})
  const clock = useRef(null)
  const [mode, setMode] = useState('spring')
  const [speed, setSpeed] = useState(0.25)
  const [listen, setListen] = useState(false)
  const lastBeat = useRef(0)
  const active = MODES.find((m) => m.value === mode)

  useFrame(root, (_, dt) => {
    if (clock.current === null) {
      const d = new Date()
      clock.current = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000
    }
    clock.current += dt * speed
    const t = clock.current
    const shown = stepped(t, active.beats)
    secondHand.current.setAttribute('transform', `rotate(${shown * 6} 200 200)`)
    minuteHand.current.setAttribute('transform', `rotate(${(t / 60) * 6} 200 200)`)
    hourHand.current.setAttribute('transform', `rotate(${(t / 3600) * 30} 200 200)`)
    MODES.forEach((m) => traces.current[m.value]?.setAttribute('d', tracePath(t, m.beats)))

    if (listen && active.beats !== Infinity && shown !== lastBeat.current) click()
    lastBeat.current = shown
  })

  return (
    <div className="beatlab" ref={root}>
      <div className="snow-watch">
        <svg className="snow-dial" viewBox="0 0 400 400" aria-hidden="true">
          <defs>
            <filter id="snow" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="4" seed="8" />
              <feDiffuseLighting surfaceScale="2.6" diffuseConstant="1.04" lightingColor="#f1f5f8">
                <feDistantLight azimuth="225" elevation="56" />
              </feDiffuseLighting>
            </filter>
            <clipPath id="snowClip"><circle cx="200" cy="200" r="172" /></clipPath>
            <linearGradient id="gsCase" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbfbfa" /><stop offset=".5" stopColor="#8b8f93" /><stop offset=".62" stopColor="#e4e6e8" /><stop offset="1" stopColor="#666a6e" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="194" fill="url(#gsCase)" />
          <circle cx="200" cy="200" r="176" fill="#aab1b7" />
          <g clipPath="url(#snowClip)"><rect x="20" y="20" width="360" height="360" filter="url(#snow)" /></g>
        </svg>
        <svg className="snow-hands" viewBox="0 0 400 400" role="img" aria-label={`Seconds hand moving as a ${active.label} movement`}>
          <g color="#50565c">
            <Ticks r={168} length={6} width={0.8} skip={5} />
            <Ticks r={168} length={23} width={4} count={12} />
          </g>
          <text x="200" y="118" textAnchor="middle" className="dial-script" fill="#3d4349">Wonders</text>
          <text x="200" y="298" textAnchor="middle" className="dial-caps" fill="#3d4349">{active.beats === Infinity ? 'GLIDE' : `${active.beats} BEAT${active.beats > 1 ? 'S' : ''} / S`}</text>
          <g ref={hourHand}><path d="M195 218 L196 106 L200 98 L204 106 L205 218Z" fill="#454b52" /></g>
          <g ref={minuteHand}><path d="M197 222 L197.5 52 L200 44 L202.5 52 L203 222Z" fill="#454b52" /></g>
          <g ref={secondHand}>
            <path d="M199.2 250 L199.6 38 L200.4 38 L200.8 250Z" fill="#1e50a2" />
            <circle cx="200" cy="200" r="5" fill="#1e50a2" />
          </g>
        </svg>
      </div>

      <div className="beat-controls">
        <div className="control-label">Movement</div>
        <Segmented label="Movement" options={MODES} value={mode} onChange={setMode} />
        <p className="beat-note">{active.note}</p>

        <svg className="trace" viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true">
          {MODES.map((m) => (
            <path key={m.value} ref={(el) => { traces.current[m.value] = el }} fill="none" vectorEffect="non-scaling-stroke" className={m.value === mode ? 'trace-on' : 'trace-off'} />
          ))}
        </svg>
        <div className="trace-axis"><span>Two seconds ago</span><span>Hand position</span><span>Now</span></div>

        <div className="control-row">
          <div>
            <div className="control-label">Time</div>
            <Segmented label="Playback speed" options={SPEEDS} value={speed} onChange={setSpeed} />
          </div>
          <button type="button" className={`pill ${listen ? 'on' : ''}`} aria-pressed={listen} onClick={() => { audioContext(); setListen(!listen) }}>
            {listen ? 'Sound on' : 'Listen'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GlideWheel() {
  const root = useRef(null)
  const wheel = useRef(null)
  const brake = useRef(null)
  const readout = useRef(null)
  const sim = useRef({ w: 8, angle: 0 })

  useFrame(root, (_, dt) => {
    const s = sim.current
    // The mainspring always pushes slightly too hard; the brake only ever slows.
    const brakeForce = Math.max(0, (s.w - 7.9) * 3.4)
    s.w = Math.max(0, s.w + (0.34 - brakeForce) * dt)
    s.angle = (s.angle + s.w * 360 * dt * 0.045) % 360 // slowed so the eye can follow
    wheel.current.setAttribute('transform', `rotate(${s.angle} 150 150)`)
    brake.current.style.opacity = Math.min(1, brakeForce / 5 + 0.1)
    readout.current.textContent = s.w.toFixed(2)
  })

  return (
    <div className="glide" ref={root}>
      <svg viewBox="0 0 300 300" className="glide-svg" role="img" aria-label="Diagram of the glide wheel spinning inside its brake coils">
        <circle ref={brake} cx="150" cy="150" r="136" fill="none" stroke="#1e50a2" strokeWidth="16" opacity=".1" />
        <circle cx="150" cy="150" r="124" fill="none" stroke="currentColor" strokeWidth=".6" />
        <g ref={wheel}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path key={a} d="M150 150 L128 52 A100 100 0 0 1 172 52Z" fill="#c9cfd4" stroke="#50565c" strokeWidth=".7" transform={`rotate(${a} 150 150)`} />
          ))}
          <circle cx="150" cy="150" r="24" fill="#f4f6f7" stroke="#50565c" strokeWidth=".8" />
        </g>
      </svg>
      <div className="glide-copy">
        <div className="spec-value"><span ref={readout}>8.00</span><small> rev/s</small></div>
        <p>The <em>glide wheel</em> replaces the escapement. The mainspring turns it, it generates a whisper of current, and a 32,768&nbsp;Hz quartz circuit compares the two and brakes it with a magnetic field. Knock it off speed and watch the coils catch it.</p>
        <button type="button" className="pill" onClick={() => { sim.current.w += 3.2 }}>Jolt the wrist</button>
        <p className="fineprint">Drawn slowed down, with the response exaggerated. The real wheel makes eight full turns every second.</p>
      </div>
    </div>
  )
}

export default function SpringDrive() {
  return (
    <Chapter id="springdrive" theme="t-snow" number="01" kicker="Grand Seiko · Movement">
      <div className="split split-title">
        <h2 className="title-gs">The second hand that <em>forgot</em> how to tick</h2>
        <p className="lede">
          Every mechanical watch lives by stopping. An escapement halts the gears several times a second, and that stutter is the tick. In 1977 a Seiko engineer named Yoshikazu Akahane asked what would happen if the gears simply never stopped.
        </p>
      </div>

      <BeatLab />

      <div className="split photo-split">
        <Photo slug="snowflake" alt="Grand Seiko SBGA011 Snowflake with a textured white dial and a blued seconds hand" />
        <div className="prose">
          <h3 className="sub-gs">Twenty-two years, six hundred prototypes</h3>
          <p>Spring Drive is powered like a mechanical watch and governed like a quartz one, and it belongs entirely to neither camp. Akahane’s idea reached the shops in December 1999, and the first Grand Seiko version arrived in 2004.</p>
          <p>The Snowflake’s dial is its other famous trick: a texture of wind-blown snow, which the sweeping blue hand crosses without a single pause.</p>
          <div className="specs">
            <Spec label="Glide wheel" value="8" small=" rev/s" />
            <Spec label="Calibre 9R65" value="±1" small=" s/day" />
            <Spec label="Power reserve" value="72" small=" h" />
          </div>
        </div>
      </div>

      <GlideWheel />
    </Chapter>
  )
}
