import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    const username = req.user.username;

    const userVideos = await Video.find({ owner: username }).select("_id views");
    const totalVideos = userVideos.length;
    const totalViews = userVideos.reduce((acc, v) => acc + (v.views || 0), 0);
    const videoIds = userVideos.map(v => v._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });
    const totalSubscribers = await Subscription.countDocuments({ channel: req.user._id });
    const totalTweets = await Tweet.countDocuments({ owner: req.user._id });

    const stats = {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes,
        totalTweets
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            stats,
            "User Stats Fetched Sucessfully!"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    
    const username = req.user.username

    const totalVideos = await Video.find({
        owner: username
    }).sort({ createdAt: -1 });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            totalVideos || [],
            "Total channel videos fetched sucessfully!"
        )
    )

})

export { getChannelStats, getChannelVideos }