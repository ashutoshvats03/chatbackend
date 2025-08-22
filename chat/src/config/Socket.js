import {Server,Socket} from 'socket.io'
import http from 'http'
import express from 'express'


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
}

io.on("connection", (socket) => {
    // console.log("a user connected",socket.id);

    const userId = socket.handshake.query.userId;
    if(userId && userId!==undefined){
        userSocketMap[userId] = socket.id
        // console.log(`user ${userId} connected with socket id ${socket.id}`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    if(userId){
        socket.join(userId);
    }
    socket.on("typing",(data)=>{
        // console.log(`user ${data.chatId} is typing in chat ${data.chatId}`);
        socket.to(data.chatId).emit("userTyping",{
            chatId:data.chatId,
            userId:data.userId

        });
    })

    socket.on("stopTyping", (data) => {
        // console.log(`user ${data.chatId} stopped typing in chat ${data.chatId}`);
        socket.to(data.chatId).emit("userStoppedTyping",{
            chatId:data.chatId,
            userId:data.userId
        });
    });

    socket.on("joinChat",(chatId)=>{
        socket.join(chatId);
        // console.log(`user with ${userId} joined chat ${chatId}`);
    })

    socket.on("leaveChat",(chatId)=>{
        socket.leave(chatId);
        // console.log(`user with ${userId} left chat ${chatId}`);
    })

    socket.on("disconnect", () => {
        // console.log("user disconnected",socket.id);
        if(userId && userId!==undefined){
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
    socket.on("connect_error", (err) => {
        console.log("Socket connection error",err);
    });
    
});

export {app , server, io};