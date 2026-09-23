import mongoose, {Schema} from "mongoose";
// if we have imported Schema here then we don't need to write mongoose.Schema 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String,  // Cloudinary URL
            required: [true, "Video file is required"]
        },
        thumbnail: {
            type: String,  // Cloudinary URL
            required: [true, "Thumbnail is required"]
        },
        owner: {   // here i changed "Schema.Types.ObjectId" to "Schema.Types.Mixed" beacuse ObjectId store only id so if we want to store the user's username while publishing the video it gives us optoin to store either username or userID
            type: Schema.Types.Mixed,
            ref: "User"
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            required: true
        }

    },{timestamps: true}
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)