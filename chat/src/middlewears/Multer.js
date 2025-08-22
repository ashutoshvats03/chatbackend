import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudninary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "chat-images",
        allowedFormats: ["jpg", "png", "jpeg", "gif", "svg", "webp"],
        transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" }
        ]
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"), false);
        }
    },
});