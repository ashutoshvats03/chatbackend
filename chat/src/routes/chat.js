import express from "express";
import { createNewChat, getAllChats , getMessagesByChat, sendMessage } from "../controllers/chat.js";
import isAuth from "../middlewears/isAuth.js";
import {upload} from "../middlewears/Multer.js";

const chatRoutes= express.Router();

chatRoutes.post("/chat/new",isAuth,createNewChat)
chatRoutes.get("/chat/all",isAuth,getAllChats)
chatRoutes.post("/message",isAuth,upload.single('image'),sendMessage)
chatRoutes.get("/message/:chatId",isAuth,getMessagesByChat)

export default chatRoutes;