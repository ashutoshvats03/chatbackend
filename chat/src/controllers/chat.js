import axios from "axios";
import dotenv from "dotenv";
import TryCatch from "../config/TryCatch.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import { getReceiverSocketId, io } from "../config/Socket.js";
dotenv.config();


export const createNewChat = TryCatch(async (req, res) => {
    console.log(req.body.userId2);
    console.log(req.user._id);
    const userId = req.user?._id;
    const userId2 = req.body.userId2;

    if (!userId2) {
        return res.status(400).json({ message: "Please provide user id of another user" });
    }
    const existingChat = await Chat.findOne({
        users: {
            $all: [userId, userId2],
            $size: 2
        }
    });

    if (existingChat) {
        return res.status(200).json({
            message: "Chat already exists",
            chatId: existingChat._id,
        });
    }
    const newChat = await Chat.create({
        users: [userId, userId2]
    });
    res.status(201).json({
        message: "Chat created successfully",
        chat: newChat
    })
})

export const getAllChats = TryCatch(async (req, res) => {

    const userId = req.user?._id;

    if (!userId) {
        return res.status(400).json({ message: "User id missing" });
    }
    const chats = await Chat.find({
        users: userId
    }).sort({ updatedAt: -1 }); //the -1 is to sort in decending order and the one text , comes on top
    // console.log(userId, "me");
    const chatWithUserData = await Promise.all(
        chats.map(async (chat) => {
            // console.log(chat.users, "every chat");
            const userId2 = chat.users.find((_id) => _id.toString() !== userId.toString());
            // console.log(userId2, "2");
            const unseenCount = await Messages.countDocuments({
                chatId: chat._id,
                sender: { $ne: userId },//sender other me
                seen: false
            });
            try {
                const { data } = await axios.get(`${process.env.USER_SERVICE}/api/user/user/${userId2}`, {
                    headers: {
                        authorization: req.headers.authorization
                    }
                });
                return {
                    user: data,
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount,
                    },
                }
            }
            catch (error) {
                // console.log("---------------");
                // console.log(error);
                return {
                    user: {
                        _id: userId2,
                        name: "unknown User",
                    },
                    chat: {
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage || null,
                        unseenCount
                    },

                };
            }
        })
    )
    return res.status(200).json({
        chats: chatWithUserData
    });
})

export const sendMessage = TryCatch(async (req, res) => {
    console.log(req.user)
    const senderId = req.user?._id;
    const { chatId, text } = req.body;
    const imageFile = req.file;

    if (!senderId) {
        return res.status(401).json({
            message: "unauthorized 1"
        });
    }
    if (!chatId) {
        return res.status(400).json({
            message: " chatId required , unauthorized"
        });
    }
    if (!text && !imageFile) {
        return res.status(400).json({
            message: "text or image required"
        })
    }
    const chat = await Chat.findById(chatId);

    if (!chatId) {
        return res.status(404).json({
            message: "Chat not found"
        });
    }
    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === senderId.toString()
    )
    if (!isUserInChat) {
        return res.status(403).json({
            message: "You are not a participant of this chat"
        })
    }
    const otherUserId = chat.users.find((userId) => userId.toString() !== senderId.toString())
    if (!otherUserId) {
        return res.status(401).json({
            message: "unauthorized 2"
        });
    }
    //socket setup
    const receiverSocketId = getReceiverSocketId(otherUserId);
    let isReceiverInChat = false;
    if (receiverSocketId) {
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if (receiverSocket && receiverSocket.rooms.has(chatId)) {
            isReceiverInChat = true;
        }
    }


    let messageData = {
        chatId: chatId,
        sender: senderId,
        seen: isReceiverInChat,
        seenAt: isReceiverInChat ? new Date() : undefined,
    }
    if (imageFile) {
        messageData.image = {
            url: imageFile.path,
            publicId: imageFile.filename,
        };
        messageData.messageType = "image"
        messageData.text = text || " ";
    } else {
        messageData.messageType = "text"
        messageData.text = text;
    }
    const message = new Messages(messageData);
    const savedMessage = await message.save();
    const latestMessageText = imageFile ? "📷 Image" : text

    await Chat.findByIdAndUpdate(
        chatId, {
        latestMessage: {
            sender: senderId,
            text: latestMessageText,
        },
        updatedAt: new Date(),
    }, { new: true });

    //emit to socket
    io.to(chatId).emit("newMessage", savedMessage)

    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", savedMessage)
    }

    const senderSocketId = getReceiverSocketId(senderId.toString());

    if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", savedMessage)
    }

    if (isReceiverInChat && receiverSocketId) {
        io.to(receiverSocketId).emit("messageSeen", {
            chatId: chatId,
            seenBy: otherUserId,
            messageIds: [savedMessage._id]
        })
    }

    return res.status(201).json({
        sender: senderId,
        message: savedMessage
    })
})

export const getMessagesByChat = TryCatch(async (req, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;
    if (!chatId) {
        return res.status(400).json({
            message: " chatId required , unauthorized"
        });
    }
    if (!userId) {
        return res.status(400).json({
            message: " userId required , unauthorized"
        });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
        return res.status(404).json({
            message: "Chat not found"
        });
    }
    const isUserInChat = chat.users.some(
        (uId) => uId.toString() === userId.toString()
    )
    if (!isUserInChat) {
        return res.status(403).json({
            message: "You are not a participant of this chat"
        })
    }
    const messagesToMarkSeen = await Messages.find({
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
    });
    await Messages.updateMany({
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
    }, {
        seen: true,
        seenAt: new Date(),
    });
    const messages = await Messages.find({
        chatId,
    }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find((id) => id !== userId)
    try {
        const { data } = await axios.get(
            `${process.env.USER_SERVICE}/api/user/user/${otherUserId}`, {
            headers: {
                authorization: req.headers.authorization
            },
        }
        );
        if (!otherUserId) {
            return res.status(400).json({
                message: "otheruser not found"
            })
        }
        //socket work

        try {
            if (messagesToMarkSeen.length > 0) {
                const otherUserSocketId = getReceiverSocketId(otherUserId.toString());
                if (otherUserSocketId) {
                    io.to(otherUserSocketId).emit("messageSeen", {
                        chatId: chatId,
                        seenBy: userId,
                        messageIds: messagesToMarkSeen.map((message) => message._id)
                    })
                }
            }
        } catch (error) {
            console.log(error);
        }

        return res.status(200).json({
            messages: messages,
            user: data
        })
    } catch (error) {
        console.log(error);
        res.json({
            messages: messages,
            user: {
                _id: otherUserId,
                name: "unknown user"
            }
        })
    }
})