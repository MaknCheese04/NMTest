import { useCallback, useEffect, useState } from "react"
import Sidebar, { Avatar } from "./Sidebar"
import AccountMenu from "./AccountMenu"
import GlobeSearch from "./GlobeSearch"
import EarthGlobe from "./EarthGlobe"
import PlayerBar from "./PlayerBar"
import ArtistStudio from "./ArtistStudio"
import WorldReleases from "./WorldReleases"
import InfoPanel from "./InfoPanel"
import BrowseBar from "./BrowseBar"
import { useApi } from "@/lib/profile"
import { PlayerProvider, usePlayer } from "@/lib/player"

const PANELS = {
  Search: WorldReleases,
  "Artist Studio": ArtistStudio,
  Settings: () => <InfoPanel kind="settings" />,
  "Contact Us": () => <InfoPanel kind="contact" />,
}

function Home() {
  const api = useApi()
  const player = usePlayer()
  const [globeLocation, setGlobeLocation] = useState(null)
  const [activeNav, setActiveNav] = useState("Profile")
  const [mobileMenu, setMobileMenu] = useState(false)
  const [tracks, setTracks] = useState(null)
  const Panel = PANELS[activeNav]

  const loadTracks = useCallback(() => {
    api("/tracks").then((r) => r.json()).then(setTracks).catch(() => setTracks([]))
  }, [api])
  useEffect(() => { loadTracks() }, [loadTracks])

  return (
    <main className="player-page" data-testid="player-page">
      <Sidebar activeNav={activeNav} onNav={setActiveNav} />
      <section className="now-playing" aria-label="Now playing">
        <header className="player-header">
          <GlobeSearch onLocate={(loc) => { setGlobeLocation(loc); setActiveNav("Profile") }} />
          <div className="live-indicator" data-testid="live-indicator"><span />Live session</div>
          <div className="mobile-account">
            <button type="button" className="mobile-account-button" aria-label="Account" aria-expanded={mobileMenu}
              data-testid="mobile-account-button" onClick={() => setMobileMenu((o) => !o)}>
              <Avatar className="profile-avatar mobile-avatar" />
            </button>
            {mobileMenu && <AccountMenu idPrefix="mobile-account-menu" className="from-top" />}
          </div>
        </header>
        <div className="player-content">
          <EarthGlobe targetLocation={globeLocation} pins={tracks || []} onPinClick={(t) => player.play(t)} />
          {player.error && !Panel && <p className="pin-error" data-testid="pin-play-error">{player.error}</p>}
          {Panel && (
            <div className="nav-panel" data-testid="nav-panel">
              <button type="button" className="nav-panel-close" aria-label="Close panel"
                data-testid="nav-panel-close" onClick={() => setActiveNav("Profile")}>×</button>
              <Panel tracks={tracks} onChanged={loadTracks} />
            </div>
          )}
        </div>
        {player.listener || player.track ? <PlayerBar /> : <BrowseBar />}
      </section>
    </main>
  )
}

export default function PlayerScreen() {
  return <PlayerProvider><Home /></PlayerProvider>
}
