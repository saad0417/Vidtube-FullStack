# Deploying VidTube for free

```
Vidtube/
  client/   React + Vite  →  Vercel        (free, ideal fit)
  server/   Express + Mongo → Render       (free web service)
```

## Why the API does not go on Vercel

Vercel runs backends as **serverless functions**, which cap the request body at
**4.5 MB**. Every video upload goes through `POST /api/v1/video`, so anything
larger than 4.5 MB fails — fatal for a video platform. Two smaller problems
follow from the same model:

- `multer.diskStorage` writes to `./public/temp`; serverless filesystems are
  read-only apart from `/tmp`.
- A Cloudinary video upload can outrun the function timeout.

So: **frontend on Vercel, API on a host that runs a real Node process.**
Render's free tier does, with one caveat — it sleeps after ~15 minutes idle and
the next request takes ~50s to wake it.

---

## 1. Push the code

`server/` already has a git remote. `client/` has none yet:

```bash
cd client
git init && git add . && git commit -m "VidTube frontend"
gh repo create vidtube-frontend --public --source=. --push
```

`.env` is gitignored in both projects — keep it that way. Real values go in the
host dashboards; `.env.example` documents which keys are needed.

## 2. API on Render

New → Web Service → connect `vidtube-backend`.

| Setting | Value |
| --- | --- |
| Root directory | `server` (only if you push the monorepo) |
| Build command | `npm install` |
| Start command | `npm start` |
| Instance type | Free |

Add every key from `server/.env.example` as an environment variable. Generate
fresh secrets — do not reuse the local ones:

```bash
openssl rand -hex 32   # once for each token secret
```

Set `CORS_ORIGIN` to your Vercel URL, e.g. `https://vidtube.vercel.app`.

In **MongoDB Atlas → Network Access**, allow `0.0.0.0/0`. Render and Vercel have
no fixed egress IPs, so an IP allowlist will not work.

## 3. Frontend on Vercel

Import the repo. Vercel detects Vite on its own (build `npm run build`, output
`dist`). Set **Root Directory** to `client` if you pushed the monorepo.

`client/vercel.json` is already committed. Its rewrite sends every non-`/api`
path to `index.html`, which is what stops `/watch/<id>` from 404ing on a hard
refresh — the usual React Router deployment trap.

### Keep the API same-origin (recommended)

Add a proxy rewrite **above** the SPA rule in `client/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://YOUR-API.onrender.com/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Then leave `VITE_API_BASE_URL=/api/v1` as it is. The browser sees one origin, so
the backend's httpOnly auth cookies keep working and CORS never comes up.

### Or point straight at the API

Set `VITE_API_BASE_URL=https://YOUR-API.onrender.com/api/v1` in Vercel's
environment variables. This makes requests cross-site, which breaks the cookies:
they are set with `secure: true` but no `sameSite`, so browsers default to `Lax`
and drop them. The app still works — it falls back to the Bearer token in
`localStorage` — but cookie auth is silently dead. To fix it properly, set
`sameSite: "none", secure: true` on every cookie in `user.controller.js`.

The proxy is simpler and safer. Prefer it.

## 4. After the first deploy

- Register an account and confirm the captcha loads.
- Upload a video, then reload `/watch/<id>` directly to confirm the SPA rewrite.
- Re-check `CORS_ORIGIN` matches the final Vercel domain.

---

## Limits to be aware of

| Service | Free-tier limit |
| --- | --- |
| Vercel Hobby | Non-commercial use only |
| Render free | Sleeps after ~15 min idle; ~50s cold start |
| MongoDB Atlas M0 | 512 MB storage |
| Cloudinary free | 25 monthly credits (storage + bandwidth + transforms) |

## Getting the API onto Vercel too

Possible, but it needs the 4.5 MB ceiling designed around: have the browser
upload **directly to Cloudinary** with a signed upload, and send only the
resulting URL to the API. The backend then handles JSON and small images, which
fits serverless comfortably. It also needs `multer` moved to `/tmp` (or memory)
and a cached Mongo connection so each cold start does not open a new pool.
