import { useEffect, useState } from "react"
import { useApi } from "@/lib/profile"
import { usePlayer } from "@/lib/player"
import { regionPattern } from "@/lib/patterns"

const fmtDuration = (ms) => { const s = Math.round((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` }

function useFetch(path) {
  const api = useApi()
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  useEffect(() => {
    setData(null); setError("")
    api(path).then((r) => r.json()).then(setData).catch((e) => setError(e.message))
  }, [api, path])
  return { data, error }
}

function SongRow({ song, rank, onOpen }) {
  return (
    <button type="button" className="rp-song" onClick={() => onOpen(song)} data-testid={`region-song-${song.id}`}>
      {rank && <span className="rp-rank">{rank}</span>}
      {song.artwork ? <img src={song.artwork} alt="" /> : <span className="rp-art-fallback">♪</span>}
      <span className="rp-song-text"><strong>{song.title}</strong><em>{song.artist}</em></span>
    </button>
  )
}

function Loading({ error }) {
  return <p className="rp-muted">{error || "Loading…"}</p>
}

function SongView({ songId, country }) {
  const { data: song, error } = useFetch(`/music/song/${songId}?country=${(country || "us").toLowerCase()}`)
  const player = usePlayer()
  if (!song) return <Loading error={error} />
  const current = player.track?.id === `it-${song.id}`
  return (
    <div className="rp-song-detail" data-testid="region-song-detail">
      {song.artwork && <img src={song.artwork.replace("300x300", "600x600")} alt="" />}
      <div>
        <p className="player-kicker">{song.genre}</p>
        <h3>{song.title}</h3>
        <p className="rp-artist">{song.artist}</p>
        <dl>
          <div><dt>Album</dt><dd>{song.album}</dd></div>
          <div><dt>Released</dt><dd>{song.release_date}</dd></div>
          <div><dt>Length</dt><dd>{fmtDuration(song.duration_ms)}</dd></div>
        </dl>
        <div className="rp-actions">
          <button type="button" disabled={!song.preview_url} onClick={() => player.playSong(song)} data-testid="region-song-play">
            {current && player.isPlaying ? "Pause" : song.preview_url ? "Play preview" : "No preview"}
          </button>
          {song.apple_url && <a href={song.apple_url} target="_blank" rel="noreferrer" data-testid="region-song-apple">Open in Apple Music</a>}
        </div>
        {player.error && <p className="status" data-testid="region-play-error">{player.error}</p>}
      </div>
    </div>
  )
}

function HeritageView({ genreId, regionKey, onOpen }) {
  const { data, error } = useFetch(`/music/heritage/${genreId}?region_key=${encodeURIComponent(regionKey)}`)
  if (!data) return <Loading error={error} />
  return (
    <div data-testid="region-heritage-detail">
      <h3 className="rp-title">{data.name}</h3>
      <p className="rp-summary" data-testid="region-heritage-summary">{data.summary}</p>
      <p className="rp-label">Songs from this region</p>
      <div className="rp-list">{data.songs.map((s) => <SongRow key={s.id} song={s} onOpen={onOpen} />)}</div>
    </div>
  )
}

function PlaylistView({ genre, country, onOpen }) {
  const { data, error } = useFetch(`/music/playlist?genre=${encodeURIComponent(genre)}&country=${(country || "us").toLowerCase()}`)
  if (!data) return <Loading error={error} />
  return (
    <div data-testid="region-playlist">
      <h3 className="rp-title">{genre} Playlist</h3>
      <p className="rp-muted">Generated from Apple Music · {data.songs.length} songs</p>
      <div className="rp-list">{data.songs.map((s, i) => <SongRow key={s.id} song={s} rank={i + 1} onOpen={onOpen} />)}</div>
    </div>
  )
}

function Overview({ data, onView }) {
  const updated = data.chart_updated ? new Date(data.chart_updated).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : ""
  return (
    <div className="rp-overview">
      <section data-testid="region-heritage">
        <p className="rp-label">Music genres from this area</p>
        {data.heritage.length ? (
          <div className="rp-chips">
            {data.heritage.map((g) => (
              <button key={g.id} type="button" className="rp-chip" onClick={() => onView({ type: "heritage", id: g.id })}
                data-testid={`region-heritage-${g.id}`}>{g.name}</button>
            ))}
          </div>
        ) : <p className="rp-muted">Genre stories for this area are coming soon.</p>}
      </section>
      <section data-testid="region-top-genres">
        <p className="rp-label">Top genres right now</p>
        {data.top_genres.length ? (
          <div className="rp-chips">
            {data.top_genres.map((g) => (
              <button key={g.name} type="button" className="rp-chip live" onClick={() => onView({ type: "playlist", genre: g.name })}
                data-testid={`region-genre-${g.name.replace(/\W+/g, "-").toLowerCase()}`}>
                {g.name}<span>{g.count}</span>
              </button>
            ))}
          </div>
        ) : <p className="rp-muted">No live chart is published for this area.</p>}
      </section>
      <section data-testid="region-top-songs">
        <p className="rp-label">Top songs right now</p>
        {data.top_songs.length ? (
          <>
            <p className="rp-muted">Live Apple Music chart · {data.chart_scope}{data.state ? " (state charts aren't published)" : ""}{updated ? ` · updated ${updated}` : ""}</p>
            <div className="rp-list">
              {data.top_songs.map((s, i) => <SongRow key={s.id} song={s} rank={i + 1} onOpen={(song) => onView({ type: "song", id: song.id })} />)}
            </div>
          </>
        ) : <p className="rp-muted">No live chart is published for this area.</p>}
      </section>
    </div>
  )
}

export default function RegionPopup({ region, onClose }) {
  const params = `country=${encodeURIComponent(region.country)}&state=${encodeURIComponent(region.state)}`
  const { data, error } = useFetch(`/music/region?${params}`)
  const [stack, setStack] = useState([])
  const view = stack[stack.length - 1]
  const push = (v) => setStack((s) => [...s, v])
  const openSong = (song) => push({ type: "song", id: song.id })
  const pattern = regionPattern(region.country, region.state)

  useEffect(() => { setStack([]) }, [params])

  return (
    <div className="region-popup" role="dialog" aria-label={`Music of ${region.state || region.country}`} data-testid="region-popup">
      <div className="rp-border left" style={{ backgroundImage: pattern.image }} data-testid={`region-border-${pattern.key}`} aria-hidden="true" />
      <div className="rp-body">
        <header className="rp-header">
          {view ? (
            <button type="button" className="rp-back" onClick={() => setStack((s) => s.slice(0, -1))} data-testid="region-back">← Back</button>
          ) : <p className="player-kicker">{region.state ? region.country.replace(" of America", "") : "Country"}</p>}
          <h2 data-testid="region-name">{region.state || region.country}</h2>
          <button type="button" className="rp-close" aria-label="Close" onClick={onClose} data-testid="region-close">×</button>
        </header>
        <div className="rp-scroll">
          {!data ? <Loading error={error} /> :
            !view ? <Overview data={data} onView={push} /> :
            view.type === "heritage" ? <HeritageView genreId={view.id} regionKey={data.region_key} onOpen={openSong} /> :
            view.type === "playlist" ? <PlaylistView genre={view.genre} country={data.country_code} onOpen={openSong} /> :
            <SongView songId={view.id} country={data.country_code} />}
        </div>
      </div>
      <div className="rp-border right" style={{ backgroundImage: pattern.image }} aria-hidden="true" />
    </div>
  )
}
