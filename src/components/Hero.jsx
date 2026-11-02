import { useRef } from 'react'
import { useFrame } from '../lib/hooks.js'

const NAV = [
  ['springdrive', 'Spring Drive'],
  ['omega', 'Omega'],
  ['gshock', 'G-Shock'],
  ['tourbillon', 'Tourbillon'],
  ['perpetual', 'Perpetual'],
  ['archive', 'Archive'],
  ['sky', 'Sky'],
]

export function TopNav() {
  return (
    <nav className="topnav" aria-label="Chapters">
      <a className="topnav-mark" href="#top">W<i>of</i>W</a>
      <ul>
        {NAV.map(([id, label]) => (
          <li key={id}><a href={`#${id}`}>{label}</a></li>
        ))}
      </ul>
    </nav>
  )
}

export default function Hero() {
  const root = useRef(null)
  const watch = useRef(null)
  const glare = useRef(null)
  const pointer = useRef({ x: 0.2, y: -0.3, tx: 0.2, ty: -0.3 })

  useFrame(root, () => {
    // The watch leans towards the cursor, and the crystal catches the light.
    const p = pointer.current
    p.x += (p.tx - p.x) * 0.06
    p.y += (p.ty - p.y) * 0.06
    watch.current.style.transform = `rotateY(${p.x * 18}deg) rotateX(${-p.y * 18}deg)`
    glare.current.style.background = `radial-gradient(circle at ${50 + p.x * 55}% ${50 + p.y * 55}%, rgba(255,255,255,.2), rgba(255,255,255,.03) 34%, transparent 58%)`
  })

  const onMove = (event) => {
    const box = root.current.getBoundingClientRect()
    pointer.current.tx = (event.clientX - box.left) / box.width - 0.5
    pointer.current.ty = (event.clientY - box.top) / box.height - 0.5
  }

  return (
    <header id="top" className="hero" ref={root} onPointerMove={onMove}>
      <h1 className="hero-title">
        <span className="hero-wonders">Wonders</span>
        <span className="hero-of">of</span>
        <span className="hero-watches">Watches</span>
      </h1>

      <div className="hero-stage">
        <div className="hero-watch" ref={watch}>
          <img src="/images/speedmaster-macro.webp" alt="Close-up of an Omega Speedmaster dial" />
          <div className="hero-glare" ref={glare} aria-hidden="true" />
        </div>
      </div>

      <div className="hero-foot">
        <p className="hero-lede">
          Two centuries of people refusing to accept that a thing on your wrist had to tick, stop, drown, drift or break. Everything here moves: <em>please touch the watches.</em>
        </p>
        <a className="hero-scroll" href="#springdrive">Begin <span aria-hidden="true">→</span></a>
      </div>
    </header>
  )
}
