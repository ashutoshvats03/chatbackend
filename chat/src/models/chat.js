import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const Schema = new mongoose.Schema(
    {
        users: [{
            type: String,
            required: true
        }],
        latestMessage: {
            text: String,
            sender: String
        },
    },
    {
        timestamps: true
    },
);

export const Chat = mongoose.model("Chat", Schema);
