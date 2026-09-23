# VidTube — Frontend

React single-page app for the VidTube video platform. Talks to the Express +
MongoDB backend that lives in `../../Backend/vidtube backend`.

Built with React 19, React Router 7, Tailwind CSS 3, Axios and Vite.

---

## Running it

The backend must be running first — it owns the database and Cloudinary uploads.

```bash
# terminal 1 — API on :8000
cd "../../Backend/vidtube backend"
npm install
npm run dev

# terminal 2 — this app on :5173
npm install
npm run dev
```

Then open <http://localhost:5173>.

### Why the dev proxy matters

`vite.config.js` proxies `/api` to `http://localhost:8000`, and `.env` sets
`VITE_API_BASE_URL=/api/v1`. That makes every API call same-origin, so the
backend's `httpOnly` auth cookies are actually stored and sent back. Point the
app straight at `http://localhost:8000` instead and the browser will drop those
cookies.

Copy `.env.example` to `.env` to get started. `.env` is gitignored — no secrets
live in this repo, and the app holds no API keys of its own (Cloudinary and the
JWT secrets stay on the server).

> **Tailwind config changes need a dev-server restart.** Vite does not reliably
> pick up edits to `tailwind.config.js`, and the symptom is confusing: classes
> silently stop being generated. Restart `npm run dev` after touching it.

---

## Pages

| Route | What it does | Auth |
| --- | --- | --- |
| `/` | Video grid, category filters, infinite scroll | public |
| `/watch/:videoId` | Player, likes, subscribe, comments, up-next | public |
| `/c/:username` | Channel: videos, playlists, community, about | public |
| `/search?q=` | Video results + matching channel, sortable | public |
| `/community` | Community post feed, create/edit/delete | public (post: auth) |
| `/playlist/:id` | Playlist detail, reorder-free list, owner controls | public |
| `/subscriptions` | Merged feed from channels you follow | auth |
| `/history` | Watch history | auth |
| `/liked-videos` | Everything you liked | auth |
| `/playlists` | Your playlists, create / edit / delete | auth |
| `/studio` | Stats, upload, edit, visibility toggle, delete | auth |
| `/settings` | Profile, branding, appearance, password, sign out | auth |
| `/login`, `/register` | Auth, captcha-gated | signed out only |
| `*` | Not found | public |

---

## How a few things work

**Auth.** `AuthContext` holds the session. The backend sets `httpOnly` cookies
*and* returns the tokens in the body; `api/axios.js` sends the cookie and an
`Authorization: Bearer` header, and transparently refreshes once on a 401,
queueing any requests that raced it. A failed refresh fires an `auth:logout`
event that clears the UI.

**Captcha.** `/login` and `/register` are gated by a self-hosted captcha — no
third-party service and no keys to leak. `GET /api/v1/captcha` returns an id and
a distorted SVG; the expected answer never leaves the server. Challenges are
single use and expire after five minutes, and the glyphs are drawn as resampled,
sheared vector paths with decoy strokes, so the answer cannot be recovered by
reading the SVG markup.

**Theming.** Every neutral is a CSS variable (`src/index.css`), and
`tailwind.config.js` maps Tailwind's colours onto them. Flipping `data-theme` on
`<html>` re-themes the whole app, so `text-white` means "strongest text" in both
modes rather than literally white. Three consequences worth knowing:

- Text on a coloured fill uses `text-on-accent`, which never flips.
- The video player carries its own `data-theme="dark"` — player chrome sits over
  video, not over a page surface, so it stays dark in light mode.
- Transitions are suppressed for one frame during a switch, otherwise each
  component eases to its new colour at its own duration and the page changes
  raggedly.

An inline script in `index.html` applies the stored theme before first paint to
avoid a flash.

**Infinite scroll.** `hooks/useInfiniteScroll.js` wraps an `IntersectionObserver`
and fires ~600px before the sentinel is visible. Browsers without the API fall
back to a visible "load more" button.

**Video player.** `components/video/VideoPlayer.jsx` is custom, not the native
control set: scrubbing with buffered range and hover preview, a configurable
skip step (5/10/15/30s) with double-tap zones, volume slider plus step buttons,
playback speed, loop, picture-in-picture, theater mode and fullscreen. Keyboard:
`k`/space, `j`/`l`, arrows, `m`, `f`, `t`, `i`, `0`–`9`, `<`/`>`.

**Fonts.** Body copy is Inter. Headings and the wordmark use **Epic Pro**
(`src/assets/fonts`). The demo weights ship letters only, so digits and
punctuation are served from an earlier cut of the same family via
`unicode-range`. Epic Pro's demo licence is **personal use only** — buy a
commercial licence before launching commercially. See
`src/assets/fonts/EpicPro-LICENSE.txt`.

---

## Notes on the backend

Several fixes were made alongside this frontend:

- **Ownership checks** on update/delete for videos, comments, tweets and
  playlists. Previously any signed-in user could delete anyone's content.
- `updateVideo` no longer demands a new thumbnail, so titles can be edited alone.
- `getWatchHistory` joined `video.owner` (a username string) against `user._id`,
  so history always came back with an empty owner.
- Liked videos and playlists now hydrate `owner` into a full object
  (`utils/hydrateVideoOwners.js`) instead of leaving a bare username.
- `registerUser` returned a 500 when no avatar was sent; it is a 400 now.
- A global error handler so failures return JSON instead of an HTML error page.

`video.owner` is stored as the creator's **username**, not an ObjectId — a
deliberate quirk of the existing schema. `utils/helpers.js#getVideoOwner`
normalises both shapes on the client.

---

## Testing

`npm run build` and `npm run lint` must both pass.

An end-to-end suite exercising every endpoint the app calls lives outside the
repo (it writes to the live database). It covers public browsing, captcha
enforcement, profile and password changes, posts, comments, likes, playlists,
subscriptions, history, dashboard, ownership rejections (403) and input
validation (400).

Because the captcha answer is server-side only, the suite cannot log itself in.
Solve one challenge by hand, then hand it the session:

```bash
E2E_TOKEN=... E2E_USER_ID=... E2E_USERNAME=... E2E_PASSWORD=... ./e2e.sh
```
