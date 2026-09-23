import { User } from "../models/user.model.js"

/*
Videos store their `owner` as the creator's username string (see video.model.js),
so endpoints that simply `.populate("videos")` hand the frontend a bare username
with no display name or avatar. This looks the matching users up in one query and
swaps `owner` for the same object shape the aggregation-based endpoints return.

Accepts plain objects or mongoose documents and always returns plain objects.
*/
const hydrateVideoOwners = async (videos) => {

    if(!Array.isArray(videos) || videos.length === 0) return []

    // mongoose documents have to be converted before we can reassign `owner`.
    const plainVideos = videos.map((video) => (
        typeof video?.toObject === "function" ? video.toObject() : video
    ))

    const usernames = [
        ...new Set(
            plainVideos
                .map((video) => video?.owner)
                .filter((owner) => typeof owner === "string" && owner.trim())
        )
    ]

    if(usernames.length === 0) return plainVideos

    const users = await User.find({ username: { $in: usernames } })
        .select("username fullName avatar")
        .lean()

    const usersByUsername = new Map(users.map((user) => [user.username, user]))

    return plainVideos.map((video) => {

        if(typeof video?.owner !== "string") return video

        const user = usersByUsername.get(video.owner)

        return {
            ...video,
            owner: user
                ? {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    avatar: user.avatar
                }
                : { username: video.owner }
        }
    })
}

export { hydrateVideoOwners }
