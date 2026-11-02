import { useEffect, useRef, useState } from 'react'

/**
 * Runs `callback(nowMs, dtSeconds)` every animation frame while `ref` is on screen.
 * Hands are moved by writing to the DOM directly, so a sweep never re-renders React.
 */
export function useFrame(ref, callback) {
  const latest = useRef(callback)
  latest.current = callback

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    let raf = 0
    let last = 0
    let running = false

    const tick = (now) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0
      last = now
      latest.current(now, dt)
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // Run one frame regardless, so dials show the right time before scrolling to them.
    latest.current(performance.now(), 0)
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [ref])
}

export function useJson(url) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    if (!url) return undefined
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false })
      })
    return () => controller.abort()
  }, [url])
  return state
}

/** Wall-clock hand angles in degrees. */
export function clockAngles(date = new Date()) {
  const s = date.getSeconds() + date.getMilliseconds() / 1000
  const m = date.getMinutes() + s / 60
  const h = (date.getHours() % 12) + m / 60
  return { s: s * 6, m: m * 6, h: h * 30, seconds: s }
}

export const pad = (n, width = 2) => String(Math.trunc(n)).padStart(width, '0')

let audio
export function audioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  audio = audio || new Ctx()
  if (audio.state === 'suspended') audio.resume()
  return audio
}
