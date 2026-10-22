import { useEffect, useState } from "react"
import TrackList from "./TrackList"
import UpgradeCard from "./UpgradeCard"
import { useApi, useProfile } from "@/lib/profile"

export default function WorldReleases() {
  const api = useApi()
  const [tracks, setTracks] = useState(null)
  const { profile } = useProfile()
  const listener = (profile?.plan_level || 0) >= 1

  useEffect(() => {
    if (!listener) return
    api("/tracks").then((r) => r.json()).then(setTracks).catch(() => setTracks([]))
  }, [api, listener])

  return (
    <div className="panel-body" data-testid="world-releases">
      <p className="player-kicker">Around the world</p>
      <h2 className="panel-title">New Releases</h2>
      <p className="panel-text">Fresh music published by NewMusiq artists everywhere.</p>
      {!listener ? (
        <UpgradeCard plan="Standard Listener" testId="releases-upgrade" title="Listen to the world"
          text="You're browsing for free. Standard Listener ($4.99/mo) lets you play music from artists everywhere." />
      ) : tracks === null ? <p className="panel-text">Loading…</p> :
        <TrackList tracks={tracks} emptyText="No artist releases yet. Check back soon." />}
    </div>
  )
}
