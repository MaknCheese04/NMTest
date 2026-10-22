import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import PlayerBar from "./PlayerBar"
import BrowseBar from "./BrowseBar"
import { PlayerProvider, usePlayer } from "@/lib/player"
import { LibraryProvider } from "@/lib/library"

function Shell() {
  const player = usePlayer()
  return (
    <main className="player-page" data-testid="player-page">
      <Sidebar />
      <section className="now-playing">
        <Outlet />
        {player.listener || player.track ? <PlayerBar /> : <BrowseBar />}
      </section>
    </main>
  )
}

export default function PlayerScreen() {
  return <PlayerProvider><LibraryProvider><Shell /></LibraryProvider></PlayerProvider>
}
