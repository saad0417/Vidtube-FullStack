import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {hydrateVideoOwners} from "../utils/hydrateVideoOwners.js"


// a playlist may only be changed by the user who created it.
const assertPlaylistOwner = async (playlistId, user) => {

    const playlist = await Playlist.findById(playlistId)

    if(!playlist)
    {
        throw new ApiError(404, "Playlist Not Found!")
    }

    if(playlist.owner?.toString() !== user._id.toString())
    {
        throw new ApiError(403, "You are not allowed to modify this playlist!")
    }

    return playlist
}



const createPlaylist = asyncHandler(async (req, res) => {
    
    const {title, description} = req.body

    if(!title || !description)
    {
        throw new ApiError(400, "Details are missing!")
    }


    const playlist = await Playlist.create(
        {
            title,
            description,
            owner: req.user._id,
        }
    )

    if(!playlist)
    {
        throw new ApiError(500, "Internal server error while creating playlist!")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlist,
            "Playlist Created Sucessfully!"
        )
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    
    const {userId} = req.params

    if(!userId)
    {
        throw new ApiError(400, "User Id is missing!")
    }

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400, "Invalid User Id!")
    }

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400, "Invalid User Id!")
    }

    const userPlaylists = await Playlist.find({
        owner: userId
    }).populate("videos");

    const playlistsWithOwners = await Promise.all(
        userPlaylists.map(async (playlist) => ({
            ...playlist.toObject(),
            videos: await hydrateVideoOwners(playlist.videos)
        }))
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistsWithOwners,
            "User playlists fetched sucessfully!"
        )
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params

    if(!playlistId)
    {
        throw new ApiError(400, "Playlist Id is missing!")
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist Id!")
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos")
        .populate("owner", "username fullName avatar");

    if(!playlist)
    {
        throw new ApiError(404, "Playlist Not Found!")
    }

    const playlistWithOwners = {
        ...playlist.toObject(),
        videos: await hydrateVideoOwners(playlist.videos)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistWithOwners,
            "Playlist fetched sucessfully!"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId, videoId} = req.params

    if(!playlistId)
    {
        throw new ApiError(400, "Playlist Id is missing!")
    }

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is missing!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID!")
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist ID!")
    }

    await assertPlaylistOwner(playlistId, req.user)

    const existingVideo = await Playlist.findOne({
        _id: playlistId,
        videos: videoId
    })

    if(existingVideo)
    {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Video already in playlsit!"
            )
        )
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {// here videos is an array so we will use $push not $set
            $push:{
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist)
    {
        throw new ApiError(500, "Internal server error while updating playlist!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video sucessfully added to playlist!"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId, videoId} = req.params

    if(!playlistId)
    {
        throw new ApiError(400, "Playlist Id is missing!")
    }

    if(!videoId)
    {
        throw new ApiError(400, "Video Id is missing!")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, "Invalid Video ID!")
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist ID!")
    }

    await assertPlaylistOwner(playlistId, req.user)

    const alreadyDeletedVideo = await Playlist.findOne({
        _id: playlistId,
        videos: videoId
    })

    if(!alreadyDeletedVideo)
    {
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "No such Video found to be deleted!"
            )
        )
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos: videoId
            }
        },
        {
            new: true
        }
    ).select("-createdAt -updatedAt -__v")

    if(!updatedPlaylist)
    {
        throw new ApiError(500, "Internal server error while removing video!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video removed sucessfully!"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    
    const {playlistId} = req.params

    if(!playlistId)
    {
        throw new ApiError(400, "Playlist Id is missing!")
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist Id!")
    }

    await assertPlaylistOwner(playlistId, req.user)

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletePlaylist)
    {
        throw new ApiError(500, "Internal server error while deleting playlist!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Playlist Deleted Sucessfully!"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {title, description} = req.body

    if(!playlistId)
    {
        throw new ApiError(400, "Playlist Id is missing!")
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist Id!")
    }

    await assertPlaylistOwner(playlistId, req.user)

    const updateData = {}

    if(title?.trim())
    {
        updateData.title = title
    }

    if(description?.trim())
    {
        updateData.description = description
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updateData
        },{ new:true }
    )

    if(!updatedPlaylist)
    {
        throw new ApiError(500, "Internal server error while updating playlist!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist Updated Sucessfully!"
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}