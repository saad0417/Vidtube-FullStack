<div align="center">

# VidTube

**A full-stack video sharing platform: upload, watch, subscribe, comment and build playlists.**

Built with React, Express, MongoDB and Cloudinary.

[**Live Demo**](https://vidtubeoffical.vercel.app) · [API Health Check](https://vidtube-fullstack.onrender.com/api/v1/healthCheck) · [Deployment Guide](./DEPLOYMENT.md)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.19+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-media-3448C5?logo=cloudinary&logoColor=white)

</div>

> **Note:** The API runs on Render's free tier, which sleeps after about 15 minutes of inactivity. The first request after a quiet period can take around 50 seconds while the server wakes up.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Acknowledgements](#acknowledgements)
- [Author](#author)

---

## Features

### For viewers
- **Browse and discover**: home feed with category filters and infinite scroll
- **Search**: match on video title and description, sorted by most recent, oldest, most viewed or A to Z
- **Custom video player**: seek bar with buffered range and hover preview, configurable skip step (5/10/15/30s), double-tap to seek, playback speed, loop, picture-in-picture, theater mode, fullscreen and keyboard shortcuts
- **Engage**: like videos, comments and community posts; comment on videos; subscribe to channels
- **Personal library**: watch history, liked videos, a subscriptions feed and playlists you can create, edit and delete
- **Channel pages**: a creator's videos, playlists, community posts and profile
- **Community posts**: short text posts, similar to YouTube's Community tab

### For creators
- **Opt-in creator mode**: every account starts as a viewer and unlocks creator tools by creating a channel
- **Studio dashboard**: total videos, views, subscribers, likes and posts
- **Video management**: upload a video and thumbnail, edit details, switch between public and private, delete
- **Channel branding**: update avatar and cover image

### Platform
- **JWT authentication** with access and refresh tokens, sent as `httpOnly` cookies and as a Bearer token
- **Self-hosted CAPTCHA** on login and registration, with no third-party service and no API keys
- **Ownership checks**: only the owner can edit or delete a video, comment, post or playlist
- **Per-endpoint rate limiting**: tight limits on login, sign-up and uploads; per-user limits on comments, likes and other writes; a generous global backstop (see [server/README.md](./server/README.md#rate-limiting))
- **Light, dark and system themes**, applied before first paint so the page never flashes the wrong theme
- **Responsive layout** with a collapsible sidebar
- **Route-level code splitting**: each page loads as its own chunk

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, React Router 7, Vite 8, Tailwind CSS 3, Axios, Lucide icons, React Hot Toast |
| **Backend** | Node.js, Express 5, Mongoose 9, JSON Web Tokens, bcrypt, Multer, cookie-parser, CORS, express-rate-limit |
| **Database** | MongoDB Atlas |
| **Media storage** | Cloudinary (videos, thumbnails, avatars, cover images) |
| **Hosting** | Vercel (frontend) and Render (API) |
| **Tooling** | oxlint, Prettier, nodemon, Vercel Analytics |

---

## Architecture

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│   React SPA (Vite)  │ ─────────────────────────► │   Express REST API   │
│   Hosted on Vercel  │ ◄───────────────────────── │   Hosted on Render   │
└─────────────────────┘                            └──────────┬───────────┘
                                                              │
                                        ┌─────────────────────┼─────────────────────┐
                                        ▼                                           ▼
                               ┌─────────────────┐                        ┌───────────────────┐
                               │  MongoDB Atlas  │                        │    Cloudinary     │
                               │  (app data)     │                        │  (media files)    │
                               └─────────────────┘                        └───────────────────┘
```

Uploads go through the API. Multer writes the file to `server/public/temp`, the server uploads it to Cloudinary, and then the local copy is deleted. MongoDB stores only the Cloudinary URL.

The API is hosted on Render rather than on Vercel because Vercel's serverless functions cap request bodies at 4.5 MB, which is too small for video uploads. [DEPLOYMENT.md](./DEPLOYMENT.md) explains this in more detail.

---

## Project Structure

```
Vidtube/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios instance and one module per API resource
│   │   ├── assets/             # Fonts and images
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Sidebar, cards, modals, route guards, Captcha
│   │   │   ├── studio/         # Upload/edit modals, stats cards
│   │   │   ├── tweet/          # Community post components
│   │   │   └── video/          # Player, comments, related videos, save-to-playlist
│   │   ├── context/            # Auth, Sidebar and Theme providers
│   │   ├── hooks/              # useInfiniteScroll
│   │   ├── layouts/            # MainLayout and AuthLayout
│   │   ├── pages/              # One component per route
│   │   ├── utils/              # Formatters and helpers
│   │   ├── App.jsx             # Routes
│   │   └── main.jsx
│   ├── vercel.json             # SPA rewrite for client-side routing
│   └── vite.config.js          # Dev server and /api proxy
│
├── server/                     # Express backend
│   ├── public/temp/            # Temporary upload storage
│   └── src/
│       ├── controllers/        # Request handlers
│       ├── db/                 # MongoDB connection
│       ├── middlewares/        # JWT auth, creator guard, captcha, multer
│       ├── models/             # User, Video, Comment, Like, Tweet, Playlist, Subscription
│       ├── routes/             # Express routers
│       ├── utils/              # ApiError, ApiResponse, asyncHandler, Cloudinary, captcha
│       ├── app.js              # Express app, middleware, routes, error handler
│       ├── constants.js        # Database name
│       └── index.js            # Entry point
│
└── DEPLOYMENT.md               # Guide to deploying for free on Vercel and Render
```

---

## Getting Started

### Prerequisites

- **Node.js 20.19+** (or 22.12+), required by Vite 8 and Mongoose 9
- A **MongoDB** database, such as a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local instance
- A **[Cloudinary](https://cloudinary.com)** account (the free tier is enough)

### 1. Clone the repository

```bash
git clone https://github.com/saad0417/Vidtube-FullStack.git
cd Vidtube-FullStack
```

### 2. Set up the backend

```bash
cd server
npm install
cp .env.example .env      # then fill in the values (see below)
npm run dev               # starts the API on http://localhost:8000
```

When the server starts, it logs `MongoDB Connected` and `Server is running at port : 8000`.

### 3. Set up the frontend

In a second terminal:

```bash
cd client
npm install
cp .env.example .env      # the default value works for local development
npm run dev               # starts the app on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server forwards every `/api` request to `http://localhost:8000`. Because of this proxy, the browser treats the frontend and API as one origin, so the `httpOnly` auth cookies are stored and sent correctly.

### 4. Try it out

1. Register an account by uploading an avatar and solving the CAPTCHA.
2. Click **Create channel** to unlock creator tools.
3. Open **Studio** and upload your first video.

---

## Environment Variables

### `server/.env`

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Port the API listens on | `8000` |
| `MONGODB_URI` | MongoDB connection string **without** a database name. The app appends `/vidtube`. | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `CORS_ORIGIN` | Frontend origin allowed to call the API | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | Secret for signing access tokens | output of `openssl rand -hex 32` |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime | `1d` |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens | output of `openssl rand -hex 32` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | |
| `CLOUDINARY_API_KEY` | Cloudinary API key | |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | |
| `TRUST_PROXY` | *Optional.* Number of proxies in front of the API. Defaults to `3` on Render and `0` elsewhere. | |

### `client/.env`

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Base URL for API requests. Keep `/api/v1` locally so the Vite proxy is used. In production, set it to the deployed API, e.g. `https://your-api.onrender.com/api/v1`. | `/api/v1` |

> `.env` files are gitignored. Never commit real secrets.

---

## Available Scripts

| Location | Command | Description |
| --- | --- | --- |
| `server/` | `npm run dev` | Start the API with nodemon (restarts on file changes) |
| `server/` | `npm start` | Start the API with Node (production) |
| `client/` | `npm run dev` | Start the Vite dev server |
| `client/` | `npm run build` | Build for production into `client/dist` |
| `client/` | `npm run preview` | Preview the production build locally |
| `client/` | `npm run lint` | Lint with oxlint |

---

## API Reference

Base URL: `/api/v1`. Every response has this shape:

```json
{ "statusCode": 200, "data": {}, "message": "Success", "success": true }
```

🔒 = requires authentication · 🎬 = requires creator mode · 🤖 = requires CAPTCHA

<details>
<summary><strong>Users</strong> (<code>/users</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/register` | Register (multipart: `avatar` required, `coverImage` optional) 🤖 |
| `POST` | `/login` | Log in with username or email and password 🤖 |
| `POST` | `/logout` | Log out 🔒 |
| `POST` | `/refresh-token` | Issue a new access token |
| `GET` | `/current-user` | Get the logged-in user 🔒 |
| `PATCH` | `/update-account-details` | Update full name and email 🔒 |
| `POST` | `/change-password` | Change password 🔒 |
| `PATCH` | `/update-avatar` | Replace avatar (multipart) 🔒 |
| `PATCH` | `/update-cover-image` | Replace cover image (multipart) 🔒 |
| `POST` | `/become-creator` | Enable creator mode 🔒 |
| `GET` | `/ch/:username` | Channel profile with subscriber counts |
| `GET` | `/watch-history` | Watch history 🔒 |

</details>

<details>
<summary><strong>Videos</strong> (<code>/video</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | List published videos. Query: `page`, `limit`, `query`, `sortBy`, `sortType`, `username` |
| `POST` | `/` | Publish a video (multipart: `videoFile`, `thumbnail`) 🔒 🎬 |
| `GET` | `/:videoId` | Video details (adds a view, and adds it to watch history when logged in) |
| `PATCH` | `/:videoId` | Update title, description or thumbnail (owner only) 🔒 |
| `DELETE` | `/:videoId` | Delete a video and its Cloudinary assets (owner only) 🔒 |
| `PATCH` | `/toggle/publish/:videoId` | Switch between public and private (owner only) 🔒 |

</details>

<details>
<summary><strong>Comments</strong> (<code>/comment</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/:videoId` | Comments on a video, paginated |
| `POST` | `/:videoId` | Add a comment 🔒 |
| `PATCH` | `/c/:commentId` | Edit a comment (owner only) 🔒 |
| `DELETE` | `/c/:commentId` | Delete a comment (owner only) 🔒 |

</details>

<details>
<summary><strong>Likes</strong> (<code>/like</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/toggle/v/:videoId` | Like or unlike a video 🔒 |
| `POST` | `/toggle/c/:commentId` | Like or unlike a comment 🔒 |
| `POST` | `/toggle/t/:tweetId` | Like or unlike a community post 🔒 |
| `GET` | `/videos` | Videos the user has liked 🔒 |

</details>

<details>
<summary><strong>Subscriptions</strong> (<code>/subscription</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/c/:channelId` | A channel's subscribers |
| `POST` | `/c/:channelId` | Subscribe or unsubscribe 🔒 |
| `GET` | `/u/:subscriberId` | Channels a user is subscribed to |

</details>

<details>
<summary><strong>Playlists</strong> (<code>/playlist</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/create-playlist` | Create a playlist 🔒 |
| `GET` | `/user/:userId` | A user's playlists |
| `GET` | `/:playlistId` | Playlist details |
| `PATCH` | `/:playlistId` | Update a playlist (owner only) 🔒 |
| `DELETE` | `/:playlistId` | Delete a playlist (owner only) 🔒 |
| `PATCH` | `/add/:videoId/:playlistId` | Add a video to a playlist (owner only) 🔒 |
| `PATCH` | `/remove/:videoId/:playlistId` | Remove a video from a playlist (owner only) 🔒 |

</details>

<details>
<summary><strong>Community Posts</strong> (<code>/tweet</code>)</summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | All community posts |
| `POST` | `/create-tweet` | Create a post 🔒 |
| `GET` | `/user/:userId` | A user's posts |
| `PATCH` | `/:tweetId` | Edit a post (owner only) 🔒 |
| `DELETE` | `/:tweetId` | Delete a post (owner only) 🔒 |

</details>

<details>
<summary><strong>Dashboard, CAPTCHA and Health</strong></summary>

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/dashboard/stats` | Channel totals: videos, views, subscribers, likes, posts 🔒 🎬 |
| `GET` | `/dashboard/videos` | All of the creator's videos, including private ones 🔒 🎬 |
| `GET` | `/captcha` | Get a new CAPTCHA challenge (`captchaId` and an SVG image) |
| `GET` | `/healthCheck` | Health check |

</details>

---

## Frontend Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home feed with category filters | Public |
| `/watch/:videoId` | Video player, likes, subscribe, comments, related videos | Public |
| `/c/:username` | Channel page | Public |
| `/search?q=` | Search results | Public |
| `/community` | Community posts | Public (signed in to post) |
| `/playlist/:playlistId` | Playlist details | Public |
| `/subscriptions` | Feed from subscribed channels | Signed in |
| `/history` | Watch history | Signed in |
| `/liked-videos` | Liked videos | Signed in |
| `/playlists` | Your playlists | Signed in |
| `/create-channel` | Enable creator mode | Signed in |
| `/studio` | Creator dashboard | Creators only |
| `/settings` | Profile, branding, appearance, password | Signed in |
| `/login`, `/register` | Authentication | Public |

---

## How It Works

<details>
<summary><strong>Authentication</strong></summary>

On login, the server issues a short-lived **access token** and a longer-lived **refresh token**. It sets both as `httpOnly` cookies and also returns them in the response body. The frontend's Axios instance (`client/src/api/axios.js`) sends the cookies and an `Authorization: Bearer` header. When a request fails with `401`, it refreshes the token once and replays the request. Any other requests that failed at the same time wait in a queue for the new token. If the refresh fails, an `auth:logout` event clears the session from the UI.

</details>

<details>
<summary><strong>Self-hosted CAPTCHA</strong></summary>

`GET /api/v1/captcha` returns a random ID and a distorted SVG image of a 5-character code. The answer is kept only on the server. Each challenge works once and expires after five minutes. The characters are drawn as randomly sheared, resampled vector paths mixed with decoy strokes, so the answer can't be read from the SVG markup. Characters that are easy to confuse (`0/O`, `1/I/l`) are never used.

</details>

<details>
<summary><strong>Creator mode</strong></summary>

New accounts are viewers. Calling `POST /users/become-creator` sets the `isCreator` flag, which unlocks the Studio, video uploads and the dashboard endpoints. Accounts that published videos before this flag existed are promoted automatically the next time they are checked.

</details>

<details>
<summary><strong>Theming</strong></summary>

Every neutral colour is a CSS variable in `client/src/index.css`, and `tailwind.config.js` maps Tailwind's colours onto those variables. Changing `data-theme` on `<html>` re-themes the whole app. An inline script in `index.html` applies the saved theme before the first paint. Transitions are paused for one frame during a switch so every element changes colour at the same time.

</details>

<details>
<summary><strong>Video player keyboard shortcuts</strong></summary>

| Key | Action |
| --- | --- |
| `Space` / `K` | Play / pause |
| `←` / `→` | Seek 5 seconds |
| `J` / `L` | Seek by the configured skip step |
| `↑` / `↓` | Volume |
| `M` | Mute |
| `F` | Fullscreen |
| `T` | Theater mode |
| `I` | Picture-in-picture |
| `<` / `>` | Playback speed |
| `0`–`9` | Jump to 0%–90% |

</details>

---

## Deployment

| Part | Platform | URL |
| --- | --- | --- |
| Frontend | Vercel | https://vidtubeoffical.vercel.app |
| API | Render | https://vidtube-fullstack.onrender.com |
| Database | MongoDB Atlas | — |
| Media | Cloudinary | — |

[**DEPLOYMENT.md**](./DEPLOYMENT.md) is a step-by-step guide to deploying this project on free tiers. It covers environment variables, CORS, MongoDB Atlas network access, the SPA rewrite, and the trade-offs of calling the API cross-origin versus proxying it.

---

## Acknowledgements

- The backend architecture is based on the **[Chai aur Code](https://www.youtube.com/@chaiaurcode)** backend series by Hitesh Choudhary.
- Headings use the **Epic Pro** typeface under its demo licence, which allows **personal use only**. A commercial licence is required for commercial use. See `client/src/assets/fonts/EpicPro-LICENSE.txt`.
- Body text uses **[Inter](https://rsms.me/inter/)**, and icons come from **[Lucide](https://lucide.dev)**.

---

## Author

**Saad Akhtar**

- GitHub: [@saad0417](https://github.com/saad0417)

If you found this project useful, consider giving it a ⭐ on GitHub.
