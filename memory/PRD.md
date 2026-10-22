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

## Iteration 2 (2026-10-22)
- Login page first (Clerk sign-in card, email + password) with "New to NewMusiq? Create an Account" link
- Create account: Clerk sign-up on left, plan picker on right (Standard $4.99 / Pro $9.99 / Artist $14.99, monthly, tiered)
- Step 2 profile: photo on top, username (unique), country/state/zip; then Stripe subscription checkout (claimable sandbox, managed tax mode)
- /subscribe (choose/change plan, old subscription cancelled on upgrade), /payment/success polling, /payment/cancel
- Gating: home needs any plan; comments need Pro; Artist Studio upload (audio <=25MB + cover) needs Artist; Search panel lists all artist releases (playable)
- Edit profile: change subscription + delete account (cancels Stripe sub, removes data, deletes Clerk login)
- Globe: state/region borders thinner/darker, hidden at default view, fade in when zoomed or searching a region
- Login screen NM logo: two globes (N, M facing outward) bounce together into still NM logo, repeats every 10s
- Mobile: avatar button in header opens account menu
- Note: username login not possible with managed sign-in (email only); username shown in app

## Backlog
- P1: Real audio playback & track library; nav sections (Search, Artist Studio, Settings, Contact Us) are visual only
- P1: Admin moderation for comments (approve/hide)
- P1: Play artist uploads in the main bottom player; pin releases on the globe by location
- P2: Pins on globe for artists/tracks by region

## Iteration 2 fixes (after test report iteration_2)
- Mobile account menu now above the globe (header z-index)
- Object storage calls retry and return a friendly 502 instead of a crash
- Change plan page preselects the current plan (no accidental downgrade)
- Globe easing is frame-rate independent (searched regions land centered)
- Playing a New Release pauses the demo player

## Iteration 3 (2026-10-22)
- "No thanks, I'm just browsing" option under the 3 plans (sign-up, complete-profile, subscribe pages)
- Browsing users (profile.browsing=true, POST /api/me/browse): globe explore/search only; bottom player replaced by "Browsing mode" bar with See plans; New Releases, comments, Artist Studio locked (backend 403)
