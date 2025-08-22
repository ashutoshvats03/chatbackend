import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // password: { type: String, required: true },
    // pic: {
    //   type: String,
    //   default:
    //     "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    // },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
