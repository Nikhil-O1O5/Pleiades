import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../utils/nodemailer.js";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format (YYYY-MM-DD)" }), 
  phoneNo: z.string().regex(/^\d{10}$/, { message: "Phone number must be 10 digits" }),
  college : z.string().max(50,{message : "College name is required"})
});

const signinSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const signup = async (req, res) => {
  try {
    const parsedBody = signupSchema.parse(req.body);
    const { name, email, password, dob, phoneNo, college } = parsedBody;
    const user = await userModel.findOne({ email });
    if (user) {
      return res.status(401).json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const dobTimestamp = Math.floor(new Date(dob).getTime() / 1000);  
    await userModel.create({ name, email, password: hashedPassword, phoneNo, DOB: dobTimestamp, college });
    const mailOptions = {
      from: process.env.SENDER_EMAIL || "",
      to: email,
      subject: 'Welcome to Pleiades',
      text: `Welcome to Pleiades website. Your account has been created with email id ${email}`,
    };
    await transporter.sendMail(mailOptions);
    return res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error("Error in signup controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const signin = async (req, res) => {
  try {
    const parsedBody = signinSchema.parse(req.body);
    const { email, password } = parsedBody;
    const user = await userModel.findOne({ email });
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: "Invalid Password" });
    }
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user._id.toString() }, secret, { expiresIn: "30d" });
    return res.status(200).json({ success: true, message: "Logged in successfully", token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    console.error("Error in signin controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 0  
    });
    return res.status(200).json({ success: true, message: "Logged Out Successfully" });
  } catch (error) {
    console.error('Error in logout controller', error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
      const userId = req.userId; // Extract from middleware
      if (!userId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const user = await userModel.findById(userId);
      if (!user) {
          return res.status(404).json({ success: false, message: "User does not exist" });
      }

      if (user.isAccountVerified) {
          return res.status(400).json({ success: false, message: "User is already verified" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verifyOtp = otp;
      // console.log(`Generated OTP: ${user.verifyOtp}`);
      user.verifyOtpExpireAt = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      if (!process.env.SENDER_EMAIL) {
          console.error("SENDER_EMAIL is not defined");
          return res.status(500).json({ success: false, message: "Email sender not configured" });
      }

      const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: user.email,
          subject: "Account Verification OTP",
          text: `Your OTP is ${otp}. Verify your account using this OTP.`,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ success: true, message: "Verification OTP Sent On Email" });

  } catch (error) {
      console.error("Error in sendVerifyOtp controller:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  const userId = req.userId;
  const { otp } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID not provided" });
  }

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    if (user.isAccountVerified) {
      return res.status(400).json({ success: false, message: "User is already verified" });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res.status(200).json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    console.error('Error in verifyEmail controller:', error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const isAuthenticated = async(req, res) => {
  try {
      res.status(200).json({success : true,message: "User Authenticated"});
  } catch (error) {
      console.error('Error in isAuthenticated controller', error);
      res.status(500).json({success : false,message : "Internal Server Error"});
  }
}

export const sendPasswordResetOtp = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // OTP expires in 24 hours
    await user.save();

    if (!process.env.SENDER_EMAIL) {
      console.error("SENDER_EMAIL is not defined");
      return res.status(500).json({ success: false, message: "Email sender not configured" });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset OTP',
      text: `Your OTP is ${otp}. Reset Your Password using this OTP`,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Password Reset OTP Sent On Email" });
    
  } catch (error) {
    console.error("Error in ResetOtp controller", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const {email, otp, newPassword} = req.body;
  if(!email || !otp || !newPassword){
    res.status(400).json({success : false,message : "Email Otp and NewPassword all are required"});
    return;
  }
  try {
    const user = await userModel.findOne({email});
    if(!user){
      res.status(404).json({success : false,message : "User Not Found"});
      return;
    }   
    //verify otp
    const resetOtp = user.resetOtp;
    if(resetOtp === "" || otp !== resetOtp){
        res.status(400).json({success : false,message : "Invalid Otp"});
        return;
    }

    const resetOtpExpireAt = user.resetOtpExpireAt;

    if(resetOtpExpireAt < Date.now()){
        res.status(400).json({success : false,message :"Otp Expired"});
        return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    res.status(200).json({success : true,message : "Password has been reset successfully"});
  } catch (error) {
      console.error("Error in resetPassword controller", error);
      res.status(500).json({success : false,message : "Internal Server Error"});
  }
}