import { useRef, useState } from 'react'
import { useFrame } from '../lib/hooks.js'
import { Chapter, Photo } from './Parts.jsx'

/* ---------- Tourbillon ---------- */

function Tourbillon() {
  const root = useRef(null)
  const body = useRef(null)
  const fixedLine = useRef(null)
  const tbLine = useRef(null)
  const sim = useRef({ angle: 0, t: 0, fixed: 0, tb: 0, series: [] })
  const [tilt, setTilt] = useState(90)
  const tiltRef = useRef(tilt)
  tiltRef.current = tilt

  useFrame(root, (_, dt) => {
    const s = sim.current
    const rate = 10 // time-lapse: one cage turn every six seconds
    s.t += dt * rate
    s.angle = (s.t * 6) % 360
    const rad = (tiltRef.current * Math.PI) / 180
    // Gravity pulls the balance off-centre: an error rate that depends on orientation.
    s.fixed += Math.sin(rad) * dt * rate * 0.05
    s.tb += Math.sin(rad + (s.angle * Math.PI) / 180) * dt * rate * 0.05
    s.series.push([s.fixed, s.tb])
    if (s.series.length > 400) s.series.shift()
    if (s.series.length % 2 === 0 && dt > 0) {
      const scale = Math.max(4, ...s.series.map(([a]) => Math.abs(a)))
      const path = (i) => s.series.map((p, k) => `${k ? 'L' : 'M'}${(k * 1.5).toFixed(1)} ${(80 - (p[i] / scale) * 70).toFixed(1)}`).join('')
      fixedLine.current.setAttribute('d', path(0))
      tbLine.current.setAttribute('d', path(1))
    }
    body.current.style.transform = `rotate(${tiltRef.current}deg)`
  })

  return (
    <div className="tb" ref={root}>
      <div className="tb-stage">
        <div className="tb-gravity" aria-hidden="true"><span>Gravity</span></div>
        <div className="tb-body" ref={body}>
          <img src="/images/tourbillon.webp" alt="A tourbillon cage, photographed close up" />
        </div>
      </div>

      <div className="tb-side">
        <h3 className="title-tb">A cage that spins to cancel the Earth</h3>
        <p>Pocket watches spent their lives upright in a waistcoat, with gravity tugging the balance the same way, hour after hour. Breguet’s 1801 patent mounted the whole escapement in a cage that turns about once a minute, so each error is soon undone by its opposite.</p>
        <label className="range">
          <span className="control-label">Hold the watch at {tilt}°</span>
          <input type="range" min="0" max="360" value={tilt} aria-label="Watch orientation in degrees" onChange={(e) => setTilt(Number(e.target.value))} />
        </label>
        <svg className="tb-graph" viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="80" x2="600" y2="80" className="tb-zero" vectorEffect="non-scaling-stroke" />
          <path ref={fixedLine} className="tb-fixed" fill="none" vectorEffect="non-scaling-stroke" />
          <path ref={tbLine} className="tb-cage" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="trace-axis"><span className="k-fixed">Fixed balance: drifts</span><span className="k-cage">Tourbillon: cancels out</span></div>
        <p className="fineprint">Time-lapse at ten times speed, with a simplified error model. On a moving wrist the benefit is much debated, which has never stopped anyone wanting one.</p>
      </div>
    </div>
  )
}

function Rotor() {
  return (
    <div className="rotor">
      <Photo slug="rotor" alt="Back of an automatic watch movement showing its rotor" />
      <div className="rotor-side">
        <h2 className="title-ox">Winding, <em>by living</em></h2>
        <p className="lede">Rolex sealed the watch against water with the 1926 Oyster, then had a new problem: opening the crown to wind it let the world back in. Its 1931 answer was a weight that swings on your wrist and winds the mainspring, so the crown can stay shut.</p>
      </div>
    </div>
  )
}

export default function Mechanics() {
  return (
    <>
      <Chapter id="tourbillon" theme="t-paper" number="04" kicker="Breguet · 1801">
        <Tourbillon />
        <div className="mosaic">
          <Photo slug="breguet" alt="Abraham-Louis Breguet’s hand-coloured technical drawing of the tourbillon" />
          <Photo slug="tourbillon" alt="Close-up of a tourbillon cage on a dark blue dial" />
        </div>
      </Chapter>
      <Chapter id="perpetual" theme="t-green" number="05" kicker="Rolex · 1926 and 1931">
        <Rotor />
        <div className="wide-photo"><Photo slug="rx-sub" alt="Rolex Oyster Perpetual Date Submariner" /></div>
      </Chapter>
    </>
  )
}
