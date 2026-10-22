import { useState } from "react"
import Icon from "./Icon"
import AccountMenu from "./AccountMenu"
import { initials, useProfile } from "@/lib/profile"

export const navItems = [
  { label: "Search", icon: "search" },
  { label: "Profile", icon: "profile" },
  { label: "Artist Studio", icon: "studio" },
  { label: "Settings", icon: "settings" },
  { label: "Contact Us", icon: "contact" },
]

const slug = (s) => s.toLowerCase().replace(/\s+/g, "-")

export function Avatar({ className = "profile-avatar", testId }) {
  const { profile, photoUrl } = useProfile()
  return (
    <div className={className} data-testid={testId}>
      {photoUrl ? <img src={photoUrl} alt="" className="profile-avatar-img" /> : initials(profile?.username)}
    </div>
  )
}

export default function Sidebar({ activeNav, onNav }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { profile } = useProfile()

  return (
    <aside className="player-sidebar">
      <button className="player-wordmark" type="button" data-testid="player-wordmark" onClick={() => onNav("Profile")}>NewMusiq</button>
      <nav className="player-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <button key={item.label} type="button" className={activeNav === item.label ? "active" : ""}
            data-testid={`nav-${slug(item.label)}`} onClick={() => onNav(item.label)}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-profile" data-testid="sidebar-profile">
        <Avatar testId="sidebar-avatar" />
        <div>
          <strong data-testid="sidebar-display-name">{profile?.username}</strong>
          <span data-testid="sidebar-plan-name">{profile?.plan_name || (profile?.browsing ? "Browsing" : "Listener")}</span>
        </div>
        <button type="button" aria-label="More account options" aria-expanded={menuOpen}
          data-testid="account-menu-button" onClick={() => setMenuOpen((o) => !o)}>
          <Icon name="more" />
        </button>
        {menuOpen && <AccountMenu />}
      </div>
    </aside>
  )
}
