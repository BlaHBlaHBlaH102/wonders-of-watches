import { useEffect, useRef, useState } from 'react'
import { pad, useFrame, useJson } from '../lib/hooks.js'
import { Chapter, Photo, Segmented, Spec } from './Parts.jsx'

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

/* An LCD with ghost segments. DSEG7 carries digits only; every word on the watch is Helvetica. */
function Seg({ value, ghost, className = '' }) {
  return (
    <span className={`seg ${className}`}>
      <span className="seg-ghost" aria-hidden="true">{ghost}</span>
      <span className="seg-live">{value}</span>
    </span>
  )
}

function LcdWatch({ radiation }) {
  const [now, setNow] = useState(() => new Date())
  const [mode, setMode] = useState('time')
  const [lit, setLit] = useState(false)
  const [sw, setSw] = useState({ running: false, base: 0, started: 0 })

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), mode === 'stopwatch' && sw.running ? 40 : 250)
    return () => clearInterval(id)
  }, [mode, sw.running])

  const flash = () => {
    setLit(true)
    setTimeout(() => setLit(false), 1800)
  }
  const elapsed = sw.running ? sw.base + (performance.now() - sw.started) : sw.base
  const toggleSw = () => setSw((s) => (s.running
    ? { running: false, base: s.base + (performance.now() - s.started), started: 0 }
    : { running: true, base: s.base, started: performance.now() }))

  return (
    <div className="gx-watch">
      <div className="gx-strap gx-strap-top" aria-hidden="true" />
      <div className="gx-strap gx-strap-bottom" aria-hidden="true" />
      <div className="gx-case">
        <button type="button" className="gx-btn gx-btn-tl" onClick={flash}>Light</button>
        <button type="button" className="gx-btn gx-btn-bl" onClick={() => setMode(mode === 'time' ? 'stopwatch' : 'time')}>Mode</button>
        <button type="button" className="gx-btn gx-btn-tr" disabled={mode !== 'stopwatch'} onClick={toggleSw}>{sw.running ? 'Stop' : 'Start'}</button>
        <button type="button" className="gx-btn gx-btn-br" disabled={mode !== 'stopwatch' || sw.running} onClick={() => setSw({ running: false, base: 0, started: 0 })}>Reset</button>

        <div className="gx-bezel">
          <div className="gx-brand">Shock Resist</div>
          <div className={`gx-lcd ${lit ? 'lit' : ''}`}>
            {mode === 'time' ? (
              <>
                <div className="gx-row">
                  <span className="gx-word">{DAYS[now.getDay()]}</span>
                  <Seg className="gx-date" value={`${now.getMonth() + 1}-${pad(now.getDate())}`} ghost="88-88" />
                </div>
                <div className="gx-main">
                  <Seg className="gx-time" value={`${pad(now.getHours())}:${pad(now.getMinutes())}`} ghost="88:88" />
                  <Seg className="gx-sec" value={pad(now.getSeconds())} ghost="88" />
                </div>
              </>
            ) : (
              <>
                <div className="gx-row"><span className="gx-word">Stopwatch</span></div>
                <div className="gx-main">
                  <Seg className="gx-time" value={`${pad(elapsed / 60000)}:${pad((elapsed / 1000) % 60)}`} ghost="88:88" />
                  <Seg className="gx-sec" value={pad((elapsed / 10) % 100)} ghost="88" />
                </div>
              </>
            )}
            <div className="gx-row gx-solar">
              <span className="gx-word">Solar W/m²</span>
              <Seg className="gx-date" value={radiation == null ? '---' : pad(Math.round(radiation), 3)} ghost="888" />
            </div>
          </div>
          <div className="gx-brand gx-brand-low">Press the buttons</div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Drop test ---------- */

const CASES = [
  { value: 'plain', label: 'Rigid watch', stop: 0.0006, breaks: 900, note: 'Glass, case and movement are all bolted together. Everything stops at once, so the movement takes the whole blow.' },
  { value: 'hollow', label: '1983 hollow case', stop: 0.006, breaks: Infinity, note: 'Kikuo Ibe’s breakthrough: hang the module inside the case, touching it at only a few points, like the core of a rubber ball.' },
  { value: 'carbon', label: 'Carbon Core Guard', stop: 0.006, breaks: Infinity, note: 'The 2019 rethink: a stiff carbon-fibre-reinforced case protects the module on its own, so the watch gets thinner and lighter.' },
]
const G = 9.81

function DropTest() {
  const root = useRef(null)
  const body = useRef(null)
  const module = useRef(null)
  const sim = useRef({ state: 'idle', y: 0, v: 0, bounces: 0, shake: 0, moduleY: 0, moduleV: 0 })
  const [kind, setKind] = useState('carbon')
  const [height, setHeight] = useState(10)
  const [result, setResult] = useState(null)
  const active = CASES.find((c) => c.value === kind)
  const settings = useRef({ kind: active, height })
  settings.current = { kind: active, height }

  useFrame(root, (_, dt) => {
    const s = sim.current
    if (s.state === 'falling') {
      s.v += G * dt
      s.y += s.v * dt
      if (s.y >= 10) {
        s.y = 10 // y is metres below the 10 m mark, so the floor is always at 10
        if (s.bounces === 0) {
          const { kind: k, height: h } = settings.current
          const impact = Math.sqrt(2 * G * h)
          const peak = (impact * impact) / (2 * k.stop) / G
          const broke = peak > k.breaks
          setResult({ peak: Math.round(peak), broke, impact })
          s.moduleV = broke ? 0 : impact * 9
        }
        s.bounces += 1
        s.v = -s.v * 0.32
        if (Math.abs(s.v) < 0.8 || s.bounces > 4) {
          s.v = 0
          s.state = 'landed'
        }
      }
    }
    // The module rides out the hit on its suspension, then settles.
    s.moduleV += (-s.moduleY * 900 - s.moduleV * 16) * dt
    s.moduleY += s.moduleV * dt

    if (s.state === 'idle') s.y = 10 - settings.current.height
    body.current.style.top = `calc(${s.y / 10} * (100% - 140px))`
    module.current.style.transform = `translateY(${Math.max(-10, Math.min(10, s.moduleY))}px)`
  })

  const drop = () => {
    Object.assign(sim.current, { state: 'falling', y: 10 - settings.current.height, v: 0, bounces: 0, moduleY: 0, moduleV: 0 })
    setResult(null)
  }
  const prepare = () => {
    setResult(null)
    sim.current.state = 'idle'
  }

  return (
    <div className="drop" ref={root}>
      <div className="drop-stage" role="img" aria-label={`A watch falling ${height} metres on to concrete`}>
        <div className="drop-ruler" aria-hidden="true">
          {[0, 2, 4, 6, 8, 10].map((m) => <span key={m} style={{ top: `${m * 10}%` }}>{10 - m}m</span>)}
        </div>
        <div className="drop-body" ref={body}>
          <div className={`drop-cutaway ${kind} ${result?.broke ? 'broken' : ''}`}>
            <div className="drop-module" ref={module}>
              <Seg className="drop-seg" value={result?.broke ? '--:--' : '12:00'} ghost="88:88" />
            </div>
            {result?.broke && <svg className="drop-crack" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 50 L12 8 M50 50 L90 18 M50 50 L78 92 M50 50 L20 86 M50 50 L4 56 M33 31 L46 12 M68 34 L92 44" stroke="#fff" strokeWidth="1" fill="none" /></svg>}
          </div>
        </div>
        <div className="drop-floor" aria-hidden="true" />
      </div>

      <div className="drop-side">
        <h3 className="sub-gx">Drop it. Go on.</h3>
        <div className="control-label">Construction</div>
        <Segmented label="Construction" options={CASES} value={kind} onChange={(v) => { setKind(v); prepare() }} />
        <p className="beat-note">{active.note}</p>
        <label className="range">
          <span className="control-label">Height: {height} m</span>
          <input type="range" min="1" max="10" value={height} aria-label="Drop height in metres" onChange={(e) => { setHeight(Number(e.target.value)); prepare() }} />
        </label>
        <button type="button" className="pill pill-solid" onClick={drop}>Release</button>
        <div className="drop-result" aria-live="polite">
          {result && (
            <>
              <div className="drop-peak"><Seg value={String(Math.min(result.peak, 99999))} ghost={'8'.repeat(String(Math.min(result.peak, 99999)).length)} /><span className="gx-word">g at the module</span></div>
              <p>{result.broke ? 'Dead on arrival. Crystal cracked, movement stopped.' : `Hit the ground at ${result.impact.toFixed(1)} m/s. Still telling the time.`}</p>
            </>
          )}
        </div>
        <p className="fineprint">A simple constant-deceleration model: the stopping distances and the failure limit are illustrative, not Casio figures.</p>
      </div>
    </div>
  )
}

/* ---------- Exploded Carbon Core Guard ---------- */

const LAYERS = [
  { key: 'bezel', label: 'Resin bezel', note: 'Takes the scrapes. Stands proud of the crystal.' },
  { key: 'module', label: 'Module', note: 'Hands, LCD and quartz: the part everything else exists to protect.' },
  { key: 'core', label: 'Carbon core case', note: 'Carbon-fibre-reinforced resin. Rigid enough to do the protecting alone, and it needs no separate button guards.' },
  { key: 'back', label: 'Dual-layer back', note: 'A carbon-reinforced insert within the resin caseback.' },
]

function Exploded() {
  const [spread, setSpread] = useState(62)
  const [rot, setRot] = useState({ x: 58, z: -28 })
  const [active, setActive] = useState('core')
  const drag = useRef(null)

  return (
    <div className="exploded">
      <div
        className="exploded-stage"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, startX: rot.x, startZ: rot.z }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerMove={(e) => {
          if (!drag.current) return
          setRot({
            x: Math.max(10, Math.min(80, drag.current.startX - (e.clientY - drag.current.y) * 0.4)),
            z: drag.current.startZ + (e.clientX - drag.current.x) * 0.5,
          })
        }}
        onPointerUp={() => { drag.current = null }}
        role="img"
        aria-label="Exploded view of a Carbon Core Guard watch. Drag to rotate."
      >
        <div className="exploded-stack" style={{ transform: `rotateX(${rot.x}deg) rotateZ(${rot.z}deg)` }}>
          {LAYERS.map((layer, i) => (
            <div key={layer.key} className={`layer layer-${layer.key} ${active === layer.key ? 'on' : ''}`} style={{ transform: `translateZ(${(1.5 - i) * spread * 1.4}px)` }} />
          ))}
        </div>
        <div className="stage-hint">Drag to turn</div>
      </div>
      <div className="exploded-side">
        <h3 className="sub-gx">Take it apart</h3>
        <ul className="layer-list">
          {LAYERS.map((layer) => (
            <li key={layer.key} className={active === layer.key ? 'on' : ''}>
              <button type="button" onClick={() => setActive(layer.key)}><b>{layer.label}</b></button>
              {active === layer.key && <span>{layer.note}</span>}
            </li>
          ))}
        </ul>
        <label className="range">
          <span className="control-label">Explode</span>
          <input type="range" min="0" max="100" value={spread} aria-label="Separate the layers" onChange={(e) => setSpread(Number(e.target.value))} />
        </label>
        <p className="fineprint">A simplified diagram of the structure, not a parts diagram.</p>
      </div>
    </div>
  )
}

export default function GShock() {
  const { data } = useJson('/api/sky')
  return (
    <Chapter id="gshock" theme="t-resin" number="03" kicker="Casio G-Shock · Toughness">
      <div className="split split-title">
        <h2 className="title-gx">Triple<br />ten</h2>
        <p className="lede">
          A Casio engineer named Kikuo Ibe dropped and broke a treasured watch from his father, then wrote a one-line proposal for one that could not break. Ten-metre fall, ten bar of water, ten-year battery. It took over two years and more than 200 prototypes, until he watched a child bouncing a rubber ball.
        </p>
      </div>

      <div className="gx-intro">
        <LcdWatch radiation={data?.sun?.radiation} />
        <div className="prose">
          <p>This one is yours to play with, and it’s running on your local time. The bottom line reads live solar radiation over Shiojiri, Japan, from <a href="https://open-meteo.com/">Open-Meteo</a>. It’s the sunlight a solar G-Shock would be drinking right now.</p>
          <div className="specs">
            <Spec label="Drop" value="10" small=" m" />
            <Spec label="Water" value="10" small=" bar" />
            <Spec label="Battery" value="10" small=" yr" />
          </div>
          <Photo slug="dw5000" alt="A black Casio G-Shock DW-5000 with a square case and red inner ring" />
        </div>
      </div>

      <DropTest />
      <Exploded />

      <div className="split photo-split">
        <div className="prose">
          <h3 className="sub-gx">Thirty-six years later</h3>
          <p>For decades the recipe was bulk: pad the module and pile on resin. With the GWR-B1000 and GA-2000 of 2019, Casio made the case itself rigid, with carbon fibre running through it. A GA-2000 weighs just 64 grams, and its buttons need no guards.</p>
        </div>
        <Photo slug="ga2000" alt="G-Shock GA-2000 with analogue hands, digital sub-display and yellow accents" />
      </div>
    </Chapter>
  )
}
