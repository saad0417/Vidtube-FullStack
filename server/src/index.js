// require('dotenv').config({path: "./env"})
// dotenv loads environment variables from .env file into process.env.
import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config({path: './.env'})


connectDB()
.then(() => {
    // app.on and more here checks if express app is running or not, if not then it will throw an error.
    app.on("error", (error) => {
            console.log("ERRR:", error);
            throw error;
        })

    app.listen(process.env.PORT || 4000, () => {
        console.log(`⚙️  Server is running at port : ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.error("MongoDB connection failed!!", error);
})










/*
import express from 'express'

const app = express()

// IFFE
;( async () => {
    try 
    {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)    
        app.on("error", (error) => {
            console.log("ERRR", error);
            throw error;
        })

        app.listen(process.env.PORT, () => {
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    } 
    catch (error) 
    {
        console.error("Error", error);
        throw error;
    }
})()  */