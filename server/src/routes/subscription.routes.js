import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT, optionalVerifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router
    .route("/c/:channelId")
    .get(optionalVerifyJWT, getUserChannelSubscribers)
    .post(verifyJWT, toggleSubscription);

router.route("/u/:subscriberId").get(optionalVerifyJWT, getSubscribedChannels);

export default router