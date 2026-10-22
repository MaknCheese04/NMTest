import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Screen from "./Screen"
import SongItem from "../SongItem"
import { Avatar } from "../Sidebar"
import { useApi, useProfile } from "@/lib/profile"
import { keyOf, useLibrary } from "@/lib/library"

function Playlists() {
  const lib = useLibrary()
  const [name, setName] = useState("")
  const [open, setOpen] = useState(null)
  return (
    <section className="screen-section" data-testid="profile-playlists">
      <h2>Your playlists</h2>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { lib.createPlaylist(name.trim()); setName("") } }}>
        <input value={name} maxLength={60} placeholder="New playlist name" onChange={(e) => setName(e.target.value)} data-testid="playlist-name-input" />
        <button type="submit" data-testid="playlist-create-button">Create playlist</button>
      </form>
      <div className="playlist-grid">
        {lib.playlists.map((p) => (
          <button key={p.id} type="button" className={`playlist-card ${open === p.id ? "open" : ""}`} data-testid={`playlist-${p.id}`}
            onClick={() => setOpen(open === p.id ? null : p.id)}>
            <span className="playlist-art">{p.items[0]?.artwork ? <img src={p.items[0].artwork} alt="" /> : "♪"}</span>
            <strong>{p.name}</strong><em>{p.items.length} songs</em>
          </button>
        ))}
      </div>
      {lib.playlists.filter((p) => p.id === open).map((p) => (
        <div key={p.id} className="playlist-detail" data-testid="playlist-detail">
          <div className="playlist-detail-head">
            <h3>{p.name}</h3>
            <button type="button" className="ghost-btn" onClick={() => { lib.deletePlaylist(p.id); setOpen(null) }} data-testid="playlist-delete">Delete playlist</button>
          </div>
          {p.items.length ? <div className="song-list">{p.items.map((it) => (
            <SongItem key={keyOf(it)} item={it} extra={<button type="button" className="ghost-btn small" onClick={() => lib.removeFromPlaylist(p.id, it)}>Remove</button>} />
          ))}</div> : <p className="rp-muted">Add songs with the + button on any song.</p>}
        </div>
      ))}
    </section>
  )
}

export default function ProfileScreen() {
  const api = useApi()
  const navigate = useNavigate()
  const { profile } = useProfile()
  const lib = useLibrary()
  const [visits, setVisits] = useState([])
  const [comments, setComments] = useState([])

  useEffect(() => {
    api("/me/visits").then((r) => r.json()).then(setVisits).catch(() => {})
    api("/me/comments").then((r) => r.json()).then(setComments).catch(() => {})
  }, [api])

  return (
    <Screen kicker="Your library" title={profile?.username || "Profile"} testId="profile-screen"
      actions={<div className="profile-head-meta"><Avatar className="profile-avatar big" /><span>{profile?.plan_name || "Browsing"}</span></div>}>
      <section className="screen-section" data-testid="profile-liked">
        <h2>Liked songs</h2>
        {lib.likes.length ? <div className="song-list">{lib.likes.map((l) => <SongItem key={l.key} item={l} />)}</div>
          : <p className="rp-muted">Tap the heart on any song to save it here.</p>}
      </section>
      <Playlists />
      <section className="screen-section" data-testid="profile-places">
        <h2>Most visited places</h2>
        {visits.length ? <div className="rp-chips">{visits.map((v) => (
          <button key={v.country + v.state} type="button" className="rp-chip" data-testid="profile-place"
            onClick={() => navigate("/", { state: { focus: v } })}>{v.state || v.country}<span>{v.count}</span></button>
        ))}</div> : <p className="rp-muted">Click places on the globe to explore their music.</p>}
      </section>
      <section className="screen-section" data-testid="profile-comments">
        <h2>Your comments</h2>
        {comments.length ? comments.map((c) => (
          <button key={c.id} type="button" className="comment-link" data-testid="profile-comment"
            onClick={() => navigate("/", { state: c.region ? { focus: c.region } : { openPlayer: true } })}>
            <strong>{c.region ? (c.region.state || c.region.country) : "Golden Moon · Maya Sol"}</strong>
            <span>{c.message}</span>
            <em>{c.status === "approved" ? "Visible to everyone" : c.status === "hidden" ? "Hidden by moderators" : "Awaiting review"}</em>
          </button>
        )) : <p className="rp-muted">Comments you leave will show up here.</p>}
      </section>
    </Screen>
  )
}
