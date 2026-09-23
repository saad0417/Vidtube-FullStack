import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {

    const { content } = req.body;

    if(!content?.trim())
    {
        throw new ApiError(400, "Content is required!")
    }

    const tweet = await Tweet.create(
        {
            owner: req.user._id,
            content
        },
    )

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            "Tweet Posted Sucessfully!"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {

    const { userId } = req.params;

    if(!userId)
    {
        throw new ApiError(400, "User ID is required!")
    }

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400, "Invalid User Id!")
    }

    const currentUserId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
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
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: currentUserId ? {
                    $cond: {
                        if: { $in: [currentUserId, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                } : false
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets || [],
            "User Tweets Fetched Sucessfully!"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required!")
    }

    if(!isValidObjectId(tweetId))
    {
        throw new ApiError(400, "Invalid Tweet ID!")
    }

    if(!content?.trim())
    {
        throw new ApiError(400, "Content is required!")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if(!existingTweet)
    {
        throw new ApiError(404, "Tweet not found!")
    }

    // only the author of the post is allowed to edit it.
    if(existingTweet.owner?.toString() !== req.user._id.toString())
    {
        throw new ApiError(403, "You are not allowed to edit this post!")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet)
    {
        throw new ApiError(404, "Tweet not found!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated sucessfully!"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {

    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "Tweet ID is required!")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID!")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if(!existingTweet)
    {
        throw new ApiError(404, "Tweet not found!")
    }

    // only the author of the post is allowed to delete it.
    if(existingTweet.owner?.toString() !== req.user._id.toString())
    {
        throw new ApiError(403, "You are not allowed to delete this post!")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    // deletedTweet gives us the deleted tweet document, so this check is according to that..
    if (!deletedTweet) {
        throw new ApiError(404, "Tweet not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedTweet,
                "Tweet deleted successfully!"
            )
        )
})

const getAllTweets = asyncHandler(async (req, res) => {
    const currentUserId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;
    const tweets = await Tweet.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
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
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: currentUserId ? {
                    $cond: {
                        if: { $in: [currentUserId, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                } : false
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets || [],
            "All Tweets Fetched Successfully!"
        )
    )
})

export {
    createTweet,
    getUserTweets,
    getAllTweets,
    updateTweet,
    deleteTweet
}