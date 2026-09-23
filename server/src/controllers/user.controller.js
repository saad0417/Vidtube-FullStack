import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";
import mongoose from 'mongoose';
import { ensureCreatorStatus } from '../middlewares/auth.middleware.js';

const generateAccessAndRefreshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        // if we don't use this validation condition then before saving db will check all required conditions.
        await user.save({validateBeforeSave: false})

        // the above code finds the user and generate tokens for it and this return will gives us the tokens outside this method where we use this method.
        return {accessToken, refreshToken}
   } 
   catch (error) 
   {
        throw new ApiError(500, "something went wrong while generating access and refresh tokens!")
   }

}


// USER REGISTER CONTROLLER

const registerUser = asyncHandler( async (req, res) => {
    // 1. get details from Frontend
    // 2. validation - email, password more (must not be empty)
    // 3. check if user already exists: username, email
    // 4. check for images, check for avatar (these 2 uses file handling (multer) done in user.routes.js)
    // 5. upload on cloudinary, check avatar
    // 6. create user object - create entry in db
    // 7. remove password and refresh token field from response
    // 8. check for user creation
    // 9. return responese

    // 1. get details from Frontend
    const { fullName, email, username, password } = req.body
    // console.log("email:", email);
    // console.log(req.body);

    // 2. validation - email, password more (must not be empty)
    // .some() method checks whether at least one element in an array satisfies a condition.
    if([fullName, email, username, password].some((field) => field?.trim() === ""))
    {
        throw new ApiError(400, "All fields are required!")
    }

    // 3. check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if(existedUser)
    {
        throw new ApiError(409, "User with email or username already exists!")
    }

    // 4. check for images, check for avatar (these 2 uses file handling (multer) done in user.routes.js)
    const avatarImageLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // Array.isArray() method checks whether the provided value is an array. It returns only true and false. 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarImageLocalPath)
    {
        throw new ApiError(400, "Avatar is required1!")
    }

    // 5. upload on cloudinary, check avatar
    const avatar = await uploadOnCloudinary(avatarImageLocalPath, "avatars");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImages");

    if(!avatar)
    {
        throw new ApiError(409, "Avatar file is required2!")
    }

    // 6. create user object - create entry in db
    const user = await User.create(
        {
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "", // here coverImage is optional field in DB you we are optionally checking it like if user hasn't uploded coverImage the DB may crash.
            email,
            password,
            username: username.toLowerCase()
        }
    )

    // 7. remove password and refresh token field from response
    // in .select() method all fields are already selected we have write the fields with '-' to exclude it.
    // So Mongoose internally does something like: User.findById("687d8d1234567890abcdef12");
    const checkUserCreated = await User.findById(user._id).select(
        "-password -refreshTokens"
    )
    
    // 8. check for user creation
    if(!checkUserCreated)
    {
        throw new ApiError(500, "Internal Server Error while registering the user!")
    }

    // 9. return responese
    return res.status(201).json(
        new ApiResponse(200, checkUserCreated, "User registered successfully!")
    )

})



// USER LOGIN CONTROLLER

const loginUser = asyncHandler(async (req, res) => {

    // 1. req body --> data
    // 2. username or email (check empty)
    // 3. find user
    // 4. password (if exists)
    // 5. generate access and refresh token
    // 6. send them in secure cookies

    // 1. req body --> data
    const {username, email, password} = req.body
    // console.log(email || username);

    // 2. username or email (check)
    // here we are checking that if both email or username is missing.
    if(!username && !email)
    {
        throw new ApiError(400, "username or email is required!")
    }

    // // this is the logical alternative of the above code
    // if(!(username || email))
    // {
    //     throw new ApiError(400, "username or email is required!")
    // }

    // 3. find user

    // here $or is OR operator provided by MongoDB itself
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user)
    {
        throw new ApiError(404, "user does not exist!")
    }

    // 4. password (if exists)

    // if we want to access our own created method in user models then we will use this "user" not "User", "user" is used for accessing our own created method while "User" is used for accessing MongoDB provided methods

    // If password exists, trim it, non-empty string is JS is always truthy; otherwise optional chaining returns undefined if there is no password i.e optional chaining will call .trim() and returns undefined(which is false). Throw an error if the result is empty or missing.
    if(!password?.trim())
    {
        throw new ApiError(401, "Password is required to login!")
    }

    const checkPassword = await user.isPasswordCorrect(password)

    if(!checkPassword)
    {
        throw new ApiError(401, "invalid user credentials!")
    }

    // 5. generate access and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    // // we can also just update the user object instead of querying the DB, as mongoDB objects are not like simple JS objects so we use '.toObject()' to convert them into JS objects.
    // const updatedUser = user.toObject();
    // delete updatedUser.password;
    // delete updatedUser.refreshToken;

    // 6. send them in secure cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    // The response is sent back to the client (browser, React app, Postman, mobile app, etc.) that made the HTTP request.
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user loggedIn successfully!"
        )
    )
})



// USER LOGOUT CONTROLLER

//we are using access token for logging out because for register and login we take data from frontend and authenticate the user while in case of logout we can't take any data from frontend so we use access tokens and clear them to logout.
const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            // here unset removes the field from the document.
            $unset: {
                refreshToken: 1
            }
        },
        {//  here new will allow accepting new updated fresh value
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    // here we are returnig the response and and clearing the cookies.
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully!"
        )
    )

})


// REFRESH ACCESS TOKEN (to avoid user to repeatedly login again after sessoin runs out or access token expires)

const refreshAccessToken = asyncHandler(async (req, res) => {

    // req.body.refreshToken is used if somebody is using mobile version
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken)
    {
        throw new ApiError(401, 'Unauthorized Request!')
    }

    try {
        // verify incomming token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        // find user from db
        const user = await User.findById(decodedToken?._id)
    
        if(!user)
        {
            throw new ApiError(401, "Invalid Refresh Token!")
        }

        // console.log("Incoming:", incomingRefreshToken);
        // console.log("Database:", user.refreshToken);
    
        // now match both tokens
        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401, "Refresh token is used or expired!")
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("newRefreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                "Access Token Refreshed!"
            )
        )
    } 
    catch (error) 
    {
        throw new ApiError(401, error?.message || "Invalid Refresh Token!")     
    }

})



// CHANGE USER CURRENT PASSWORD
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid Password!")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password Changed Successfully!"
        )
    )
})


// GET CURRENT LOGGED IN USER
// this is used for frontend to get the data like username profile avatar image and more to check who was logged in after refreshing the page.
const getCurrentUser = asyncHandler(async (req,res) => {
    // Promotes accounts that published before the flag existed, so the client
    // always sees an accurate isCreator.
    await ensureCreatorStatus(req.user)

    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully!"))
})


// CHANGE ACCOUNT DETAILS
// here we have to decide that what fields do we want, user can change

const changeAccountDetails = asyncHandler(async(req,res) => {
    
    // here we can also take more details that use can change like username... etc.
    const {fullName, email} = req.body // this is the data that we are taking from frontend.

    if(!fullName || !email)
    {
        throw new ApiError(400, "All fields are required!")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email: email //here both methods are correct for passing objects.
            }
        },
        {
            new: true // this new: true returns us new updated values
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"))
})


// UPDATE USER AVATAR
const updateAvatar = asyncHandler(async(req, res) => {
    
    // here we are uploading and saving new avatar and also deleting old avatar.

    // this all below process executes after the new file is uploaded.
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is missing!")
    }

    // get current user so we know which user avatar to be updated.
    const user = await User.findById(req.user?._id)

    if(!user)
    {
        throw new ApiError(404, "User not found!")
    }

    // this is for extracting old public ID from existing Cloudinary URL
    const oldPublicId = user.avatar
        ?.split("/upload/")[1]
        ?.replace(/^v\d+\//, "")
        ?.split(".")[0]

    const newAvatar = await uploadOnCloudinary(avatarLocalPath, "avatars")

    if(!newAvatar?.url)
    {
        throw new ApiError(400, "Error while uploading avatar on cloudinary!")
    }

    // Delete old avatar
    if(oldPublicId)
    {
        await deleteFromCloudinary(oldPublicId)
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: newAvatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Avatar updated successfully!"))

})


// UPDATE USER COVER IMAGE
const updateCoverImage = asyncHandler(async(req, res) => {

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath)
    {
        throw new ApiError(400, "Cover Image file is missing!")
    }

    // get current user to know which cover image to be updated.
    const user = await User.findById(req.user?._id)

    if(!user)
    {
        throw new ApiError(404, "User not found!")
    }

    // this is for extracting old public ID from existing Cloudinary URL
    const oldPublicId = user.coverImage
            ?.split("/upload/")[1]
            ?.replace(/^v\d+\//, "")
            ?.split(".")[0]

    const newCoverImage = await uploadOnCloudinary(coverImageLocalPath, "coverImages")

    if(!newCoverImage?.url)
    {
        throw new ApiError(400, "Error while uploading cover image on cloudinary!")
    }

    // delete old cover image
    if(oldPublicId)
    {
        await deleteFromCloudinary(oldPublicId)
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: newCoverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Cover Image updated successfully!"))

})

// GET USER CAHNNEL PROFILE
const getUserChannelProfile = asyncHandler(async(req, res) => {
    
    const {username} = req.params

    if(!username?.trim())
    {
        throw new ApiError(400, "Username not found!")
    }

    // MongoDB Aggregation Pipeline (a pipeline is a series of steps that MongoDB applies to your documents one after another.)
    const channel = await User.aggregate([
        {
            $match:{
                // First find the user by username, then use the user's _id to find all subscriptions where that _id matches the channel field.
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: { // $lookup is (like JOIN in SQL) used to find subscribers
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: { // this one is used to find channels the user subscribed to
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channelsSubscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    // $size counts how many documents/elements created in that array
                    $size: "$subscribers"
                },

                channelSubscribedCount: {
                    $size: "$channelsSubscribedTo"
                },

                // this is for 'subscribe' button
                isSubscribed: {
                    // here $in checks wheather the value exists in the array or object. '$in' can calculate in array as well in the object.
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // '$project' is used to show only selected values.
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                avatar: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length)
    {
        throw new ApiError(404, "Chanel doesn't exists!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully!"
        )
    )

})

// GET USER WATCH HISTORY
const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        { // here we are using '_id: new mongoose.Types.ObjectId(req.user?._id)' because aggregation demands pure mongoDb if we write req.user?._id here then it will return us the id string but it is waiting for something like this "_id: ObjectId('6a7ad8135ac3427507de1c5a')"
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            // Go to the videos collection, Take the current User's watchHistory array, Look for videos whose _id matches those IDs
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "username",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // this $addFields is just used to convert this output structure '[{}]' into '{}'
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched sucessfully!"
        )
    )
})


// CREATE CHANNEL / BECOME A CREATOR
// The account already is the channel in this data model, so opting in only
// flips the flag that reveals the creator tools. Idempotent on purpose: a
// double submit from the client must not fail.
const becomeCreator = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user._id).select("-password -refreshToken")

    if(!user)
    {
        throw new ApiError(404, "User not found!")
    }

    if(!user.isCreator)
    {
        user.isCreator = true
        await user.save({ validateBeforeSave: false })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Channel created successfully!"
        )
    )
})


export {registerUser, loginUser, logoutUser, becomeCreator, refreshAccessToken, changeCurrentPassword, getCurrentUser, changeAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory}