import { useRef, useState } from 'react'
import { audioContext, useFrame } from '../lib/hooks.js'
import { Chapter, Gallery, Photo, Segmented, Spec } from './Parts.jsx'

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
    MODES.forEach((m) => traces.current[m.value]?.setAttribute('d', tracePath(t, m.beats)))

    if (listen && active.beats !== Infinity && shown !== lastBeat.current) click()
    lastBeat.current = shown
  })

  return (
    <div className="beatlab" ref={root}>
      <Photo slug="snowflake" alt="Grand Seiko SBGA011 Snowflake with a textured white dial and a blued seconds hand" />

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
        <Photo slug="gs-spacewalk" alt="Seiko Spring Drive Spacewalk chronograph" />
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

      <Gallery slugs={['gs-gtr50', 'gs-5r86', 'gs-sbgr051', 'gs-sbgw231', 'gs-sbgw005', 'gs-hibeat', 'calibre-9s65', 'gs-9s64']} />
    </Chapter>
  )
}
