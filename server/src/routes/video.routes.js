import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT, optionalVerifyJWT, requireCreator} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();

// /videos?query=java&sortBy=createdAt&sortType=desc&page=1&limit=10
router.route("/")
    .get(optionalVerifyJWT, getAllVideos)
    .post(
        verifyJWT,
        requireCreator,
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router.route("/:videoId")
    .get(optionalVerifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(
        verifyJWT,
        upload.single("thumbnail"),
        updateVideo
    );

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router