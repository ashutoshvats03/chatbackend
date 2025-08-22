import express from "express";
import { loginUser, verifyUser , myProfile, getAllUsers, getUser, updateName } from "../controllers/user.js";
import { isAuth } from "../middlewear/isAuth.js";

const router = express.Router();


router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.get("/myprofile", isAuth,myProfile);
router.get("/user/all", isAuth,getAllUsers);
router.get("/user/:id", isAuth,getUser);
router.post("/update/user",isAuth,updateName)
export default router;