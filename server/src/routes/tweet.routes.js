import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    getAllTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT, optionalVerifyJWT} from "../middlewares/auth.middleware.js"
import {contentWriteLimiter} from "../middlewares/rateLimit.middleware.js"

const router = Router();

router.route("/").get(optionalVerifyJWT, getAllTweets);
router.route("/create-tweet").post(verifyJWT, contentWriteLimiter, createTweet);
router.route("/user/:userId").get(optionalVerifyJWT, getUserTweets);
router.route("/:tweetId")
    .patch(verifyJWT, contentWriteLimiter, updateTweet)
    .delete(verifyJWT, contentWriteLimiter, deleteTweet);

export default router