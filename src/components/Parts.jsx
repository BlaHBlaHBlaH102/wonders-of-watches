import images from '../data/images.json'

export function Ticks({ cx = 200, cy = 200, r, length, count = 60, width = 1, skip, color = 'currentColor', opacity = 1 }) {
  const lines = []
  for (let i = 0; i < count; i += 1) {
    if (skip && i % skip === 0) continue
    const a = (i * 360) / count
    lines.push(
      <line key={i} x1={cx} y1={cy - r} x2={cx} y2={cy - r + length} transform={`rotate(${a} ${cx} ${cy})`} stroke={color} strokeWidth={width} opacity={opacity} />,
    )
  }
  return <g>{lines}</g>
}

export function Photo({ slug, alt, className = '', caption = true }) {
  const image = images[slug]
  if (!image) return null
  return (
    <figure className={`photo ${className}`}>
      <img src={image.src} width={image.width} height={image.height} alt={alt || image.subject} loading="lazy" decoding="async" />
      {caption && (
        <figcaption>
          {image.subject}. <a href="#credits">{image.artist}, {image.license}</a>
        </figcaption>
      )}
    </figure>
  )
}

export function Chapter({ id, theme, number, kicker, children }) {
  return (
    <section id={id} className={`chapter ${theme}`}>
      <div className="wrap">
        <header className="chapter-mark">
          <span className="chapter-no">{number}</span>
          <span className="chapter-kicker">{kicker}</span>
        </header>
        {children}
      </div>
    </section>
  )
}

export function Spec({ label, value, small }) {
  return (
    <div className="spec">
      <div className="spec-value">{value}{small && <small>{small}</small>}</div>
      <div className="spec-label">{label}</div>
    </div>
  )
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" role="radio" aria-checked={value === option.value} className={value === option.value ? 'on' : ''} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Gallery({ slugs }) {
  return (
    <div className="gallery" tabIndex={0} role="group" aria-label="Photo gallery, scroll sideways">
      {slugs.map((slug) => <Photo key={slug} slug={slug} />)}
    </div>
  )
}
