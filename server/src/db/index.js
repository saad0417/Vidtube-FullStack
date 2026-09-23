import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
    try
    {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);

        // This gives us the host id of the connected database, which is useful for debugging and logging purposes.
        console.log(`\nMongoDB Connected !! DB Host: ${connectionInstance.connection.host}`);
        
    } 
    catch (error) 
    {
        console.error("MONGODB connection FAILED:", error);
        process.exit(1);
    }
}

export default connectDB;