import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { consumeCaptcha } from "../utils/captcha.js"

/*
Guards the account endpoints against scripted abuse.
Must run after any body parser (and after multer on multipart routes), since it
reads `captchaId` and `captchaAnswer` from req.body.
*/
export const verifyCaptcha = asyncHandler(async (req, _, next) => {

    const { captchaId, captchaAnswer } = req.body

    const failure = consumeCaptcha(captchaId, captchaAnswer)

    if(failure)
    {
        throw new ApiError(400, failure)
    }

    next()
})
