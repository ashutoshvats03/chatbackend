import dotenv from "dotenv";
import express from "express";
import { createClient } from "redis";
import connectDB from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import userRoutes from "./routes/user.js";
import cors from "cors";
dotenv.config();



const app=express();
app.use(express.json());
app.use(cors());

const port=process.env.PORT;

connectDB();

connectRabbitMQ();

export const redisClient = createClient({
    url: process.env.REDIS_URL,
});
redisClient.connect().then(()=>{
    console.log("connected to redis")
}).catch((err)=>{
    console.log("error connecting to redis")
    console.log(err)
});

app.use("/api/user", userRoutes);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})