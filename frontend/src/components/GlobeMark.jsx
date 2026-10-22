export default function GlobeMark() {
  return (
    <div className="globe-wrap" aria-hidden="true">
      <div className="globe-glow" />
      <svg className="globe" viewBox="0 0 620 620" role="img">
        <defs>
          <linearGradient id="globeStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0def7" />
            <stop offset="1" stopColor="#d9bde8" />
          </linearGradient>
        </defs>
        <g className="nm-mark">
          <path d="M92 147 C30 205 25 375 92 468" />
          <path d="M92 468 L254 73 L254 542" />
          <path d="M296 542 L296 73 L407 326 L500 197 C550 267 559 395 500 468" />
          <g className="nm-sheen">
            <path d="M92 147 C30 205 25 375 92 468" />
            <path d="M92 468 L254 73 L254 542" />
            <path d="M296 542 L296 73 L407 326 L500 197 C550 267 559 395 500 468" />
          </g>
        </g>
      </svg>
    </div>
  )
}
