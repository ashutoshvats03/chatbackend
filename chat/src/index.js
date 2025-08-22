import dotenv from "dotenv";
import express from "express";
import chatRoutes from "./routes/chat.js"
import connectDB from "../src/config/db.js";
import cors from "cors";
import { app , server} from "./config/Socket.js";
dotenv.config();
const port = process.env.PORT;



app.use(cors())
connectDB();
app.use(express.json())
app.use("/api/user",chatRoutes)


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})