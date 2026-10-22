import TrackList from "./TrackList"
import UpgradeCard from "./UpgradeCard"
import { useProfile } from "@/lib/profile"

export default function WorldReleases({ tracks }) {
  const { profile } = useProfile()
  const listener = (profile?.plan_level || 0) >= 1

  return (
    <div className="panel-body" data-testid="world-releases">
      <p className="player-kicker">Around the world</p>
      <h2 className="panel-title">New Releases</h2>
      <p className="panel-text">Fresh music published by NewMusiq artists everywhere. Tap a glowing pin on the globe to play from that place.</p>
      {!listener && (
        <div className="releases-upgrade-wrap">
          <UpgradeCard plan="Standard Listener" testId="releases-upgrade" title="You're hearing 15-second previews"
            text="Standard Listener ($4.99/mo) unlocks full tracks from artists everywhere." />
        </div>
      )}
      {tracks === null ? <p className="panel-text">Loading…</p> :
        <TrackList tracks={tracks} emptyText="No artist releases yet. Check back soon." />}
    </div>
  )
}
