import { useRef } from 'react'
import { clockAngles, useFrame } from '../lib/hooks.js'
import { Ticks } from './Parts.jsx'

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
  const hour = useRef(null)
  const minute = useRef(null)
  const second = useRef(null)
  const pointer = useRef({ x: 0.2, y: -0.3, tx: 0.2, ty: -0.3 })

  useFrame(root, () => {
    const a = clockAngles()
    hour.current.setAttribute('transform', `rotate(${a.h} 200 200)`)
    minute.current.setAttribute('transform', `rotate(${a.m} 200 200)`)
    second.current.setAttribute('transform', `rotate(${a.s} 200 200)`)

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
          <svg viewBox="0 0 400 400" role="img" aria-label="A watch showing your local time">
            <defs>
              <radialGradient id="heroDial" cx="50%" cy="42%" r="70%">
                <stop offset="0" stopColor="#23262a" />
                <stop offset="1" stopColor="#090a0b" />
              </radialGradient>
              <linearGradient id="heroCase" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f0ede6" />
                <stop offset=".45" stopColor="#75736e" />
                <stop offset=".6" stopColor="#d9d6cf" />
                <stop offset="1" stopColor="#3c3b39" />
              </linearGradient>
            </defs>
            <circle cx="200" cy="200" r="192" fill="url(#heroCase)" />
            <circle cx="200" cy="200" r="179" fill="#050506" />
            <circle cx="200" cy="200" r="175" fill="url(#heroDial)" />
            <g color="#ece8df">
              <Ticks r={168} length={7} width={0.7} opacity={0.65} skip={5} />
              <Ticks r={168} length={21} width={3.4} count={12} />
            </g>
            <text x="200" y="128" textAnchor="middle" className="dial-script" fill="#ece8df">Wonders</text>
            <text x="200" y="143" textAnchor="middle" className="dial-caps" fill="#ece8df" opacity=".7">OF WATCHES</text>
            <g ref={hour}><path d="M196 218 L197 104 L200 96 L203 104 L204 218Z" fill="#f4f0e7" /></g>
            <g ref={minute}><path d="M197.5 222 L198 54 L200 44 L202 54 L202.5 222Z" fill="#f4f0e7" /></g>
            <g ref={second}>
              <path d="M199.4 248 L199.6 34 L200.4 34 L200.6 248Z" fill="#6e9fd8" />
              <circle cx="200" cy="200" r="4.5" fill="#6e9fd8" />
            </g>
            <circle cx="200" cy="200" r="1.6" fill="#0a0a0b" />
          </svg>
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
