import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT, optionalVerifyJWT} from "../middlewares/auth.middleware.js"
import {contentWriteLimiter} from "../middlewares/rateLimit.middleware.js"

const router = Router();

router.route("/:videoId")
    .get(optionalVerifyJWT, getVideoComments)
    .post(verifyJWT, contentWriteLimiter, addComment);

router.route("/c/:commentId")
    .delete(verifyJWT, contentWriteLimiter, deleteComment)
    .patch(verifyJWT, contentWriteLimiter, updateComment);

export default router