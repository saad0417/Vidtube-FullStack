import { Router } from 'express';
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js"
import {verifyJWT, optionalVerifyJWT} from "../middlewares/auth.middleware.js"
import {contentWriteLimiter, interactionLimiter} from "../middlewares/rateLimit.middleware.js"

const router = Router();

router.route("/create-playlist").post(verifyJWT, contentWriteLimiter, createPlaylist)

router.route("/user/:userId").get(optionalVerifyJWT, getUserPlaylists);

router.route("/:playlistId")
    .get(optionalVerifyJWT, getPlaylistById)
    .patch(verifyJWT, contentWriteLimiter, updatePlaylist)
    .delete(verifyJWT, contentWriteLimiter, deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(verifyJWT, interactionLimiter, addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(verifyJWT, interactionLimiter, removeVideoFromPlaylist);

export default router