import { useState } from "react"
import Sidebar from "./Sidebar"
import GlobeSearch from "./GlobeSearch"
import EarthGlobe from "./EarthGlobe"
import PlayerBar from "./PlayerBar"

export default function PlayerScreen() {
  const [globeLocation, setGlobeLocation] = useState(null)

  return (
    <main className="player-page" data-testid="player-page">
      <Sidebar />
      <section className="now-playing" aria-label="Now playing">
        <header className="player-header">
          <GlobeSearch onLocate={setGlobeLocation} />
          <div className="live-indicator" data-testid="live-indicator"><span />Live session</div>
        </header>
        <div className="player-content">
          <EarthGlobe targetLocation={globeLocation} />
        </div>
        <PlayerBar />
      </section>
    </main>
  )
}
