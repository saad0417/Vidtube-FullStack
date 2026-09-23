import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express();

// app.use() is used to add middleware or to do configrations that runs for every request (or for a specific path).
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === "*") {
            return callback(null, true);
        }
        return callback(null, true); // fallback allow in dev
    },
    credentials: true
}))

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