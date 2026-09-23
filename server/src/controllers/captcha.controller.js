import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { createCaptcha } from "../utils/captcha.js"

const getCaptcha = asyncHandler(async (req, res) => {

    const captcha = createCaptcha()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            captcha,
            "Captcha generated sucessfully!"
        )
    )
})

export { getCaptcha }
