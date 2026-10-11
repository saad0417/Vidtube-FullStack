# Deploying VidTube for Free

VidTube is a monorepo. Each folder is deployed to a different host:

```
Vidtube-FullStack/
  client/   React + Vite      →  Vercel   (free Hobby plan)
  server/   Express + MongoDB →  Render   (free web service)
```

| Part | Host | Live URL |
| --- | --- | --- |
| Frontend | Vercel | https://vidtubeoffical.vercel.app |
| API | Render | https://vidtube-fullstack.onrender.com |
| Database | MongoDB Atlas (M0 free cluster) | — |
| Media | Cloudinary (free plan) | — |

---

## Why the API is not on Vercel

Vercel runs backends as **serverless functions**, which limit request bodies to **4.5 MB**. Every video upload goes through `POST /api/v1/video`, so any video over 4.5 MB would fail, which rules Vercel out for a video platform. Two smaller problems have the same cause:

- `multer.diskStorage` writes to `./public/temp`, but serverless filesystems are read-only except for `/tmp`.
- Uploading a video to Cloudinary can take longer than the function timeout.

So the **frontend goes on Vercel, and the API goes on a host that runs a real Node process.** Render's free tier does that, with one catch: it sleeps after about 15 minutes of inactivity, and the next request takes about 50 seconds to wake it.

---

## Before you start

You need free accounts on **GitHub**, **Vercel**, **Render**, **MongoDB Atlas** and **Cloudinary**.

The code must be pushed to GitHub. Both hosts deploy from the same repository and use a **Root Directory** setting to pick their folder.

`.env` files are gitignored, so keep them that way. Real values go in each host's dashboard. `server/.env.example` and `client/.env.example` list the keys each part needs.

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access:** create a database user with a password.
3. **Network Access:** allow `0.0.0.0/0`. Render and Vercel don't have fixed outgoing IP addresses, so an IP allowlist won't work.
4. **Connect → Drivers:** copy the connection string. Remove the database name and any trailing `/`. The server appends `/vidtube` itself (see `server/src/constants.js`).

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net
```

## 2. Cloudinary

From the Cloudinary dashboard, copy your **Cloud name**, **API key** and **API secret**. Uploads are stored in the `videos`, `thumbnails`, `avatars` and `coverImages` folders automatically.

## 3. API on Render

**New → Web Service**, then connect the `Vidtube-FullStack` repository.

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

Add these **environment variables**:

| Key | Value |
| --- | --- |
| `MONGODB_URI` | Connection string from step 1 |
| `CORS_ORIGIN` | Your Vercel URL, e.g. `https://vidtubeoffical.vercel.app` (no trailing slash) |
| `ACCESS_TOKEN_SECRET` | A fresh random string |
| `ACCESS_TOKEN_EXPIRY` | `1d` |
| `REFRESH_TOKEN_SECRET` | A different fresh random string |
| `REFRESH_TOKEN_EXPIRY` | `10d` |
| `CLOUDINARY_CLOUD_NAME` | From step 2 |
| `CLOUDINARY_API_KEY` | From step 2 |
| `CLOUDINARY_API_SECRET` | From step 2 |
| `NODE_VERSION` | `22` (Mongoose 9 needs Node 20.19 or newer) |

Generate new secrets for production rather than reusing your local ones:

```bash
openssl rand -hex 32   # run once for each token secret
```

You don't need to set `PORT`. Render sets it, and the server reads `process.env.PORT`.

You don't need to set `TRUST_PROXY` either. The server detects Render through its `RENDER` variable and trusts 3 proxy hops (Cloudflare, Render's load balancer and an internal proxy), so rate limiting sees each visitor's real IP. Set `TRUST_PROXY` only if you deploy to a different host.

**CORS is strict:** only the origins in `CORS_ORIGIN` (comma-separated), `https://vidtubeoffical.vercel.app` and localhost are allowed. Vercel *preview* deployments get a different URL on every build, so they are blocked. To test a preview against the live API, add its URL to `CORS_ORIGIN`.

After the deploy finishes, open `https://<your-service>.onrender.com/api/v1/healthCheck`. It should return `"ALL OK!"`.

## 4. Frontend on Vercel

**Add New → Project**, then import the same repository.

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | Vite (detected automatically) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

`client/vercel.json` is already committed. Its rewrite sends every non-`/api` path to `index.html`. Without it, refreshing a page like `/watch/<id>` returns a 404, which is the usual React Router deployment problem.

Next, choose how the frontend reaches the API. There are two options.

### Option A: Call the API directly (current setup)

In Vercel, go to **Settings → Environment Variables** and set:

```
VITE_API_BASE_URL=https://vidtube-fullstack.onrender.com/api/v1
```

This is how the live site is configured. The frontend and API are on different sites, so the auth cookies are not used. The server sets them with `secure: true` but no `sameSite` value, so browsers default to `Lax` and don't send them on cross-site requests.

Login still works because the API also returns the tokens in the response body. The frontend saves them in `localStorage` and sends them as an `Authorization: Bearer` header. If you want cookie auth to work too, set `sameSite: "none", secure: true` on every cookie in `server/src/controllers/user.controller.js`.

### Option B: Proxy the API through Vercel

Add a proxy rewrite **above** the SPA rule in `client/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://vidtube-fullstack.onrender.com/api/:path*" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Then leave `VITE_API_BASE_URL` unset, or set it to `/api/v1`. The browser sees a single site, so the `httpOnly` cookies work and CORS doesn't apply.

The catch: every upload then travels through Vercel's network before it reaches Render, so it is subject to Vercel's request limits and timeouts. Test a large video upload before relying on this. With Option A, uploads go straight to Render. Since uploads are a core feature, **Option A is the safer choice here.**

### Web Analytics

`client/src/App.jsx` renders `<Analytics />` from `@vercel/analytics`. For page views to appear, open the project in Vercel, go to **Analytics**, and click **Enable**. Then redeploy. Visitors whose ad blockers block `/_vercel/insights/*` won't be counted, and data can take a few minutes to show up.

> `VITE_*` variables are inserted into the JavaScript bundle **when the app is built**. After changing one in Vercel, you must redeploy for the change to take effect.

## 5. After the first deploy

- [ ] `/api/v1/healthCheck` on Render returns `ALL OK!`
- [ ] The register page loads a CAPTCHA image
- [ ] You can register, log in, and stay logged in after a page refresh
- [ ] **Create channel**, then upload a short video from Studio
- [ ] Open `/watch/<id>` directly in a new tab to confirm the SPA rewrite works
- [ ] `CORS_ORIGIN` on Render matches the final Vercel domain exactly

## 6. Updating the live site

Both hosts redeploy automatically when you push to `main`:

```bash
git add .
git commit -m "Describe your change"
git push
```

Vercel rebuilds the frontend in about a minute. Render redeploys the API in a few minutes. You can follow both in their dashboards.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The first request hangs for about 50 seconds | Render's free instance was asleep. This is expected. |
| `MongoDB connection failed` in Render logs | Wrong `MONGODB_URI`, the database name was left in the URI, or Atlas Network Access doesn't allow `0.0.0.0/0` |
| `/watch/<id>` returns 404 on refresh | Root Directory isn't `client`, so `vercel.json` isn't being used |
| The frontend calls `/api/v1/...` on the Vercel domain and gets 404 | `VITE_API_BASE_URL` isn't set in Vercel, or the site wasn't redeployed after setting it |
| "Captcha expired" right after the API wakes up | CAPTCHAs are stored in memory, and a restart or sleep clears them. Get a new one. |
| Uploads fail | Check the Cloudinary keys. The free plan also limits file size per upload. |
| `429 Too many requests` | A rate limit was hit. The `Retry-After` header says how many seconds to wait. See the limits in `server/README.md`. |
| Every visitor seems to share one rate limit | `trust proxy` is wrong for your host. Set `TRUST_PROXY` to the number of proxies in front of the app. |
| CORS error in the browser console | The page's origin isn't in `CORS_ORIGIN` (e.g. a Vercel preview URL) |
| No data in Vercel Analytics | Web Analytics isn't enabled in the dashboard, or the visitor uses an ad blocker |

---

## Free-tier limits

| Service | Limit |
| --- | --- |
| Vercel Hobby | Non-commercial use only |
| Render free | Sleeps after about 15 min idle; about 50 s cold start; 750 instance hours per month |
| MongoDB Atlas M0 | 512 MB storage |
| Cloudinary free | 25 monthly credits (shared between storage, bandwidth and transformations) |

---

## Moving the API to Vercel too

This is possible, but the 4.5 MB limit has to be avoided:

1. Have the browser upload **directly to Cloudinary** using a signed upload, then send only the resulting URL to the API.
2. Switch `multer` to memory storage or `/tmp`.
3. Cache the Mongo connection between requests, so a cold start doesn't open a new connection pool every time.

After these changes, the backend only handles JSON and small images, which fits comfortably on serverless.
