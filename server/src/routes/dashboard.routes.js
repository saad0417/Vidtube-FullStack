import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {verifyJWT, requireCreator} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.use(requireCreator); // ...and the dashboard only means anything for a creator

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router