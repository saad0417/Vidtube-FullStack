import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { Video } from "../models/video.model.js"

// here in this middleware 'req' and 'next' is being used while 'res' is not being used so we can write '_' instead of it.
export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        // here we are accessing the token using cookies if not available in cookies then from header later we will use this access token to logout the user, actually we match the token with our database and logout the user. we are using access token for logging out because for register and login we take data from frontend and authenticate the user while in case of logout we can't take any data from frontend so we use access tokens and clear them to logout.
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token)
        {
            throw new ApiError(401, "Unauthorized Request!")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // here we are getting the user from decoded token 
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user)
        {
            throw new ApiError(401, "Invalid Access Token!")
        }
    
        // here we have access of 'req' so we are creating new object as req.user by refering it to user.
        req.user = user
        next()
    } 
    catch (error) 
    {
        throw new ApiError(401, error?.message || "Invalid Access Token!")
    }
})

export const optionalVerifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            req.user = null;
            return next();
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        req.user = user || null;
        next();
    } catch (error) {
        req.user = null;
        next();
    }
});

/*
Anyone who already published before the isCreator flag existed is a creator by
definition, so promote them on the fly rather than locking them out.
Returns true when the user may use creator features.
*/
export const ensureCreatorStatus = async (user) => {

    if(!user) return false
    if(user.isCreator) return true

    const publishedCount = await Video.countDocuments({ owner: user.username })

    if(publishedCount > 0)
    {
        user.isCreator = true
        await user.save({ validateBeforeSave: false })
        return true
    }

    return false
}

// Blocks the creator-only endpoints for users who have not created a channel.
export const requireCreator = asyncHandler(async (req, _, next) => {

    const isCreator = await ensureCreatorStatus(req.user)

    if(!isCreator)
    {
        throw new ApiError(403, "Create your channel to use creator features!")
    }

    next()
})
