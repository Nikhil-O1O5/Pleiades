import express from "express"
import userAuth from "../middleware/userMiddleware.js";
import { signin, signup, logout, sendVerifyOtp, verifyEmail, isAuthenticated, sendPasswordResetOtp, resetPassword, getUserDetails } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/signin",signin);
userRouter.post("/signup",signup);
userRouter.post("/logout",logout);
userRouter.post("/verifyotp",sendVerifyOtp);
userRouter.post("/verifyaccount",verifyEmail);
userRouter.post("/isauthenticated",userAuth,isAuthenticated);
userRouter.post("/passwordresetotp",sendPasswordResetOtp);
userRouter.post("/resetPassword",resetPassword);
userRouter.get("/userDetails", userAuth, getUserDetails);
export default userRouter