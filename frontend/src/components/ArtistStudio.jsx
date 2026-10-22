import { useCallback, useEffect, useState } from "react"
import TrackList from "./TrackList"
import UpgradeCard from "./UpgradeCard"
import { useApi, useProfile } from "@/lib/profile"

const AUDIO_ACCEPT = "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/flac"

function UploadForm({ onUploaded }) {
  const api = useApi()
  const { profile } = useProfile()
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState(() => [profile?.state, profile?.country].filter(Boolean).join(", "))
  const [audio, setAudio] = useState(null)
  const [cover, setCover] = useState(null)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!title.trim() || !audio) return setStatus("Add a title and an audio file.")
    if (audio.size > 25 * 1024 * 1024) return setStatus("Audio must be under 25 MB.")
    const body = new FormData()
    body.append("title", title)
    body.append("location", location)
    body.append("audio", audio)
    if (cover) body.append("cover", cover)
    setBusy(true)
    setStatus("Uploading...")
    try {
      await api("/tracks", { method: "POST", body })
      setTitle(""); setAudio(null); setCover(null)
      e.target.reset()
      setStatus("Published! Your track is live.")
      onUploaded()
    } catch (err) {
      setStatus(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="studio-form" onSubmit={submit} data-testid="studio-upload-form">
      <label htmlFor="track-title">Track title</label>
      <input id="track-title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} data-testid="studio-title-input" />
      <label htmlFor="track-location">Where it's from</label>
      <input id="track-location" value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} data-testid="studio-location-input" />
      <div className="studio-files">
        <label className="file-pick">
          <span>{audio ? audio.name : "Choose audio (MP3, WAV, M4A…)"}</span>
          <input type="file" accept={AUDIO_ACCEPT} onChange={(e) => setAudio(e.target.files?.[0] || null)} data-testid="studio-audio-input" />
        </label>
        <label className="file-pick">
          <span>{cover ? cover.name : "Cover image (optional)"}</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} data-testid="studio-cover-input" />
        </label>
      </div>
      <button type="submit" disabled={busy} data-testid="studio-publish-button">{busy ? "Publishing..." : "Publish Track"}</button>
      <p className="status success" aria-live="polite" data-testid="studio-status">{status}</p>
    </form>
  )
}

export default function ArtistStudio() {
  const api = useApi()
  const { profile } = useProfile()
  const [tracks, setTracks] = useState([])
  const isArtist = profile?.plan_level >= 3

  const load = useCallback(() => {
    api("/tracks/mine").then((r) => r.json()).then(setTracks).catch(() => {})
  }, [api])

  useEffect(() => { if (isArtist) load() }, [isArtist, load])

  async function remove(track) {
    await api(`/tracks/${track.id}`, { method: "DELETE" }).catch(() => {})
    load()
  }

  return (
    <div className="panel-body" data-testid="artist-studio">
      <p className="player-kicker">Artist Studio</p>
      <h2 className="panel-title">Publish Your Music</h2>
      {!isArtist ? (
        <UpgradeCard plan="Artist" testId="studio-upgrade" title="Upload and publish your own music"
          text="The Artist plan ($14.99/mo) lets you upload tracks and share them with listeners around the world." />
      ) : (
        <div className="studio-grid">
          <UploadForm onUploaded={load} />
          <div>
            <h3 className="studio-subtitle">Your tracks</h3>
            <TrackList tracks={tracks} onDelete={remove} emptyText="You haven't published anything yet." />
          </div>
        </div>
      )}
    </div>
  )
}
