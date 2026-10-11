import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { apiLimiter } from './middlewares/rateLimit.middleware.js'


const app = express();

/*
The API sits behind proxies in production, so the socket address is the last
proxy, not the visitor. `trust proxy` tells Express how many hops of
X-Forwarded-For to trust so that req.ip (used by the rate limiters) is the real
client. On Render a request passes Cloudflare, Render's load balancer and an
internal proxy, so the client is 3 hops from the right; anything further left
can be forged by the client and must not be trusted.
TRUST_PROXY overrides this for other hosts. Locally there is no proxy at all.
*/
const proxyHops = Number.parseInt(process.env.TRUST_PROXY, 10)
const trustProxy = Number.isInteger(proxyHops) && proxyHops >= 0
    ? proxyHops
    : (process.env.RENDER ? 3 : 0)

app.set("trust proxy", trustProxy)

// app.use() is used to add middleware or to do configrations that runs for every request (or for a specific path).
// CORS_ORIGIN may hold several origins separated by commas.
const allowedOrigins = [
    ...(process.env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim().replace(/\/$/, "")),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vidtubeoffical.vercel.app"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === "*") {
            return callback(null, true);
        }
        // Unknown site: answer without CORS headers, so the browser blocks it.
        return callback(null, false);
    },
    credentials: true
}))

// Per-IP backstop for the whole API. Mounted after cors so preflight requests
// are answered without counting, and so a 429 still carries CORS headers the
// frontend can read. Stricter per-route limits live in the routers.
app.use(apiLimiter)

app.use(express.json({limit: "16kb"})) // to accept json...

// express.urlencoded is used to parse(read) the Encoded URL. (name=Saad%20Akhtar&city=Lahore)
app.use(express.urlencoded({extended: true, limit: "16kb"})) 

/* With express.static we can make a public folder like to store photos, videos, logos which anyone can access
express.static() is a built-in Express middleware that serves static files directly to clients.
http://localhost:3000/images/logo.png
http://localhost:3000/videos/intro.mp4  */
app.use(express.static("public"))

// cookie-parser is Express middleware used to read (parse) cookies sent by the client's browser.
// It makes the cookies available in req.cookies.
app.use(cookieParser())






// Routes Import 
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import healthCheckRouter from './routes/healthcheck.routes.js';
import likeRouter from './routes/like.routes.js';
import dashboardRouter from './routes/dashboard.routes.js'
import commentRouter from './routes/comment.routes.js'
import captchaRouter from './routes/captcha.routes.js'

// Routes Declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/video", videoRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/healthCheck", healthCheckRouter)
app.use("/api/v1/like", likeRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/comment", commentRouter)
app.use("/api/v1/captcha", captchaRouter)

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";
    return res.status(statusCode).json({
        statusCode,
        data: null,
        message,
        success: false,
        errors: err.errors || []
    });
});

export { app }