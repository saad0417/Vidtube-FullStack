import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"



const getVideoComments = asyncHandler(async (req, res) => {

    const {videoId} = req.params
    const {page = 1, limit = 20} = req.query

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is missing!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video Id!")
    }

    const currentUserId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;

    const videoComments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: currentUserId
                    ? {
                        $cond: {
                            if: { $in: [currentUserId, "$likes.likedBy"] },
                            then: true,
                            else: false
                        }
                    }
                    : false
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        }
    ])

    const totalComments = await Comment.countDocuments({
        video: new mongoose.Types.ObjectId(videoId)
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                comments: videoComments || [],
                totalComments
            },
            "Video Comments Fetched Sucessfully!"
        )
    )

})

const addComment = asyncHandler(async (req, res) => {

    const {videoId} = req.params;
    const {content} = req.body;

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is missing!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video Id!")
    }

    if(content?.trim() === "")
    {
        throw new ApiError(400, "Add some details to post comment!")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if(!comment)
    {
        throw new ApiError(500, "Internal server error while creating comment!")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            comment,
            "Comment create sucessfully!"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params
    const {content} = req.body

    if(!commentId)
    {
        throw new ApiError(400, "Comment Id is missing!")
    }

    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid Comment Id!")
    }

    if(content?.trim() === "")
    {
        throw new ApiError(400, "Plese add some content to update!")
    }

    const existingComment = await Comment.findById(commentId)

    if(!existingComment)
    {
        throw new ApiError(404, "Comment not found!")
    }

    // only the author of the comment is allowed to edit it.
    if(existingComment.owner?.toString() !== req.user._id.toString())
    {
        throw new ApiError(403, "You are not allowed to edit this comment!")
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content
            }
        },{ new: true }
    )

    if(!updateComment)
    {
        throw new ApiError(500, "Internal Server Error while updating the comment!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updateComment,
            "Comment Updated Sucessfully!"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {

    const {commentId} = req.params

    if(!commentId)
    {
        throw new ApiError(400, "Comment Id is missing!")
    }

    if(!isValidObjectId(commentId))
    {
        throw new ApiError(400, "Invalid Comment Id!")
    }

    const existingComment = await Comment.findById(commentId)

    if(!existingComment)
    {
        throw new ApiError(404, "Comment not found!")
    }

    // the comment author can always delete, and so can the owner of the video it sits under.
    const isCommentAuthor = existingComment.owner?.toString() === req.user._id.toString()
    let isVideoOwner = false

    if(!isCommentAuthor)
    {
        const video = await Video.findById(existingComment.video).select("owner")
        isVideoOwner = video?.owner === req.user.username
    }

    if(!isCommentAuthor && !isVideoOwner)
    {
        throw new ApiError(403, "You are not allowed to delete this comment!")
    }

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    if(!deleteComment)
    {
        throw new ApiError(500, "Internal server error while deleting comment!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Comment deleted sucessfully!"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }