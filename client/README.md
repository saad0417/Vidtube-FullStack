# VidTube: Frontend

React single-page app for the VidTube video platform. It talks to the Express + MongoDB API in [`../server`](../server). See the [root README](../README.md) for an overview of the whole project.

**Live:** https://vidtubeofficial.vercel.app

Built with React 19, React Router 7, Tailwind CSS 3, Axios and Vite 8.

---

## Getting Started

**Requirements:** Node.js **20.19+** (or 22.12+), required by Vite 8.

The backend must be running first, because it owns the database and handles uploads.

```bash
# terminal 1: API on :8000
cd server
npm install
cp .env.example .env    # fill in your MongoDB, JWT and Cloudinary values
npm run dev

# terminal 2: this app on :5173
cd client
npm install
cp .env.example .env
npm run dev
```

Then open <http://localhost:5173>.

### Why the dev proxy matters

`vite.config.js` proxies `/api` to `http://localhost:8000`, and `.env` sets `VITE_API_BASE_URL=/api/v1`. That makes every API call same-origin, so the browser stores the backend's `httpOnly` auth cookies and sends them back. If you point the app directly at `http://localhost:8000`, the browser will drop those cookies.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

### Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL for API requests. Use `/api/v1` locally. In production, use the deployed API, e.g. `https://vidtube-fullstack.onrender.com/api/v1`. | `/api/v1` |

The app has no API keys of its own. The Cloudinary and JWT secrets stay on the server, and `.env` is gitignored.

> **Restart the dev server after changing the Tailwind config.** Vite does not reliably pick up edits to `tailwind.config.js`, and the symptom is confusing: classes silently stop being generated. Restart `npm run dev` after editing it.

---

## Project Structure

```
client/
├── index.html               # Sets the theme before first paint; loads the Inter font
├── vercel.json              # SPA rewrite so deep links don't 404
├── vite.config.js           # Dev server and /api proxy
├── tailwind.config.js       # Tailwind colours mapped to CSS variables
└── src/
    ├── App.jsx              # Routes, providers, lazy-loaded pages
    ├── main.jsx
    ├── index.css            # Theme variables and @font-face rules
    ├── api/                 # axios.js plus one module per resource
    ├── components/
    │   ├── common/          # Navbar, Sidebar, VideoCard, Modal, Captcha, route guards
    │   ├── studio/          # UploadVideoModal, EditVideoModal, StatsCard
    │   ├── tweet/           # CreateTweetBox, TweetCard
    │   └── video/           # VideoPlayer, VideoInfo, CommentsSection, RelatedVideos, SaveToPlaylistModal
    ├── context/             # AuthContext, ThemeContext, SidebarContext
    ├── hooks/               # useInfiniteScroll
    ├── layouts/             # MainLayout (navbar + sidebar), AuthLayout
    ├── pages/               # One component per route
    └── utils/               # formatters.js, helpers.js
```

---

## Pages

| Route | What it does | Access |
| --- | --- | --- |
| `/` | Video grid, category filters, infinite scroll | Public |
| `/watch/:videoId` | Player, likes, subscribe, comments, related videos | Public |
| `/c/:username` | Channel page: Videos, Playlists, Community, About | Public |
| `/search?q=` | Video results and a matching channel, sortable | Public |
| `/community` | Community post feed: create, edit, delete | Public (posting needs sign-in) |
| `/playlist/:playlistId` | Playlist details, with controls for the owner | Public |
| `/subscriptions` | One combined feed from every channel you follow | Signed in |
| `/history` | Watch history | Signed in |
| `/liked-videos` | Everything you've liked | Signed in |
| `/playlists` | Your playlists: create, edit, delete | Signed in |
| `/create-channel` | Unlock creator mode | Signed in |
| `/studio` | Stats, upload, edit, public/private switch, delete | Creators only |
| `/settings` | Profile, Branding, Appearance, Security, sign out | Signed in |
| `/login`, `/register` | Authentication with CAPTCHA | Public |
| `*` | Not found | Public |

Every page is lazy-loaded with `React.lazy`, so each route ships as its own chunk.

---

## How a Few Things Work

**Auth.** `AuthContext` holds the session. The backend sets `httpOnly` cookies *and* returns the tokens in the response body. `api/axios.js` sends the cookies and an `Authorization: Bearer` header. On a `401`, it refreshes the token once and holds any other requests that failed at the same time until the new token arrives. If the refresh fails, it fires an `auth:logout` event that clears the UI.

**Route guards.** `ProtectedRoute` sends signed-out users to `/login`. `CreatorRoute` also requires `isCreator`, and sends viewers to create their channel first.

**CAPTCHA.** `/login` and `/register` use a self-hosted CAPTCHA, so there is no third-party service and no keys to leak. `GET /api/v1/captcha` returns an ID and a distorted SVG. The expected answer never leaves the server. Challenges can be used once and expire after five minutes.

**Theming.** Every neutral colour is a CSS variable in `src/index.css`, and `tailwind.config.js` maps Tailwind's colours onto those variables. Changing `data-theme` on `<html>` re-themes the whole app, so `text-white` means "strongest text" in both modes rather than literally white. Three consequences worth knowing:

- Text on a coloured fill uses `text-on-accent`, which never flips.
- The video player sets its own `data-theme="dark"`. Its controls sit over the video, not over the page background, so they stay dark in light mode.
- Transitions are paused for one frame during a switch. Otherwise each component would fade to its new colour at a different speed and the page would change unevenly.

The theme preference (Light, Dark or System) is saved in `localStorage` under `vidtube:theme`. An inline script in `index.html` applies it before the first paint so the page never flashes the wrong theme.

**Infinite scroll.** `hooks/useInfiniteScroll.js` uses an `IntersectionObserver` that starts loading about 600px before the end of the list comes into view. Browsers without `IntersectionObserver` show a "load more" button instead.

**Video player.** `components/video/VideoPlayer.jsx` is a custom player, not the browser's built-in controls. Features:

- Seek bar showing how much is buffered, with a hover preview
- Configurable skip step (5/10/15/30s) and double-tap zones
- Volume slider and step buttons
- Playback speed and loop
- Picture-in-picture, theater mode and fullscreen

| Key | Action |
| --- | --- |
| `Space` / `K` | Play / pause |
| `←` / `→` | Seek 5 seconds |
| `J` / `L` | Seek by the skip step |
| `↑` / `↓` | Volume |
| `M` | Mute |
| `F` | Fullscreen |
| `T` | Theater mode |
| `I` | Picture-in-picture |
| `<` / `>` | Playback speed |
| `0`–`9` | Jump to 0%–90% |

**Video owners.** The backend stores `video.owner` as the creator's username rather than an ObjectId, and some endpoints return it as a full object. `utils/helpers.js#getVideoOwner` handles both shapes.

**Fonts.** Body text is Inter, from Google Fonts. Headings and the wordmark use **Epic Pro** (`src/assets/fonts`). The demo weights include letters only, so their `@font-face` rules use `unicode-range`, and digits and punctuation come from an earlier version of the same family. Epic Pro's demo licence allows **personal use only**, so buy a commercial licence before using the site commercially. See `src/assets/fonts/EpicPro-LICENSE.txt`.

**Analytics.** `@vercel/analytics` is included in `App.jsx`. It only reports data when Web Analytics is enabled for the project in the Vercel dashboard.

---

## Deployment

The app is deployed on Vercel with **Root Directory** set to `client`. `vercel.json` sends every non-`/api` path to `index.html`, which stops deep links like `/watch/<id>` from returning 404 on a hard refresh.

See [DEPLOYMENT.md](../DEPLOYMENT.md) for the full guide.
