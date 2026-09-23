import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {hydrateVideoOwners} from "../utils/hydrateVideoOwners.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is missing!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Vidoe Id!")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Video like removed sucessfully!"                
            )
        )
    }

    const createLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createLike,
            "Video like added sucessfully!"                
        )
    ) 
})

const toggleCommentLike = asyncHandler(async (req, res) => {

    const {commentId} = req.params

    if(!commentId)
    {
        throw new ApiError(400, "Comment Id is missing!")
    }

    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid Comment ID!")
    }

    const existingComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingComment) {
        await Like.findByIdAndDelete(existingComment._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Comment like removed sucessfully!"                
            )
        )
    }

    const createComment = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createComment,
            "Comment like added sucessfully!"                
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    
    const {tweetId} = req.params
    
    if(!tweetId)
    {
        throw new ApiError(400, "Tweet Id is missing!")
    }

    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400, "Invalid Tweet ID!")
    }

    const existingTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingTweet) {
        await Like.findByIdAndDelete(existingTweet._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Tweet like removed sucessfully!"                
            )
        )
    }

    const createTweet = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createTweet,
            "Tweet like added sucessfully!"                
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: { $ne: null }
    }).populate("video").sort({ createdAt: -1 });

    // a like whose video was deleted since still has a null `video`.
    const existingLikes = likedVideos.filter((like) => like.video)

    const hydratedVideos = await hydrateVideoOwners(
        existingLikes.map((like) => like.video)
    )

    const likesWithOwners = existingLikes.map((like, index) => ({
        ...like.toObject(),
        video: hydratedVideos[index]
    }))

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likesWithOwners,
            "All liked videos fetched sucessfully!"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}