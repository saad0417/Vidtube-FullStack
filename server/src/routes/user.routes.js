import {Router} from "express"
import { 
    becomeCreator,
    changeAccountDetails, 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAvatar, 
    updateCoverImage } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js"
import { verifyCaptcha } from "../middlewares/captcha.middleware.js"


const router = Router()

router.route("/register").post(
    upload.fields([  // upload.fields can upload multiple files while upload.single uploads single file to multer.
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    verifyCaptcha,
    registerUser
)

router.route("/login").post(verifyCaptcha, loginUser)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

// here in the upload.single we are just passsing single name and no maxCount here because we are uploading only one file only.
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateAvatar
)

router.route("/update-cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateCoverImage
)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/become-creator").post(verifyJWT, becomeCreator)

router.route("/update-account-details").patch(verifyJWT, changeAccountDetails)

router.route("/ch/:username").get(optionalVerifyJWT, getUserChannelProfile)

router.route("/watch-history").get(verifyJWT, getWatchHistory)


export default router
