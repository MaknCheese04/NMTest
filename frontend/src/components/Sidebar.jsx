import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useClerk } from "@clerk/react"
import Icon from "./Icon"
import { initials, useProfile } from "@/lib/profile"

const navItems = [
  { label: "Search", icon: "search" },
  { label: "Profile", icon: "profile" },
  { label: "Artist Studio", icon: "studio" },
  { label: "Settings", icon: "settings" },
  { label: "Contact Us", icon: "contact" },
]

const slug = (s) => s.toLowerCase().replace(/\s+/g, "-")

export default function Sidebar() {
  const [activeNav, setActiveNav] = useState("Profile")
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile, photoUrl } = useProfile()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  return (
    <aside className="player-sidebar">
      <button className="player-wordmark" type="button" data-testid="player-wordmark">NewMusiq</button>
      <nav className="player-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.label} type="button" className={activeNav === item.label ? "active" : ""}
            data-testid={`nav-${slug(item.label)}`} onClick={() => setActiveNav(item.label)}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-profile" data-testid="sidebar-profile">
        <div className="profile-avatar" data-testid="sidebar-avatar">
          {photoUrl ? <img src={photoUrl} alt="" className="profile-avatar-img" /> : initials(profile?.display_name)}
        </div>
        <div>
          <strong data-testid="sidebar-display-name">{profile?.display_name}</strong>
          <span>Listener</span>
        </div>
        <button type="button" aria-label="More account options" aria-expanded={menuOpen}
          data-testid="account-menu-button" onClick={() => setMenuOpen((o) => !o)}>
          <Icon name="more" />
        </button>
        {menuOpen && (
          <div className="account-menu" role="menu" data-testid="account-menu">
            <button type="button" role="menuitem" data-testid="account-menu-edit-profile"
              onClick={() => navigate("/complete-profile")}>Edit profile</button>
            <button type="button" role="menuitem" data-testid="account-menu-sign-out"
              onClick={() => signOut({ redirectUrl: "/sign-in" })}>Sign out</button>
          </div>
        )}
      </div>
    </aside>
  )
}
