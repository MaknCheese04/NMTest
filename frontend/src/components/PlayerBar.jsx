import { useEffect, useState } from "react"
import Icon from "./Icon"
import Lyrics from "./Lyrics"
import ListenerComments from "./ListenerComments"

const DURATION = 238
const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

export default function PlayerBar() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [progress, setProgress] = useState(74)

  useEffect(() => {
    if (!isPlaying) return
    const t = setInterval(() => setProgress((c) => (c >= DURATION ? 0 : c + 1)), 1000)
    return () => clearInterval(t)
  }, [isPlaying])

  return (
    <div className={`player-bottom-bar ${expanded ? "expanded" : ""}`} data-testid="player-bar"
      onClick={(e) => { if (!expanded && !e.target.closest(".transport, .timeline")) setExpanded(true) }}>
      {expanded && (
        <button className="collapse-player" type="button" aria-label="Collapse player"
          data-testid="player-collapse-button" onClick={() => setExpanded(false)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7" /></svg>
        </button>
      )}
      <div className="bottom-song-summary">
        <div className="mini-album">
          <img src="https://images.unsplash.com/photo-1706512199237-06867557fb85?auto=format&fit=crop&w=500&q=88"
            alt="Flowing gold and purple abstract forms" />
        </div>
        <div className="track-heading">
          <p>Worlds Between Us</p>
          <button className="expand-player-title" type="button" aria-expanded={expanded}
            data-testid="player-track-title" onClick={() => setExpanded(true)}>Golden Moon</button>
          <a href="#artist" data-testid="player-artist-link">Maya Sol</a>
        </div>
      </div>
      <div className="transport">
        <button type="button" aria-label="Previous track" data-testid="player-prev-button" onClick={() => setProgress(0)}>
          <Icon name="previous" />
        </button>
        <button className="play-pause" type="button" aria-label={isPlaying ? "Pause" : "Play"}
          data-testid="player-play-pause-button" onClick={() => setIsPlaying((p) => !p)}>
          <Icon name={isPlaying ? "pause" : "play"} />
        </button>
        <button type="button" aria-label="Next track" data-testid="player-next-button" onClick={() => setProgress(0)}>
          <Icon name="next" />
        </button>
      </div>
      <div className="timeline">
        <input aria-label="Song progress" type="range" min="0" max={DURATION} value={progress}
          data-testid="player-progress" onChange={(e) => setProgress(Number(e.target.value))}
          style={{ "--progress": `${(progress / DURATION) * 100}%` }} />
        <div>
          <span data-testid="player-elapsed">{formatTime(progress)}</span>
          <span>-{formatTime(DURATION - progress)}</span>
        </div>
      </div>
      {expanded && <Lyrics progress={progress} duration={DURATION} />}
      {expanded && <ListenerComments />}
    </div>
  )
}
