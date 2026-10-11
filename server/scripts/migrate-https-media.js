/*
One-off migration: rewrite stored Cloudinary URLs from http:// to https://.

Uploads used to save Cloudinary's `url` (http) instead of `secure_url`, so the
site loaded every video, thumbnail and avatar over http and browsers logged
"Mixed Content" warnings. New uploads now store `secure_url`; this fixes the
documents that already exist.

Usage (from the server/ folder, with MONGODB_URI in .env):
    node -r dotenv/config scripts/migrate-https-media.js           # dry run: only reports
    node -r dotenv/config scripts/migrate-https-media.js --apply   # writes the changes

Safe to run more than once: it only touches values that still start with http://.
*/
import mongoose from "mongoose"
import { DB_Name } from "../src/constants.js"

const HTTP = "http://res.cloudinary.com/"
const HTTPS = "https://res.cloudinary.com/"

const TARGETS = [
    { collection: "videos", fields: ["videoFile", "thumbnail"] },
    { collection: "users", fields: ["avatar", "coverImage"] },
]

const apply = process.argv.includes("--apply")

const run = async () => {

    if(!process.env.MONGODB_URI)
    {
        throw new Error("MONGODB_URI is not set. Run with: node -r dotenv/config scripts/migrate-https-media.js")
    }

    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
    const db = mongoose.connection.db

    console.log(`Database: ${db.databaseName}  |  mode: ${apply ? "APPLY" : "dry run (no changes)"}\n`)

    let total = 0

    for(const { collection, fields } of TARGETS)
    {
        for(const field of fields)
        {
            const filter = { [field]: { $regex: "^http://res\\.cloudinary\\.com/" } }
            const count = await db.collection(collection).countDocuments(filter)
            total += count

            if(apply && count > 0)
            {
                const result = await db.collection(collection).updateMany(filter, [
                    {
                        $set: {
                            [field]: {
                                $replaceOne: { input: `$${field}`, find: HTTP, replacement: HTTPS }
                            }
                        }
                    }
                ])
                console.log(`${collection}.${field}: updated ${result.modifiedCount} of ${count}`)
            }
            else
            {
                console.log(`${collection}.${field}: ${count} to update`)
            }
        }
    }

    console.log(`\n${apply ? "Updated" : "Would update"} ${total} value(s).`)
    if(!apply && total > 0) console.log("Run again with --apply to write the changes.")
}

run()
    .catch((error) => {
        console.error("Migration failed:", error.message)
        process.exitCode = 1
    })
    .finally(() => mongoose.disconnect())
