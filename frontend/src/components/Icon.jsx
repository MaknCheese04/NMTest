const paths = {
  search: (<><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>),
  profile: (<><circle cx="12" cy="8" r="4" /><path d="M4.8 20c.7-4 3-6 7.2-6s6.5 2 7.2 6" /></>),
  studio: (<><path d="M5 20V9m4 11V4m5 16V7m5 13V11" /><path d="M3 20h18" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>),
  contact: (<><path d="M4 5.5h16v12H8l-4 3v-15Z" /><path d="m5 7 7 5 7-5" /></>),
  previous: (<><path d="M6 5v14" /><path d="m18 6-9 6 9 6V6Z" /></>),
  pause: <path d="M8 5h3v14H8zM14 5h3v14h-3z" />,
  play: <path d="m8 5 11 7-11 7V5Z" />,
  next: (<><path d="M18 5v14" /><path d="m6 6 9 6-9 6V6Z" /></>),
  more: (<>
    <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
  </>),
}

export default function Icon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
