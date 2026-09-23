import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    // Step 1 — Get query parameters
    const { page = 1, limit = 10, query, sortBy, sortType, username } = req.query

    // Step 2 — Build the filter
    const matchCase = {
        isPublished: true
    }

    // Search by title or description
    // here this means if query is exists add it to matchCase, "$or" Means at least one condition must be true, "$regex" means search for this text/pattern inside the field, "$options: i" means case-insensitive
    if(query)
    {
        matchCase.$or = [
            { 
                title: 
                {
                    // $regex is used for pattern/text searching
                    $regex: query, 
                    $options: "i"
                } 
            },
            { 
                description: {
                    $regex: query, 
                    $options: "i"
                } 
            }
        ]   
    }

    // i am searching here with username case i have saved the username of the user while publishing the video If we pass the userId then we can also search by userId
    // If user wants videos from a specific userId
    if(username)
    {
        matchCase.owner = username
    }

    // Step 3 — Create aggregation
    const aggregatePipeline = Video.aggregate([
        {
            $match: matchCase
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "username",
                as: "owner",
                pipeline:[
                    {
                        $project:{
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
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])

    // Step 4 — Build sorting filter
    // "aggregatePipeline.pipeline" means 'aggregatePipeline' is the object name and the 'pipeline' is the object that mongoDB creates after aggregation as we dont write await there with Video.aggregate so the DB will not give the output document it only processes and makes an object called pipeline.
    if(sortBy)
    {
        aggregatePipeline.pipeline().push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    }
    else
    {
        aggregatePipeline.pipeline().push({
            $sort: {
                createdAt: -1
            }
        })
    }

    // Step 5 — Add pagination
    const videos = await Video.aggregatePaginate(
        aggregatePipeline,
        {
            page: Number(page),
            limit: Number(limit)
        }
    )

    // Step 6 — Return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "Videos Fetched Sucessfully!"
        )
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    
    const { title, description} = req.body

    // if title or description is missing, means any one is missing.
    if(!title || !description)
    {
        throw new ApiError(400, "Details required to publish a video!")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required!")
    }

    if(!thumbnailLocalPath)
    {
        throw new ApiError(400, "Thumbnail is required!")
    }

    const video = await uploadOnCloudinary(videoLocalPath, "videos");

    if(!video)
    {
        throw new ApiError(400, "Video1 file is required!")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "thumbnails");

    if(!thumbnail)
    {
        throw new ApiError(400, "Thumbnail1 file is required!")
    }

    console.log(video);

    const owner = req.user.username;

    const videoPublished = await Video.create(
        {
            title,
            description,
            owner,
            videoFile: video.url,
            thumbnail: thumbnail.url,
            duration: video.duration ? Number(video.duration.toFixed(2)) : 0,
            isPublished: true
        }
    )

    if(!videoPublished)
    {
        throw new ApiError(500, "Internal server while publishing a video!")
    }
    
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            videoPublished,
            "Video Published Sucessfully!"
        )
    )
})

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if(!videoId?.trim())
    {
        throw new ApiError(400, "Video ID is required!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID!")
    }

    // Increment views
    const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );

    if(!video)
    {
        throw new ApiError(404, "Video not found!")
    }

    // Add to watch history if user is logged in
    if(req.user?._id)
    {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: video._id }
        });
    }

    // Get owner details
    const ownerUser = await User.findOne({ username: video.owner }).select("username fullName avatar");

    // Get subscribers count and isSubscribed
    let subscribersCount = 0;
    let isSubscribed = false;
    if (ownerUser) {
        subscribersCount = await Subscription.countDocuments({ channel: ownerUser._id });
        if (req.user?._id) {
            const sub = await Subscription.findOne({ channel: ownerUser._id, subscriber: req.user._id });
            isSubscribed = !!sub;
        }
    }

    // Get likes count and isLiked
    const likesCount = await Like.countDocuments({ video: videoId });
    let isLiked = false;
    if (req.user?._id) {
        const userLike = await Like.findOne({ video: videoId, likedBy: req.user._id });
        isLiked = !!userLike;
    }

    const videoDetails = {
        _id: video._id,
        title: video.title,
        description: video.description,
        owner: ownerUser ? {
            _id: ownerUser._id,
            username: ownerUser.username,
            fullName: ownerUser.fullName,
            avatar: ownerUser.avatar
        } : { username: video.owner },
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
        duration: video.duration,
        views: video.views,
        isPublished: video.isPublished,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        likesCount,
        isLiked,
        subscribersCount,
        isSubscribed
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videoDetails,
            "Video Details Fetched Successfully!"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is required!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID!")
    }

    const {title, description} = req.body;

    // the thumbnail is optional here, a user may want to rename a video without replacing its cover.
    const thumbnailLocalPath = req.file?.path;

    if(!title && !description && !thumbnailLocalPath)
    {
        throw new ApiError(400, "Details are required!")
    }

    const video = await Video.findById(videoId);

    if(!video)
    {
        throw new ApiError(404, "Video not found!")
    }

    // only the creator of the video is allowed to edit it.
    if(video.owner !== req.user.username)
    {
        throw new ApiError(403, "You are not allowed to edit this video!")
    }

    const updateData = {}

    if(thumbnailLocalPath)
    {
        // this is for extracting old public ID from existing Cloudinary URL
        const oldPublicId = video.thumbnail
            ?.split("/upload/")[1]
            ?.replace(/^v\d+\//, "")
            ?.split(".")[0]

        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath, "thumbnails");

        if(!newThumbnail?.url)
        {
            throw new ApiError(400, "Error while uploading file on cloudinary!")
        }

        // Delete old thumbnail
        if(oldPublicId)
        {
            await deleteFromCloudinary(oldPublicId)
        }

        updateData.thumbnail = newThumbnail.url
    }

    // here we are checking that if user doesn't give anyone of it then and we update this entry is DB then it will be set setted as undefined or empty.
    if (title) updateData.title = title
    if (description) updateData.description = description

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateData
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video details updated sucessfully!"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is required!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID!")
    }

    const video = await Video.findById(videoId);

    if(!video)
    {
        throw new ApiError(404, "Video not found!")
    }

    // only the creator of the video is allowed to delete it.
    if(video.owner !== req.user.username)
    {
        throw new ApiError(403, "You are not allowed to delete this video!")
    }

    const thumbnailPublicId = video.thumbnail
    ?.split("/upload/")[1]
    ?.replace(/^v\d+\//, "")
    ?.replace(/\.[^/.]+$/, "")

    const videoPublicId = video.videoFile
    .split("/upload/")[1]
    .split("/")
    .slice(1)
    .join("/")
    .replace(".mp4", "")

    // for images deletion we dont have to pass resourceType as the default is set to image.
    await deleteFromCloudinary(thumbnailPublicId)

    await deleteFromCloudinary(videoPublicId, "video")
    
    await Video.findByIdAndDelete(videoId);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Video Deleted Sucessfully!"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is required!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID!")
    }

    const video = await Video.findById(videoId)

    if(!video)
    {
        throw new ApiError(404, "Video not found!")
    }

    // only the creator of the video is allowed to publish or unpublish it.
    if(video.owner !== req.user.username)
    {
        throw new ApiError(403, "You are not allowed to change this video!")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { 
            new: true 
        }
    ).select("-duration -createdAt -updatedAt -views")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Published status toggled sucessfully!"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}