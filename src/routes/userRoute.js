import express from "express"
import userAuth from "../middleware/userMiddleware.js";
import { signin, signup, logout, sendVerifyOtp, verifyEmail, isAuthenticated, sendPasswordResetOtp, resetPassword } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/signin",signin);
userRouter.post("/signup",signup);
userRouter.post("/logout",logout);
userRouter.post("/verifyotp",userAuth,sendVerifyOtp);
userRouter.post("/verifyaccount",userAuth,verifyEmail);
userRouter.post("/isauthenticated",userAuth,isAuthenticated);
userRouter.post("/passwordresetotp",sendPasswordResetOtp);
userRouter.post("/resetPassword",resetPassword);

userRouter.post("/registerEvent/:id", userAuth, registerEvent);

export default userRouter