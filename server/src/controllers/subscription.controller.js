import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {

    const {channelId} = req.params

    if(!channelId)
    {
        throw new ApiError(400, "Chanel ID is missing!")
    }

    if(!isValidObjectId(channelId))
    {
        throw new ApiError(400, "Invalid Channel ID!")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if(existingSubscription)
    {
        await Subscription.findByIdAndDelete(existingSubscription._id)

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                null,
                "Unsubscribed Sucessfully!"
            )
        )
    }

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    if(!subscription)
    {
        throw new ApiError(500, "Internal server error while creating subscription!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscription,
            "Subscribed Sucessfully!"
        )
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    const {channelId} = req.params

    if(!channelId)
    {
        throw new ApiError(400, "Channel Id is missing!")
    }

    if(!isValidObjectId(channelId))
    {
        throw new ApiError(400, "Invalid Channel Id!")
    }

    const channelSubscribers = await Subscription.find(
        {
            channel: channelId
        }
    ).populate("subscriber", "username fullName avatar");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelSubscribers || [],
            "Channel's subscriber list fetched successfully!"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    
    const { subscriberId } = req.params

    if(!subscriberId)
    {
        throw new ApiError(400, "Subscriber Id is missing!")
    }

    if(!isValidObjectId(subscriberId))
    {
        throw new ApiError(400, "Invalid subscriber Id!")
    }

    const subscribedChannels = await Subscription.find({
        subscriber: subscriberId
    }).populate("channel", "username fullName avatar");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribedChannels || [],
            "Subscribed channel list fetched sucessfully!"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}