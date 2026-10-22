import { useEffect, useState } from "react"
import TrackList from "./TrackList"
import { useApi } from "@/lib/profile"

export default function WorldReleases() {
  const api = useApi()
  const [tracks, setTracks] = useState(null)

  useEffect(() => {
    api("/tracks").then((r) => r.json()).then(setTracks).catch(() => setTracks([]))
  }, [api])

  return (
    <div className="panel-body" data-testid="world-releases">
      <p className="player-kicker">Around the world</p>
      <h2 className="panel-title">New Releases</h2>
      <p className="panel-text">Fresh music published by NewMusiq artists everywhere.</p>
      {tracks === null ? <p className="panel-text">Loading…</p> :
        <TrackList tracks={tracks} emptyText="No artist releases yet. Check back soon." />}
    </div>
  )
}
