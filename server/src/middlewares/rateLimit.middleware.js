import { rateLimit, ipKeyGenerator } from "express-rate-limit"
import { ApiError } from "../utils/ApiError.js"

/*
Rate limits, tuned per endpoint rather than one blanket number.

- Signed-out endpoints (login, register, captcha, refresh) are keyed by IP.
- Signed-in endpoints are keyed by user id, so people sharing one IP (a campus,
  an office, a mobile carrier) do not eat into each other's quota. Those
  limiters must run AFTER verifyJWT so req.user is set.
- Each limiter keeps its own counters in memory. That is fine for a single
  instance; if the API is ever scaled out, swap in a shared store (e.g. Redis).

Getting the client IP right depends on `trust proxy`, which is set in app.js.
*/

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

// Signed-in users by id, anyone else by IP. ipKeyGenerator groups IPv6
// addresses by subnet so one client cannot dodge the limit by rotating
// through the addresses of its own block.
const userOrIpKey = (req) => (
    req.user?._id
        ? `user:${req.user._id}`
        : `ip:${ipKeyGenerator(req.ip)}`
)

// Responds in the same JSON shape as every other API error, via the global
// error handler in app.js. The RateLimit and Retry-After headers are already set.
const createLimiter = ({ windowMs, limit, message, ...options }) => rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (req, res, next) => next(new ApiError(429, message)),
    ...options
})


// Backstop for the whole API, per IP. Generous on purpose: the frontend fans
// out several requests per page (the subscriptions feed fetches one list per
// channel), so this only catches scrapers and runaway clients.
export const apiLimiter = createLimiter({
    windowMs: 15 * MINUTE,
    limit: 1000,
    message: "Too many requests, please slow down and try again shortly!",
    // Uptime monitors and the host's health checks must never be throttled.
    // (Express routes are case-insensitive, hence the lowercase comparison.)
    skip: (req) => req.originalUrl.toLowerCase().startsWith("/api/v1/healthcheck")
})

// Login: only failed attempts count, so a user who signs in successfully is
// never locked out, while password guessing is capped at 10 per 15 minutes.
export const loginLimiter = createLimiter({
    windowMs: 15 * MINUTE,
    limit: 10,
    skipSuccessfulRequests: true,
    message: "Too many failed login attempts, please try again in 15 minutes!"
})

// Registration: caps account creation per IP. Only successful sign-ups count,
// so a mistyped captcha or a taken username does not use up the quota.
export const registerLimiter = createLimiter({
    windowMs: HOUR,
    limit: 5,
    skipFailedRequests: true,
    message: "Too many accounts created from this network, please try again later!"
})

// Each login/register screen fetches a challenge, plus one per refresh or
// failed attempt. 30 per 10 minutes is plenty for a person, not for a solver
// farming images.
export const captchaLimiter = createLimiter({
    windowMs: 10 * MINUTE,
    limit: 30,
    message: "Too many captcha requests, please wait a few minutes!"
})

// The frontend refreshes at most once per expired access token, so a high
// rate here means a broken or malicious client.
export const refreshTokenLimiter = createLimiter({
    windowMs: 15 * MINUTE,
    limit: 30,
    message: "Too many session refresh attempts, please sign in again!"
})

// Changing a password proves knowledge of the old one, so wrong guesses are
// capped per account. Successful changes do not count.
export const passwordChangeLimiter = createLimiter({
    windowMs: 15 * MINUTE,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: userOrIpKey,
    message: "Too many incorrect password attempts, please try again in 15 minutes!"
})

// Video uploads are the most expensive request: large bodies, disk writes and
// Cloudinary credits. Placed before multer so a rejected upload never touches disk.
export const videoUploadLimiter = createLimiter({
    windowMs: HOUR,
    limit: 10,
    keyGenerator: userOrIpKey,
    message: "Upload limit reached (10 videos per hour), please try again later!"
})

// Avatar, cover image and video detail/thumbnail edits: each may upload an
// image to Cloudinary.
export const mediaUpdateLimiter = createLimiter({
    windowMs: HOUR,
    limit: 30,
    keyGenerator: userOrIpKey,
    message: "Too many media updates, please try again later!"
})

// Creating, editing and deleting text content: comments, community posts,
// playlists and account details. Stops spam floods without getting in the way
// of normal use.
export const contentWriteLimiter = createLimiter({
    windowMs: 10 * MINUTE,
    limit: 60,
    keyGenerator: userOrIpKey,
    message: "You're doing that too often, please wait a moment!"
})

// Cheap toggles: likes, subscriptions, playlist add/remove, publish status.
// Higher ceiling, shorter window, since people click these quickly.
export const interactionLimiter = createLimiter({
    windowMs: MINUTE,
    limit: 60,
    keyGenerator: userOrIpKey,
    message: "You're doing that too often, please wait a moment!"
})
