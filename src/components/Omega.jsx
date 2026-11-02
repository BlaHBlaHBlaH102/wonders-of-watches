import { useRef, useState } from 'react'
import { clockAngles, useFrame } from '../lib/hooks.js'
import { Chapter, Photo, Spec, Ticks } from './Parts.jsx'

/* ---------- Speedmaster chronograph and the 14-second burn ---------- */

function verdict(error) {
  const size = Math.abs(error)
  if (size <= 0.2) return 'Within a single beat of the hand. Houston would like a word about your career options.'
  if (size <= 0.5) return 'Close enough to make the re-entry corridor. Welcome home.'
  if (size <= 1.5) return error > 0 ? 'A little long. Mission Control is reaching for its slide rules.' : 'A little short. Mission Control is reaching for its slide rules.'
  return error > 0 ? 'Far too long. Reset and try again: the crew is counting on you.' : 'Cut off far too early. Reset and try again: the crew is counting on you.'
}

function Speedmaster() {
  const root = useRef(null)
  const refs = { h: useRef(null), m: useRef(null), s: useRef(null), chrono: useRef(null), min: useRef(null) }
  const flame = useRef(null)
  const timer = useRef({ running: false, started: 0, elapsed: 0 })
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)

  useFrame(root, (now) => {
    const a = clockAngles()
    const t = timer.current
    const elapsed = t.running ? t.elapsed + (now - t.started) / 1000 : t.elapsed
    // Apollo-era calibre 321 beat 18,000 times an hour: five steps a second.
    const shown = Math.floor(elapsed * 5) / 5
    refs.h.current.setAttribute('transform', `rotate(${a.h} 200 200)`)
    refs.m.current.setAttribute('transform', `rotate(${a.m} 200 200)`)
    refs.s.current.setAttribute('transform', `rotate(${Math.floor(a.seconds * 5) * 1.2} 112 200)`)
    refs.chrono.current.setAttribute('transform', `rotate(${shown * 6} 200 200)`)
    refs.min.current.setAttribute('transform', `rotate(${(Math.floor(shown / 60) % 30) * 12} 288 200)`)
    flame.current.style.opacity = t.running ? 0.75 + Math.random() * 0.25 : 0
  })

  const startStop = () => {
    const t = timer.current
    const now = performance.now()
    if (t.running) {
      t.elapsed += (now - t.started) / 1000
      t.running = false
      setResult(t.elapsed)
      setState('stopped')
    } else {
      t.started = now
      t.running = true
      setResult(null)
      setState('running')
    }
  }
  const reset = () => {
    if (timer.current.running) return
    timer.current.elapsed = 0
    setResult(null)
    setState('idle')
  }

  return (
    <div className="burn" ref={root}>
      <div className="speedy">
        <svg viewBox="0 0 440 400" role="img" aria-label="Omega Speedmaster-style chronograph. Use the buttons to start, stop and reset.">
          <defs>
            <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e5e6e7" /><stop offset=".5" stopColor="#6c6f73" /><stop offset=".65" stopColor="#c9cbcd" /><stop offset="1" stopColor="#45474a" />
            </linearGradient>
            <path id="tachy" d="M200 200 m-170 0 a170 170 0 1 1 340 0 a170 170 0 1 1 -340 0" />
          </defs>
          {/* Pushers are real controls at 2 and 4 o'clock */}
          <g className="pusher" role="button" tabIndex={0} aria-label="Start or stop" onClick={startStop} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startStop() } }}>
            <rect x="372" y="88" width="46" height="26" rx="3" fill="url(#steel)" transform="rotate(-30 380 100)" />
          </g>
          <g className="pusher" role="button" tabIndex={0} aria-label="Reset" onClick={reset} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reset() } }}>
            <rect x="372" y="286" width="46" height="26" rx="3" fill="url(#steel)" transform="rotate(30 380 300)" />
          </g>
          <rect x="388" y="186" width="20" height="28" rx="3" fill="url(#steel)" />
          <circle cx="200" cy="200" r="198" fill="url(#steel)" />
          <circle cx="200" cy="200" r="186" fill="#08080a" />
          <text fill="#ddd" className="tachy-text"><textPath href="#tachy" startOffset="1%">TACHYMÈTRE  500 · 400 · 300 · 200 · 150 · 120 · 110 · 100 · 90 · 80 · 70 · 60</textPath></text>
          <circle cx="200" cy="200" r="158" fill="#111214" stroke="#333" />
          <g color="#e9e9e4">
            <Ticks r={156} length={7} count={300} width={0.3} opacity={0.65} />
            <Ticks r={156} length={9} width={0.8} />
            <Ticks r={146} length={24} width={3.6} count={12} />
          </g>
          {[[112, 200, 12], [288, 200, 30], [200, 288, 12]].map(([cx, cy, marks]) => (
            <g key={`${cx}${cy}`} color="#e9e9e4">
              <circle cx={cx} cy={cy} r="38" fill="#0a0b0c" />
              <Ticks cx={cx} cy={cy} r={37} length={5} count={marks * (marks === 12 ? 5 : 1)} width={0.5} />
            </g>
          ))}
          <text x="200" y="120" textAnchor="middle" className="dial-speedy" fill="#f1f1ec">Chronograph</text>
          <text x="200" y="134" textAnchor="middle" className="dial-caps" fill="#f1f1ec" opacity=".75">PROFESSIONAL</text>
          <g ref={refs.s}><path d="M112 212 L112 168" stroke="#f1f1ec" strokeWidth="1.5" /><circle cx="112" cy="200" r="2.6" fill="#f1f1ec" /></g>
          <g ref={refs.min}><path d="M288 212 L288 168" stroke="#f1f1ec" strokeWidth="1.5" /><circle cx="288" cy="200" r="2.6" fill="#f1f1ec" /></g>
          <g><path d="M200 300 L200 258" stroke="#f1f1ec" strokeWidth="1.5" /><circle cx="200" cy="288" r="2.6" fill="#f1f1ec" /></g>
          <g ref={refs.h}><path d="M193 222 L194 112 L200 100 L206 112 L207 222Z" fill="#f5f5f0" /></g>
          <g ref={refs.m}><path d="M195 226 L196 66 L200 54 L204 66 L205 226Z" fill="#f5f5f0" /></g>
          <g ref={refs.chrono}>
            <path d="M199.3 260 L199.6 46 L200.4 46 L200.7 260Z" fill="#ffffff" />
            <circle cx="200" cy="200" r="5.5" fill="#f5f5f0" />
          </g>
        </svg>
      </div>

      <div className="burn-side">
        <div className="burn-horizon" aria-hidden="true">
          <div className="burn-earth" />
          <img src="/images/apollo13.webp" alt="" className="burn-lm" />
          <div className="burn-flame" ref={flame} />
        </div>
        <h3 className="sub-om">Fly the burn</h3>
        <p>Apollo 13, April 1970. The explosion has crippled the spacecraft and power is too scarce for the guidance computer. To correct course, the crew fires the lunar module’s engine by hand: Lovell holds Earth’s horizon in the window while Swigert keeps time on his Omega. <em>Fourteen seconds.</em> Your turn.</p>
        <div className="burn-actions">
          <button type="button" className="pill pill-solid" onClick={startStop}>{state === 'running' ? 'Cut engine' : state === 'stopped' ? 'Resume' : 'Ignite'}</button>
          <button type="button" className="pill" onClick={reset} disabled={state === 'running' || state === 'idle'}>Reset</button>
        </div>
        <div className="burn-result" aria-live="polite">
          {result !== null ? (
            <>
              <div className="spec-value">{result.toFixed(2)}<small> s</small></div>
              <p>{verdict(result - 14)}</p>
            </>
          ) : (
            <p className="fineprint">{state === 'running' ? 'Engine burning. Watch the long hand: fourteen seconds is just before the third marker.' : 'Use the buttons, or press the watch’s own pushers at two and four o’clock.'}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Magnetism ---------- */

function spiral(tightness) {
  // A hairspring. As the coils magnetise, they cling together and the spring runs short.
  let d = ''
  const turns = 9
  for (let i = 0; i <= turns * 28; i += 1) {
    const f = i / (turns * 28)
    const angle = f * turns * Math.PI * 2
    const r = 7 + Math.pow(f, 1 + tightness * 2.4) * 41
    d += `${i ? 'L' : 'M'}${(60 + r * Math.cos(angle)).toFixed(1)} ${(60 + r * Math.sin(angle)).toFixed(1)}`
  }
  return d
}

const REF_FIELDS = [
  [60, 'ISO 764 “anti-magnetic” (about)'],
  [1000, 'Rolex Milgauss rating'],
  [15000, 'A 1.5 T MRI scanner, and Omega’s test'],
]

function MagnetLab() {
  const root = useRef(null)
  const stage = useRef(null)
  const magnet = useRef(null)
  const lines = useRef(null)
  const reading = useRef(null)
  const ordinaryHand = useRef(null)
  const omegaHand = useRef(null)
  const rateText = useRef(null)
  const ordinarySpring = useRef(null)
  const sim = useRef({ gauss: 0, damage: 0, a: 0, b: 0, y: 0, lastSpring: -1 })
  const [gauss, setGauss] = useState(0)
  const [magnetised, setMagnetised] = useState(false)

  const applySlider = (value) => {
    sim.current.gauss = value
    setGauss(value)
    if (value > 60) setMagnetised(true)
  }

  // Dragging: log scale, as field strength climbs steeply near the pole.
  const fromPointer = (event) => {
    const box = stage.current.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height))
    return Math.round(10 ** (f * 4.176)) - 1
  }

  useFrame(root, (_, dt) => {
    const s = sim.current
    // The ordinary watch keeps its magnetism after the magnet has gone.
    if (s.gauss > 60) s.damage = Math.max(s.damage, Math.min(1, Math.log10(s.gauss / 60) / 2.4))
    const rate = 1 + s.damage * 16 // illustrative speed-up
    s.a = (s.a + dt * 6 * rate) % 360
    s.b = (s.b + dt * 6) % 360
    ordinaryHand.current.setAttribute('transform', `rotate(${s.a} 60 60)`)
    omegaHand.current.setAttribute('transform', `rotate(${s.b} 60 60)`)
    const f = Math.log10(s.gauss + 1) / 4.176
    magnet.current.style.top = `${f * 100}%`
    lines.current.style.opacity = f
    lines.current.style.transform = `translate(-50%, -50%) scale(${0.4 + f})`
    lines.current.style.top = `${f * 100}%`
    reading.current.textContent = Math.round(s.gauss).toLocaleString('en-US')
    rateText.current.textContent = s.damage > 0 ? `Running ${rate.toFixed(1)}× fast` : 'Keeping time'
    if (s.lastSpring !== s.damage) {
      ordinarySpring.current.setAttribute('d', spiral(s.damage))
      s.lastSpring = s.damage
    }
  })

  return (
    <div className="magnet" ref={root}>
      <div className="magnet-copy">
        <h3 className="sub-om">Ordinary life is full of magnets</h3>
        <p>Laptops, phone cases and handbag clasps can magnetise a steel hairspring. Its coils stick together, the spring acts shorter, and the watch races. Omega’s answer in 2013 wasn’t a shield. It rebuilt the escapement from materials that don’t respond to the field at all.</p>
        <p className="magnet-reading"><span ref={reading}>0</span><small> gauss</small></p>
        <label className="range">
          <span className="control-label">Move the magnet closer</span>
          <input type="range" min="0" max="15000" step="10" value={gauss} onChange={(e) => applySlider(Number(e.target.value))} aria-label="Magnetic field in gauss" />
        </label>
        <button type="button" className="pill" disabled={!magnetised} onClick={() => { sim.current.damage = 0; applySlider(0); setMagnetised(false) }}>Demagnetise the ordinary watch</button>
        <ul className="fieldrefs">
          {REF_FIELDS.map(([value, label]) => (
            <li key={value}><button type="button" onClick={() => applySlider(value)}><b>{value.toLocaleString('en-US')}</b> {label}</button></li>
          ))}
        </ul>
        <p className="fineprint">The speed-up is illustrative. A badly magnetised watch can really gain minutes a day.</p>
      </div>

      <div className="magnet-stage" ref={stage} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); applySlider(Math.min(15000, fromPointer(e))) }} onPointerMove={(e) => { if (e.buttons) applySlider(Math.min(15000, fromPointer(e))) }}>
        <div className="field-lines" ref={lines} aria-hidden="true" />
        <div className="magnet-block" ref={magnet}><span>N</span><span>S</span></div>
        <div className="magnet-watches">
          {[
            ['Steel hairspring', ordinaryHand, ordinarySpring, true],
            ['Non-magnetic escapement', omegaHand, null, false],
          ].map(([label, hand, springRef, weak]) => (
            <div key={label} className="mini">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="57" fill="#0d1014" stroke="#6d7379" strokeWidth="1.2" />
                <path ref={springRef} d={spiral(0)} fill="none" stroke={weak ? '#d9a06b' : '#8fb3d9'} strokeWidth=".55" />
                <g color="#e9e9e4"><Ticks cx={60} cy={60} r={55} length={6} count={12} width={1.2} /></g>
                <g ref={hand}><line x1="60" y1="68" x2="60" y2="10" stroke="#fff" strokeWidth=".9" /></g>
              </svg>
              <div className="mini-label">{label}</div>
              {weak ? <div className="mini-rate" ref={rateText}>Keeping time</div> : <div className="mini-rate ok">Keeping time</div>}
            </div>
          ))}
        </div>
        <div className="stage-hint">Drag down</div>
      </div>
    </div>
  )
}

/* ---------- Co-Axial schematic ---------- */

const STEPS = [
  { at: 0.04, label: 'Direct impulse', text: 'The large escape wheel kicks the balance directly, with no sliding across a pallet.' },
  { at: 0.3, label: 'Locked', text: 'The balance swings free. Everything else is locked and at rest.' },
  { at: 0.54, label: 'Indirect impulse', text: 'On the return, the small coaxial wheel pushes the lever, and the lever pushes the balance.' },
  { at: 0.8, label: 'Locked', text: 'Free again. Two impulses per cycle, both delivered by a push rather than a rub.' },
]

function gear(cx, cy, r, teeth, depth) {
  let d = ''
  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2
    const b = ((i + 0.35) / teeth) * Math.PI * 2
    const c = ((i + 0.5) / teeth) * Math.PI * 2
    d += `${i ? 'L' : 'M'}${(cx + (r - depth) * Math.cos(a)).toFixed(1)} ${(cy + (r - depth) * Math.sin(a)).toFixed(1)}L${(cx + r * Math.cos(b)).toFixed(1)} ${(cy + r * Math.sin(b)).toFixed(1)}L${(cx + (r - depth) * Math.cos(c)).toFixed(1)} ${(cy + (r - depth) * Math.sin(c)).toFixed(1)}`
  }
  return `${d}Z`
}
const ESCAPE = gear(150, 210, 112, 18, 16)
const COAX = gear(150, 210, 54, 9, 10)

const smooth = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) }

function CoAxial() {
  const root = useRef(null)
  const wheels = useRef(null)
  const lever = useRef(null)
  const balance = useRef(null)
  const direct = useRef(null)
  const indirect = useRef(null)
  const phase = useRef(0)
  const [playing, setPlaying] = useState(true)
  const [step, setStep] = useState(0)
  const [scrub, setScrub] = useState(0)

  const pose = (p) => {
    // The wheels advance twice per cycle, during each impulse only.
    const advance = smooth(p / 0.14) * 10 + smooth((p - 0.5) / 0.14) * 10
    wheels.current.setAttribute('transform', `rotate(${advance} 150 210)`)
    const leverAngle = -7 + smooth((p - 0.46) / 0.2) * 14 - smooth((p - 0.96) / 0.04) * 14
    lever.current.setAttribute('transform', `rotate(${leverAngle} 300 210)`)
    balance.current.setAttribute('transform', `rotate(${Math.sin(p * Math.PI * 2 + 0.2) * 150} 480 210)`)
    direct.current.style.opacity = p < 0.15 ? 1 : 0
    indirect.current.style.opacity = p > 0.5 && p < 0.65 ? 1 : 0
    const current = p < 0.2 ? 0 : p < 0.5 ? 1 : p < 0.7 ? 2 : 3
    setStep((s) => (s === current ? s : current))
  }

  useFrame(root, (_, dt) => {
    if (playing) {
      phase.current = (phase.current + dt * 0.14) % 1
      pose(phase.current)
    } else {
      pose(phase.current)
    }
  })

  return (
    <div className="coax" ref={root}>
      <div className="coax-copy">
        <h3 className="sub-om">The escapement that took 25 years to sell</h3>
        <p>George Daniels, the great English watchmaker, patented the Co-Axial in 1980 and hawked it around the Swiss industry for years. Omega finally put it in production in 1999. Its promise: replace the sliding friction of the 250-year-old lever with pushes, so the oil lasts longer and the rate holds longer.</p>
        <ol className="coax-steps">
          {STEPS.map((s, i) => (
            <li key={s.at} className={i === step ? 'on' : ''}>
              <button type="button" onClick={() => { setPlaying(false); phase.current = s.at + 0.02; setScrub(phase.current) }}>
                <b>{s.label}</b>
              </button>
              {i === step && <span>{s.text}</span>}
            </li>
          ))}
        </ol>
        <div className="control-row">
          <button type="button" className="pill" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <label className="range grow">
            <span className="control-label">Scrub one cycle</span>
            <input type="range" min="0" max="0.999" step="0.001" value={playing ? 0 : scrub} aria-label="Position in the escapement cycle" onChange={(e) => { setPlaying(false); phase.current = Number(e.target.value); setScrub(phase.current) }} />
          </label>
        </div>
        <p className="fineprint">A schematic of the sequence, not a scale drawing of the calibre. Slowed about 18 times.</p>
      </div>

      <svg className="coax-svg" viewBox="0 0 640 420" role="img" aria-label="Schematic of the Co-Axial escapement: escape wheels, lever and balance">
        <g ref={wheels}>
          <path d={ESCAPE} fill="#2a3442" stroke="#9db4cc" strokeWidth="1" />
          <path d={COAX} fill="#c9a86a" stroke="#f0d9a6" strokeWidth="1" />
        </g>
        <circle cx="150" cy="210" r="7" fill="#e8e8e2" />
        <text x="150" y="350" className="schem-label" textAnchor="middle">Escape + coaxial wheels</text>

        <g ref={lever}>
          <path d="M238 186 L300 198 L392 196 L392 224 L300 222 L238 234 L230 222 L290 212 L290 208 L230 198Z" fill="#7d8894" stroke="#d6dde4" strokeWidth=".8" />
          {[[236, 192], [236, 228], [386, 210]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#c23a4c" />)}
          <circle cx="300" cy="210" r="5" fill="#e8e8e2" />
        </g>
        <text x="300" y="350" className="schem-label" textAnchor="middle">Lever, three ruby pallets</text>

        <g ref={balance}>
          <circle cx="480" cy="210" r="124" fill="none" stroke="#c9a86a" strokeWidth="10" />
          <path d="M356 210 H604 M480 86 V334" stroke="#c9a86a" strokeWidth="5" />
          <circle cx="480" cy="210" r="34" fill="#1a2029" stroke="#c9a86a" strokeWidth="1.5" />
          <circle cx="451" cy="210" r="5" fill="#c23a4c" />
        </g>
        <circle cx="480" cy="210" r="5" fill="#e8e8e2" />
        <text x="480" y="372" className="schem-label" textAnchor="middle">Balance</text>

        <g ref={direct} style={{ opacity: 0 }}>
          <path d="M262 190 C330 130 380 130 440 180" fill="none" stroke="#7fd4ff" strokeWidth="2.2" strokeDasharray="5 5" />
          <text x="350" y="118" className="schem-flash" textAnchor="middle">Wheel → balance</text>
        </g>
        <g ref={indirect} style={{ opacity: 0 }}>
          <path d="M205 210 L392 210 L445 210" fill="none" stroke="#ffcf7f" strokeWidth="2.6" strokeDasharray="5 5" />
          <text x="320" y="170" className="schem-flash" textAnchor="middle" fill="#ffcf7f">Wheel → lever → balance</text>
        </g>
      </svg>
    </div>
  )
}

export default function Omega() {
  return (
    <Chapter id="omega" theme="t-ink" number="02" kicker="Omega · Precision under pressure">
      <div className="split split-title">
        <h2 className="title-om">Fourteen<br />seconds</h2>
        <p className="lede">
          NASA flight-qualified the Speedmaster in 1965 by trying to destroy it. Four years later Buzz Aldrin wore his on the Moon. The next year, one kept time when almost everything else on board had been switched off.
        </p>
      </div>

      <Speedmaster />

      <div className="mosaic">
        <Photo slug="aldrin" alt="Buzz Aldrin standing on the lunar surface during Apollo 11" />
        <Photo slug="speedmaster" alt="Omega Speedmaster Professional with a black dial and tachymeter bezel" />
      </div>

      <MagnetLab />
      <CoAxial />

      <div className="specs specs-wide">
        <Spec label="METAS test field" value="15,000" small=" G" />
        <Spec label="Master Chronometer" value="0/+5" small=" s/day" />
        <Spec label="Co-Axial in production" value="1999" />
      </div>
    </Chapter>
  )
}
