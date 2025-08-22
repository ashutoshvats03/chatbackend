import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";
dotenv.config();

const app = express();

startSendOtpConsumer();

app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${process.env.PORT}`)
})