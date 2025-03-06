import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.error("Token not provided");
            return res.status(401).json({ success: false, message: "Token not provided" });
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT secret is not defined");
            return res.status(500).json({ success: false, message: "JWT secret is not defined" });
        }
        const decoded = jwt.verify(token, secret);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            console.error("User not found");
            return res.status(401).json({ success: false, message: "User authorization error" });
        }
        req.userId = user._id;
        next(); 
    } catch (error) {
        console.error("Error in UserAuth:", error);
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

export default userAuth;
