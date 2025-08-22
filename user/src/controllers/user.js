import { TryCatch } from "../config/TryCatch.js";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { redisClient } from "../index.js";
import { User } from "../model/user.js";

export const loginUser = TryCatch(async (req, res) => {
    const { email } = req.body;

    const rateLimitKey = `otp:ratelimit:${email}`;
    const otpKey = `otp:${email}`

    const rateLimit = await redisClient.get(rateLimitKey);
    if (rateLimit) {
        return res.status(429).json({ error: "rate limit exceeded" })

    }
    const otp = Math.floor(Math.random() * 100000 + 100000);
    await redisClient.set(otpKey, otp, { EX: 300 });
    await redisClient.set(rateLimitKey, 1, { EX: 30 });
    const message = {
        to: "ashutoshvats1234@gmail.com",
        subject: "OTP for login",
        body: `Your OTP for login is ${otp}, It is valid for 5 min`
    };
    await publishToQueue("send_otp", message);
    console.log("OTP sent successfully", otp);
    res.status(200).json({ message: "OTP sent successfully" });
})

export const verifyUser = TryCatch(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "email and otp are required" });
    }
    const otpKey = `otp:${email}`
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp || storedOtp !== otp) {
        return res.status(400).json({ error: "invalid otp" });
    }
    await redisClient.del(otpKey);
    let user = await User.findOne({ email });

    if (!user) {
        const name = email.split("@")[0];
        user = await User.create({ name, email });
    }

    const token = generateToken(user);

    res.status(200).json({
        message: "User verified",
        user,
        token,
    });
})

export const myProfile = TryCatch(async (req, res) => {
    const user = req.user;
    res.status(200).json({ user });
});

export const updateName = TryCatch(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    user.name = req.body.name;
    await user.save();
    const token = generateToken(user);
    res.status(200).json({
        message: "Name updated successfully",
        user,
        token
    });
});

export const getAllUsers = TryCatch(async (req, res) => {
    const users = await User.find();
    res.status(200).json({ users });
});

export const getUser = TryCatch(async (rq, res) => {
    const user = await User.findById(rq.params.id);
    res.status(200).json({ user });
});