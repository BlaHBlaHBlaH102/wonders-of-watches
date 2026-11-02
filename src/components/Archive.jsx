import { useEffect, useRef, useState } from 'react'
import { audioContext, useJson } from '../lib/hooks.js'
import { Chapter, Photo } from './Parts.jsx'
import images from '../data/images.json'

function HumButton({ frequency }) {
  const [on, setOn] = useState(false)
  const node = useRef(null)
  const stop = () => {
    node.current?.stop()
    node.current = null
    setOn(false)
  }
  useEffect(() => () => node.current?.stop(), [])
  const toggle = () => {
    if (on) return stop()
    const ctx = audioContext()
    if (!ctx) return undefined
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = frequency
    gain.gain.value = 0.035
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    node.current = osc
    setOn(true)
    return undefined
  }
  return <button type="button" className={`pill ${on ? 'on' : ''}`} aria-pressed={on} onClick={toggle}>{on ? 'Stop the hum' : `Hear ${frequency} Hz`}</button>
}

export function Archive() {
  const { data, error, loading } = useJson('/api/wonders')
  const [open, setOpen] = useState('coaxial')
  return (
    <Chapter id="archive" theme="t-bone" number="06" kicker="The archive · 1801 to now">
      <h2 className="title-archive">Eleven times someone <em>changed the rules</em></h2>
      {loading && <p className="fineprint">Opening the archive…</p>}
      {error && <p className="notice">The archive API is not answering right now. The rest of the site still works.</p>}
      <ol className="archive">
        {data?.wonders.map((w) => {
          const isOpen = open === w.id
          return (
            <li key={w.id} className={isOpen ? 'open' : ''}>
              <button type="button" className="archive-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : w.id)}>
                <span className="archive-year">{w.year}</span>
                <span className="archive-title">{w.title}</span>
                <span className="archive-maker">{w.maker}</span>
                <span className="archive-kind">{w.kind}</span>
              </button>
              {isOpen && (
                <div className="archive-body">
                  <div>
                    <p>{w.body}</p>
                    <div className="archive-actions">
                      {w.hum && <HumButton frequency={w.hum} />}
                      {w.chapter && <a className="pill" href={`#${w.chapter}`}>Try it above</a>}
                    </div>
                  </div>
                  {w.image && images[w.image] && <Photo slug={w.image} />}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </Chapter>
  )
}

/* ---------- Live sky ---------- */

function shadowPath(cycle) {
  // Dark limb plus a terminator ellipse, on a 200-unit disc of radius 100.
  const lit = Math.cos(cycle * 2 * Math.PI)
  const rx = Math.abs(lit) * 100
  const waxing = cycle < 0.5
  const limbSweep = waxing ? 0 : 1 // dark side: left while waxing, right while waning
  const termSweep = (waxing ? lit > 0 : lit < 0) ? 1 : 0
  return `M100 0 A100 100 0 0 ${limbSweep} 100 200 A${rx.toFixed(2)} 100 0 0 ${termSweep} 100 0Z`
}

const hhmm = (iso) => iso?.slice(11, 16) ?? '--:--'

export function Sky() {
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const url = coords ? `/api/sky?lat=${coords.lat}&lon=${coords.lon}` : '/api/sky'
  const { data, error } = useJson(url)
  const apod = useJson('/api/apod')

  const locate = () => {
    if (!navigator.geolocation) return setGeoError('This browser can’t share a location.')
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        setCoords({ lat: c.latitude.toFixed(2), lon: c.longitude.toFixed(2) })
        setLocating(false)
      },
      () => {
        setGeoError('Location not shared, so we’re staying in Shiojiri.')
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 600000 },
    )
    return undefined
  }

  const moon = data?.moon
  return (
    <Chapter id="sky" theme="t-night" number="07" kicker="Live · What the watches are measuring">
      <div className="sky-grid">
        <div className="moon-col">
          <div className="moon-disc" style={moon && Number(data.lat) < 0 ? { transform: 'scaleX(-1)' } : undefined}>
            <img src="/images/moon.webp" alt="" />
            <svg viewBox="0 0 200 200" aria-hidden="true">
              {moon && <path d={shadowPath(moon.cycle)} fill="#050608" fillOpacity=".93" />}
            </svg>
          </div>
        </div>
        <div className="sky-copy">
          <h2 className="title-sky">{moon ? moon.name : error ? 'The sky is unavailable' : 'Reading the sky…'}</h2>
          {moon && <p className="lede">Tonight the Moon is {Math.round(moon.illumination * 100)}% lit and {moon.waxing ? 'growing' : 'shrinking'}. A moon-phase complication works this out with a 59-tooth wheel: two lunar cycles, rounded to a whole day.</p>}
          <div className="specs">
            <div className="spec"><div className="spec-value">{hhmm(data?.sun?.sunrise)}</div><div className="spec-label">Sunrise, local</div></div>
            <div className="spec"><div className="spec-value">{hhmm(data?.sun?.sunset)}</div><div className="spec-label">Sunset, local</div></div>
            <div className="spec"><div className="spec-value">{data?.sun ? Math.round(data.sun.radiation) : '--'}<small> W/m²</small></div><div className="spec-label">Solar radiation</div></div>
          </div>
          <div className="control-row">
            <button type="button" className="pill" disabled={locating} onClick={locate}>{locating ? 'Locating…' : 'Use my location'}</button>
            <span className="fineprint">{geoError || (coords ? `Showing ${data?.sun?.timezone || 'your location'}` : 'Showing Shiojiri, Japan, home of Spring Drive')}</span>
          </div>
        </div>
      </div>

      {apod.data && (
        <a className="apod" href="https://apod.nasa.gov/" target="_blank" rel="noreferrer">
          <img src={apod.data.image} alt={apod.data.title} loading="lazy" />
          <div>
            <div className="control-label">NASA · Astronomy Picture of the Day · {apod.data.date}</div>
            <h3 className="sub-sky">{apod.data.title}</h3>
            <p>{apod.data.explanation.split('. ').slice(0, 2).join('. ')}.</p>
            <p className="fineprint">Credit: {apod.data.credit}</p>
          </div>
        </a>
      )}
    </Chapter>
  )
}

export function Credits() {
  return (
    <footer id="credits" className="credits">
      <div className="wrap">
        <p className="credits-title">Wonders <em>of</em> Watches</p>
        <p className="fineprint credits-note">An independent, educational project, not affiliated with or endorsed by any brand named here. Dial artwork is original illustration. Sky data: Open-Meteo. Picture of the day: NASA. Seven-segment digits: DSEG by Keshikan, SIL Open Font License.</p>
        <h2 className="control-label">Photographs</h2>
        <ul className="credit-list">
          {Object.values(images).map((image) => (
            <li key={image.src}>
              <a href={image.source} target="_blank" rel="noreferrer">{image.subject}</a> — {image.artist}.{' '}
              {image.licenseUrl ? <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a> : image.license}{image.cropped ? '; cropped' : ''}; resized and converted to WebP.
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
