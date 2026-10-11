# VidTube: Backend

REST API for the VidTube video platform, built with Express 5, MongoDB (Mongoose 9), Cloudinary and JWT authentication.

It serves the React app in [`../client`](../client). See the [root README](../README.md) for an overview of the whole project.

**Live API:** https://vidtube-fullstack.onrender.com/api/v1/healthCheck

> Hosted on Render's free tier, which sleeps after about 15 minutes of inactivity. The first request after a quiet period can take around 50 seconds.

---

## Tech Stack

| Purpose | Package |
| --- | --- |
| Web framework | `express` 5 |
| Database / ODM | `mongoose` 9, `mongoose-aggregate-paginate-v2` |
| Authentication | `jsonwebtoken`, `bcrypt`, `cookie-parser` |
| File uploads | `multer` (to local disk), then `cloudinary` |
| Cross-origin | `cors` |
| Config | `dotenv` |
| Dev tooling | `nodemon`, `prettier` |

---

## Getting Started

**Requirements:** Node.js **20.19+** (needed by Mongoose 9), a MongoDB database, and a Cloudinary account.

```bash
npm install
cp .env.example .env    # fill in the values below
npm run dev             # http://localhost:8000
```

On a successful start, the server logs:

```
MongoDB Connected !! DB Host: ...
⚙️  Server is running at port : 8000
```

Check it with:

```bash
curl http://localhost:8000/api/v1/healthCheck
# {"statusCode":200,"data":"ALL OK!","message":"Success","success":true}
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start with nodemon, which restarts on file changes |
| `npm start` | Start with Node (used in production) |

---

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Port to listen on | `8000` |
| `MONGODB_URI` | Connection string **without** a database name. `src/db/index.js` appends `/vidtube` (from `src/constants.js`). | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `CORS_ORIGIN` | Frontend origin allowed to make requests | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | Secret for signing access tokens | `openssl rand -hex 32` |
| `ACCESS_TOKEN_EXPIRY` | Access token lifetime | `1d` |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens | `openssl rand -hex 32` |
| `REFRESH_TOKEN_EXPIRY` | Refresh token lifetime | `10d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | |
| `CLOUDINARY_API_KEY` | Cloudinary API key | |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | |

`.env` is gitignored. Use `.env.example` as the template.

---

## Project Structure

```
server/
├── public/temp/              # Multer stores uploads here before they go to Cloudinary
└── src/
    ├── index.js              # Entry point: connects to MongoDB, then starts the server
    ├── app.js                # Express app: CORS, parsers, static files, routes, error handler
    ├── constants.js          # DB_Name
    ├── db/index.js           # Mongoose connection
    ├── controllers/          # One file per resource
    ├── routes/               # One router per resource
    ├── models/               # Mongoose schemas
    ├── middlewares/
    │   ├── auth.middleware.js     # verifyJWT, optionalVerifyJWT, requireCreator
    │   ├── captcha.middleware.js  # verifyCaptcha
    │   └── multer.middleware.js   # disk storage for uploads
    └── utils/
        ├── ApiError.js            # Error class with a status code
        ├── ApiResponse.js         # Standard success response
        ├── asyncHandler.js        # Passes async errors to the error handler
        ├── cloudinary.js          # Upload to and delete from Cloudinary
        ├── captcha.js             # Self-hosted SVG CAPTCHA
        └── hydrateVideoOwners.js  # Replaces a video's owner username with full user info
```

---

## Data Models

| Model | Key fields |
| --- | --- |
| **User** | `username` (unique, lowercase), `email` (unique), `fullName`, `avatar`, `coverImage`, `password` (bcrypt hash), `watchHistory[]`, `refreshToken`, `isCreator` |
| **Video** | `videoFile`, `thumbnail`, `owner`, `title`, `description`, `duration`, `views`, `isPublished` |
| **Comment** | `content`, `video`, `owner` |
| **Like** | `likedBy` plus one of `video`, `comment` or `tweet` |
| **Subscription** | `subscriber`, `channel` (both User references) |
| **Playlist** | `title`, `description`, `videos[]`, `owner` |
| **Tweet** | `content`, `owner` (shown as "Community posts" in the frontend) |

All models have `createdAt` and `updatedAt` timestamps.

> **Note:** `Video.owner` stores the creator's **username**, not their ObjectId. Every other model stores the user's ObjectId. Queries that return videos join the owner with a `$lookup` on `username`, or use `hydrateVideoOwners`, so the frontend always gets `{ _id, username, fullName, avatar }`.

---

## Response Format

Successful responses:

```json
{ "statusCode": 200, "data": { }, "message": "Success", "success": true }
```

Errors, produced by the global error handler in `app.js`:

```json
{ "statusCode": 404, "data": null, "message": "Video not found!", "success": false, "errors": [] }
```

---

## API Reference

Base URL: `/api/v1`

🔒 = requires a valid access token · 🎬 = requires creator mode · 🤖 = requires a solved CAPTCHA

Protected routes accept the access token from the `accessToken` cookie or from an `Authorization: Bearer <token>` header. Public routes still read the token when one is sent, so they can return per-user fields such as `isLiked` and `isSubscribed`.

### Users: `/users`

| Method | Endpoint | Body / Notes |
| --- | --- | --- |
| `POST` | `/register` 🤖 | multipart: `fullName`, `email`, `username`, `password`, `avatar` (file, required), `coverImage` (file, optional), `captchaId`, `captchaAnswer` |
| `POST` | `/login` 🤖 | `username` or `email`, `password`, `captchaId`, `captchaAnswer`. Sets cookies and returns `{ user, accessToken, refreshToken }` |
| `POST` | `/logout` 🔒 | Clears the cookies and the stored refresh token |
| `POST` | `/refresh-token` | Refresh token from the cookie or `{ refreshToken }` in the body |
| `GET` | `/current-user` 🔒 | |
| `PATCH` | `/update-account-details` 🔒 | `fullName`, `email` |
| `POST` | `/change-password` 🔒 | `oldPassword`, `newPassword` |
| `PATCH` | `/update-avatar` 🔒 | multipart: `avatar`. Deletes the old image from Cloudinary |
| `PATCH` | `/update-cover-image` 🔒 | multipart: `coverImage`. Deletes the old image from Cloudinary |
| `POST` | `/become-creator` 🔒 | Sets `isCreator: true`. Safe to call more than once |
| `GET` | `/ch/:username` | Channel profile with `subscribersCount`, `channelSubscribedCount`, `isSubscribed` |
| `GET` | `/watch-history` 🔒 | |

### Videos: `/video`

| Method | Endpoint | Body / Notes |
| --- | --- | --- |
| `GET` | `/` | Published videos only. Query: `page`, `limit`, `query` (searches title and description), `sortBy`, `sortType` (`asc`/`desc`), `username` |
| `POST` | `/` 🔒 🎬 | multipart: `title`, `description`, `videoFile`, `thumbnail` |
| `GET` | `/:videoId` | Adds a view and adds the video to the viewer's watch history. Returns likes and subscription info |
| `PATCH` | `/:videoId` 🔒 | `title`, `description`, `thumbnail` (file). Each is optional. Owner only |
| `DELETE` | `/:videoId` 🔒 | Also deletes the video and thumbnail from Cloudinary. Owner only |
| `PATCH` | `/toggle/publish/:videoId` 🔒 | Switches between public and private. Owner only |

### Comments: `/comment`

| Method | Endpoint | Body / Notes |
| --- | --- | --- |
| `GET` | `/:videoId` | Query: `page`, `limit` (default 20) |
| `POST` | `/:videoId` 🔒 | `content` |
| `PATCH` | `/c/:commentId` 🔒 | `content`. Owner only |
| `DELETE` | `/c/:commentId` 🔒 | Owner only |

### Likes: `/like` 🔒

| Method | Endpoint |
| --- | --- |
| `POST` | `/toggle/v/:videoId` |
| `POST` | `/toggle/c/:commentId` |
| `POST` | `/toggle/t/:tweetId` |
| `GET` | `/videos` (videos the user has liked) |

### Subscriptions: `/subscription`

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/c/:channelId` | A channel's subscribers |
| `POST` | `/c/:channelId` 🔒 | Subscribe or unsubscribe |
| `GET` | `/u/:subscriberId` | Channels a user is subscribed to |

### Playlists: `/playlist`

| Method | Endpoint | Notes |
| --- | --- | --- |
| `POST` | `/create-playlist` 🔒 | `title`, `description` |
| `GET` | `/user/:userId` | |
| `GET` | `/:playlistId` | |
| `PATCH` | `/:playlistId` 🔒 | Owner only |
| `DELETE` | `/:playlistId` 🔒 | Owner only |
| `PATCH` | `/add/:videoId/:playlistId` 🔒 | Owner only |
| `PATCH` | `/remove/:videoId/:playlistId` 🔒 | Owner only |

### Community posts: `/tweet`

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/` | All posts |
| `POST` | `/create-tweet` 🔒 | `content` |
| `GET` | `/user/:userId` | |
| `PATCH` | `/:tweetId` 🔒 | Owner only |
| `DELETE` | `/:tweetId` 🔒 | Owner only |

### Dashboard: `/dashboard` 🔒 🎬

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/stats` | `totalVideos`, `totalViews`, `totalSubscribers`, `totalLikes`, `totalTweets` |
| `GET` | `/videos` | All of the creator's videos, including private ones |

### Other

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/captcha` | Returns `{ captchaId, expiresIn, image }`, where `image` is a base64 SVG data URI |
| `GET` | `/healthCheck` | |

---

## How It Works

### Authentication
- Passwords are hashed with bcrypt (10 salt rounds) in a `pre("save")` hook.
- Login issues an **access token** (payload: `_id`, `email`, `username`, `fullName`) and a **refresh token** (payload: `_id`). The refresh token is also stored on the user document, so logging out revokes it.
- Both tokens are set as `httpOnly`, `secure` cookies and also returned in the response body. Clients that can't use cookies can send a Bearer header instead.
- `verifyJWT` rejects a request that has no valid token. `optionalVerifyJWT` sets `req.user` when a valid token is present and lets the request through either way.

### Creator mode
`requireCreator` protects video uploads and the dashboard. Users unlock creator mode with `POST /users/become-creator`. If a user published videos before the `isCreator` flag existed, `ensureCreatorStatus` promotes them automatically.

### Uploads
1. Multer saves the file to `public/temp`.
2. `uploadOnCloudinary` uploads it to a folder: `videos`, `thumbnails`, `avatars` or `coverImages`.
3. The local file is deleted whether the upload succeeds or fails.
4. The Cloudinary URL is saved in MongoDB. Replacing or deleting media also deletes the old file from Cloudinary.

### CAPTCHA
`utils/captcha.js` generates a 5-character challenge drawn as distorted SVG paths. Answers are stored in an in-memory `Map` and never sent to the client. Each challenge can be used once, expires after 5 minutes, and at most 5,000 can be pending at a time. Because the store is in memory, restarting the server (or Render putting it to sleep) invalidates any outstanding challenges, and the store is not shared between multiple instances.

### Request limits
JSON and URL-encoded request bodies are limited to **16 KB**. File uploads go through Multer and are not affected by this limit.

---

## Acknowledgements

This backend was built while following the **[Chai aur Code](https://www.youtube.com/@chaiaurcode)** backend series, then extended with creator mode, the CAPTCHA, ownership checks and the dashboard.
