import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    getAllTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT, optionalVerifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/").get(optionalVerifyJWT, getAllTweets);
router.route("/create-tweet").post(verifyJWT, createTweet);
router.route("/user/:userId").get(optionalVerifyJWT, getUserTweets);
router.route("/:tweetId")
    .patch(verifyJWT, updateTweet)
    .delete(verifyJWT, deleteTweet);

export default router