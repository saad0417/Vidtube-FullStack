// if we have imported Schema here then we don't need to write mongoose.Schema 
import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary URL
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"]
        },
        refreshToken :{
            type: String
        },
        // Viewers start as viewers. Creator tools stay hidden until the user
        // opts in by creating their channel.
        isCreator: {
            type: Boolean,
            default: false
        }
    },{timestamps: true}
)

// .pre means what we want to do just before saving the content in the database.
//This is a classic Mongoose middleware issue. The issue is that pre("save") does NOT receive next as a parameter when used with async/await in newer versions of Mongoose. When using async/await remove next().
userSchema.pre("save", async function() {
    if(!this.isModified("password")) return
    
    this.password = await bcrypt.hash(this.password, 10) // here 10 means rounds
    // next() // here next means we are done with our work and now we can save the content in the database or passes the control to the next middleware function.
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            // as refresh tokens refreshes frequently so we are taking only id here.
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema)