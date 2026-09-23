import mongoose, {Schema} from "mongoose";
// if we have imported Schema here then we don't need to write mongoose.Schema 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema({
    content:{
        type: String,
        required: true
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    

},{timestamps: true});


commentSchema.plugin(mongooseAggregatePaginate);


export const Comment = mongoose.model("Comment", commentSchema);