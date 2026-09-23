import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs' // file system for file handling.

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath, folder) => {
    try 
    {
        if(!localFilePath) return null

        // upload file on cloudinay...
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto", // png, jpg, mp3, mp4 etc...
            folder: folder
        })

        // File uploaded successfully...
        // console.log("File successfully uploaded on cloudinary", response.url);
        // console.log("File successfully uploaded on cloudinary", response);
        fs.unlinkSync(localFilePath)
        return response    
    } 
    catch (error) 
    {
        // removes the locally saved temporary file as the file operation failed
        if (fs.existsSync(localFilePath)) 
        {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            type: "upload"
        })

        return response

    } catch (error) {
        console.log("Cloudinary deletion error:", error)
        return null
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}