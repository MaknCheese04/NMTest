# NewMusiq — PRD

## Original problem statement
"Copy what exists in the following link so I can expand on it: https://plug-fax-36444509.figma.site"
User choices: real accounts (sign up / log in), land on the existing home page after login, profile photo saved and shown.

## Architecture
- Original Figma Make export (Next.js + Payload CMS) preserved in /app/figma_source (reference only).
- Ported to: Vite + React 19 frontend (/app/frontend), FastAPI backend (/app/backend), MongoDB.
- Auth: Emergent-managed Clerk (email + password). Profile data in Mongo `profiles` keyed by Clerk user_id.
- Photos: Emergent object storage (path newmusiq/avatars/{user_id}/...), served via authenticated GET /api/me/photo.
- Comments: Mongo `comments`, new comments are "pending"; listeners see approved + their own pending.
- Globe: three.js with world-atlas countries + admin-1 borders; search by country (client) or any place (/api/geo/search → OpenStreetMap Nominatim).

## Implemented (2026-10-22)
- Login page & Create account page with original split layout, NewMusiq wordmark, animated NM mark
- Profile completion step (photo, display name, country, state, zip) after sign-up; edit profile from account menu
- Home/player: sidebar nav, 3D globe (drag/zoom/fit/search), live indicator, player bar, expanded player w/ synced lyrics and listener comments
- Sign out from account menu

## Backlog
- P1: Real audio playback & track library; nav sections (Search, Artist Studio, Settings, Contact Us) are visual only
- P1: Admin moderation for comments (approve/hide)
- P2: Pins on globe for artists/tracks by region
