import { useRef, useState } from 'react'
import { clockAngles, useFrame } from '../lib/hooks.js'
import { Chapter, Photo, Ticks } from './Parts.jsx'

/* ---------- Tourbillon ---------- */

function Tourbillon() {
  const root = useRef(null)
  const cage = useRef(null)
  const balance = useRef(null)
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
    cage.current.setAttribute('transform', `rotate(${s.angle} 200 200)`)
    balance.current.setAttribute('transform', `rotate(${Math.sin(s.t * 3) * 140} 200 200)`)
    body.current.style.transform = `rotate(${tiltRef.current}deg)`
  })

  return (
    <div className="tb" ref={root}>
      <div className="tb-stage">
        <div className="tb-gravity" aria-hidden="true"><span>Gravity</span></div>
        <div className="tb-body" ref={body}>
          <svg viewBox="0 0 400 400" role="img" aria-label="A tourbillon cage rotating inside a watch">
            <circle cx="200" cy="200" r="194" fill="#f4e8c2" stroke="#6b5526" strokeWidth="1.4" />
            <circle cx="200" cy="200" r="186" fill="none" stroke="#6b5526" strokeWidth=".6" />
            <g color="#6b5526"><Ticks r={184} length={12} count={12} width={1.6} /><Ticks r={184} length={5} width={.5} /></g>
            <circle cx="200" cy="200" r="120" fill="#20221f" />
            <g ref={cage}>
              <g stroke="#d8ae57" strokeWidth="8" fill="none">
                <circle cx="200" cy="200" r="108" strokeWidth="5" />
                <path d="M200 92 V168 M106 254 L172 216 M294 254 L228 216" />
              </g>
              <circle cx="200" cy="92" r="7" fill="#b73f51" />
              <circle cx="106" cy="254" r="7" fill="#b73f51" />
              <circle cx="294" cy="254" r="7" fill="#b73f51" />
              <g ref={balance}>
                <circle cx="200" cy="200" r="66" fill="none" stroke="#f3e5bb" strokeWidth="6" />
                <path d="M134 200 H266" stroke="#f3e5bb" strokeWidth="4" />
                <path d="M200 200 m-34 0 a34 34 0 1 1 68 0 a28 28 0 1 1 -56 0 a22 22 0 1 1 44 0" fill="none" stroke="#8ab3d8" strokeWidth=".9" />
              </g>
              <circle cx="200" cy="200" r="8" fill="#b73f51" />
            </g>
            <path d="M200 60 l-5 9 h10z" fill="#6b5526" />
          </svg>
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

/* ---------- Perpetual rotor ---------- */

function Rotor() {
  const root = useRef(null)
  const rotor = useRef(null)
  const reserveBar = useRef(null)
  const reserveText = useRef(null)
  const second = useRef(null)
  const minute = useRef(null)
  const hour = useRef(null)
  const status = useRef(null)
  const sim = useRef({ a: 40, v: 0, power: 22, frozen: null, lastScroll: 0, dragging: false, lastAngle: 0 })

  const pointerAngle = (e) => {
    const box = root.current.querySelector('.rotor-stage').getBoundingClientRect()
    return (Math.atan2(e.clientY - box.top - box.height / 2, e.clientX - box.left - box.width / 2) * 180) / Math.PI
  }

  useFrame(root, (_, dt) => {
    const s = sim.current
    // Scrolling the page is your arm swinging.
    const y = window.scrollY
    const scrollDelta = y - s.lastScroll
    s.lastScroll = y
    if (!s.dragging && dt > 0) {
      s.v += Math.max(-300, Math.min(300, scrollDelta)) * 0.9
      // A weighted half-disc is a pendulum: gravity pulls it back to hanging.
      s.v += -Math.sin((s.a * Math.PI) / 180) * 620 * dt
      s.v *= 1 - Math.min(1, 1.3 * dt)
      s.a += s.v * dt
    }
    s.power = Math.max(0, Math.min(100, s.power + Math.abs(s.v) * dt * 0.018 - dt * 0.9))
    rotor.current.setAttribute('transform', `rotate(${s.a} 200 200)`)
    reserveBar.current.setAttribute('stroke-dasharray', `${(s.power / 100) * 283} 400`)
    reserveText.current.textContent = `${Math.round((s.power / 100) * 48)}`

    // Out of power: the hands stop until you wind it again.
    const alive = s.power > 0
    if (alive) s.frozen = null
    else if (!s.frozen) s.frozen = clockAngles()
    const c = s.frozen || clockAngles()
    second.current.setAttribute('transform', `rotate(${Math.floor(c.seconds * 8) * 0.75} 200 200)`)
    minute.current.setAttribute('transform', `rotate(${c.m} 200 200)`)
    hour.current.setAttribute('transform', `rotate(${c.h} 200 200)`)
    status.current.textContent = alive ? 'Running' : 'Stopped: swing the rotor'
  })

  return (
    <div className="rotor" ref={root}>
      <div
        className="rotor-stage"
        onPointerDown={(e) => { const s = sim.current; s.dragging = true; s.lastAngle = pointerAngle(e); e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          const s = sim.current
          if (!s.dragging) return
          const a = pointerAngle(e)
          let delta = a - s.lastAngle
          if (delta > 180) delta -= 360
          if (delta < -180) delta += 360
          s.lastAngle = a
          s.a += delta
          s.v = delta * 40
        }}
        onPointerUp={() => { sim.current.dragging = false }}
      >
        <svg viewBox="0 0 400 400" role="img" aria-label="A watch with a weighted rotor. Drag or scroll to swing it and wind the mainspring.">
          <defs>
            <linearGradient id="roCase" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e4e1d6" /><stop offset=".5" stopColor="#7a7a70" /><stop offset=".7" stopColor="#cfccc1" /><stop offset="1" stopColor="#47473f" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="194" fill="url(#roCase)" />
          <circle cx="200" cy="200" r="178" fill="#0f2d22" />
          <g color="#e7e4d6"><Ticks r={172} length={18} count={12} width={3.4} /><Ticks r={172} length={6} width={.6} skip={5} /></g>
          <circle cx="200" cy="200" r="45" fill="none" stroke="#e7e4d6" strokeOpacity=".2" strokeWidth="3" transform="rotate(-90 200 200)" />
          <circle ref={reserveBar} cx="200" cy="200" r="45" fill="none" stroke="#d9c070" strokeWidth="3" transform="rotate(-90 200 200)" />
          <g ref={hour}><path d="M195 215 L196 110 L200 102 L204 110 L205 215Z" fill="#f0ede0" /></g>
          <g ref={minute}><path d="M197 220 L198 58 L200 50 L202 58 L203 220Z" fill="#f0ede0" /></g>
          <g ref={second}><path d="M199.4 240 L199.7 40 L200.3 40 L200.6 240Z" fill="#d9c070" /></g>
          {/* The rotor: a heavy half-disc, shown ghosted as if the dial were glass */}
          <g ref={rotor} className="rotor-mass">
            <path d="M200 200 L66 200 A134 134 0 0 0 334 200 Z" fill="#e0c56f" fillOpacity=".28" stroke="#e0c56f" strokeWidth="1.2" />
            <path d="M84 216 A118 118 0 0 0 316 216" fill="none" stroke="#e0c56f" strokeOpacity=".55" strokeWidth="1" />
          </g>
          <circle cx="200" cy="200" r="6" fill="#e0c56f" />
        </svg>
      </div>
      <div className="rotor-side">
        <h2 className="title-ox">Winding, <em>by living</em></h2>
        <p className="lede">Rolex sealed the watch against water with the 1926 Oyster, then had a new problem: opening the crown to wind it let the world back in. Its 1931 answer was a weight that swings on your wrist and winds the mainspring, so the crown can stay shut.</p>
        <div className="rotor-read">
          <div className="spec-value"><span ref={reserveText}>10</span><small> h in reserve</small></div>
          <div className="spec-label" ref={status}>Running</div>
        </div>
        <p className="hint-line">Drag the rotor, or just scroll the page: your scrollbar is an arm.</p>
        <p className="fineprint">Reserve here drains far faster than the real thing, so you can watch it stop. The rotor’s motion is modelled as a simple pendulum.</p>
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
        <div className="wide-photo"><Photo slug="rotor" alt="Back of an automatic watch movement showing its rotor" /></div>
      </Chapter>
    </>
  )
}
