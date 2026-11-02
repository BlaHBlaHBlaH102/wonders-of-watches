import { useRef, useState } from 'react'
import { useFrame } from '../lib/hooks.js'
import { Chapter, Gallery, Photo, Spec, Ticks } from './Parts.jsx'

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
  const readout = useRef(null)
  const flame = useRef(null)
  const timer = useRef({ running: false, started: 0, elapsed: 0 })
  const [state, setState] = useState('idle')
  const [result, setResult] = useState(null)

  useFrame(root, (now) => {
    const t = timer.current
    const elapsed = t.running ? t.elapsed + (now - t.started) / 1000 : t.elapsed
    // Apollo-era calibre 321 beat 18,000 times an hour: five steps a second.
    readout.current.textContent = (Math.floor(elapsed * 5) / 5).toFixed(1)
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
      <div className="burn-photo">
        <Photo slug="speedmaster" alt="Omega Speedmaster Professional with a black dial and tachymeter bezel" />
        <div className="burn-timer"><span ref={readout}>0.0</span><small> s</small></div>
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
          {result !== null && (
            <>
              <div className="spec-value">{result.toFixed(2)}<small> s</small></div>
              <p>{verdict(result - 14)}</p>
            </>
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

      <Gallery slugs={['aldrin', 'om-dial', 'om-speedy', 'speedmaster-back', 'om-side', 'om-front']} />

      <MagnetLab />
      <div className="split photo-split">
        <div className="prose">
          <h3 className="sub-om">The escapement that took 25 years to sell</h3>
          <p>George Daniels, the great English watchmaker, patented the Co-Axial in 1980 and hawked it around the Swiss industry for years. Omega finally put it in production in 1999. Its promise: replace the sliding friction of the 250-year-old lever with pushes, so the oil lasts longer and the rate holds longer.</p>
        </div>
        <Photo slug="seamaster" alt="Omega Seamaster Co-Axial" />
      </div>
      <Gallery slugs={['om-seamaster', 'om-sea60', 'speedmaster-macro']} />

      <div className="specs specs-wide">
        <Spec label="METAS test field" value="15,000" small=" G" />
        <Spec label="Master Chronometer" value="0/+5" small=" s/day" />
        <Spec label="Co-Axial in production" value="1999" />
      </div>
    </Chapter>
  )
}
