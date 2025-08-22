import mongoose from "mongoose";


const schema = new mongoose.Schema(
    {
        chatId: {
            type: String,
            required: true,
        },
        sender: {
            type: String,
            required: true,
        },
        text:String,
        image:{
            url:String,
            publicId:String,
        },
        messageType:{
            type:String,
            enum:["text","image"],
            default:"text"
        },
        seen:{
            type:Boolean,
            default:false
        },
        seenAt:{
            type:Date,
            default:null
        },
    },

    {
        timestamps: true,
    }
);

export const Messages = mongoose.model("Messages", schema);