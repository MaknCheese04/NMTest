const CONTENT = {
  settings: {
    kicker: "Settings",
    title: "Your Settings",
    text: "Use the account menu to edit your profile, change your plan or sign out. More settings are coming soon.",
  },
  contact: {
    kicker: "Contact Us",
    title: "We'd love to hear from you",
    text: "Questions about your plan or the app? Email support@newmusiq.app and we'll get back to you.",
  },
}

export default function InfoPanel({ kind }) {
  const c = CONTENT[kind]
  return (
    <div className="panel-body" data-testid={`info-panel-${kind}`}>
      <p className="player-kicker">{c.kicker}</p>
      <h2 className="panel-title">{c.title}</h2>
      <p className="panel-text">{c.text}</p>
    </div>
  )
}
