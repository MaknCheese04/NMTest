import { useEffect, useRef, useState } from "react"
import { useApi } from "@/lib/profile"

function Cover({ track }) {
  const api = useApi()
  const [url, setUrl] = useState("")
  useEffect(() => {
    if (!track.has_cover) return
    let made = ""
    api(`/tracks/${track.id}/cover`).then((r) => r.blob()).then((b) => { made = URL.createObjectURL(b); setUrl(made) }).catch(() => {})
    return () => made && URL.revokeObjectURL(made)
  }, [api, track.id, track.has_cover])
  return <div className="track-cover">{url ? <img src={url} alt="" /> : <span>♪</span>}</div>
}

export default function TrackList({ tracks, onDelete, emptyText }) {
  const api = useApi()
  const audio = useRef(null)
  const [playing, setPlaying] = useState(null)
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => () => { audio.current?.pause(); if (audio.current?.src) URL.revokeObjectURL(audio.current.src) }, [])

  async function toggle(track) {
    if (playing === track.id) { audio.current.pause(); return setPlaying(null) }
    setLoading(track.id)
    setError("")
    try {
      const blob = await (await api(`/tracks/${track.id}/audio`)).blob()
      if (audio.current.src) URL.revokeObjectURL(audio.current.src)
      audio.current.src = URL.createObjectURL(blob)
      await audio.current.play()
      setPlaying(track.id)
    } catch (e) {
      setError(e.message || "Couldn't play this track.")
    } finally {
      setLoading(null)
    }
  }

  if (!tracks.length) return <p className="panel-text" data-testid="track-list-empty">{emptyText}</p>
  return (
    <div className="track-list" data-testid="track-list">
      <audio ref={audio} onEnded={() => setPlaying(null)} />
      {error && <p className="status" data-testid="track-play-error">{error}</p>}
      {tracks.map((t) => (
        <article className="track-row" key={t.id} data-testid="track-row">
          <Cover track={t} />
          <div className="track-info">
            <strong>{t.title}</strong>
            <span>{t.artist_name}{t.location ? ` · ${t.location}` : ""}</span>
          </div>
          <button type="button" className="track-play" data-testid={`track-play-${t.id}`} onClick={() => toggle(t)}>
            {loading === t.id ? "…" : playing === t.id ? "Pause" : "Play"}
          </button>
          {onDelete && t.mine && (
            <button type="button" className="track-delete" data-testid={`track-delete-${t.id}`} onClick={() => onDelete(t)}>
              Remove
            </button>
          )}
        </article>
      ))}
    </div>
  )
}
