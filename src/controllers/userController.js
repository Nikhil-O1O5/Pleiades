import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../utils/nodemailer.js";
import { z } from "zod";
import { generateQRCodeBase64 } from "../utils/qrcodeMaker.js";
import teamRegistrationModel from "../models/teamRegistrationModel.js";
import indRegistrationModel from "../models/indRegistrationModel.js";

const signupSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Invalid date format (YYYY-MM-DD)",
  }),
  phoneNo: z
    .string()
    .regex(/^\d{10}$/, { message: "Phone number must be 10 digits" }),
  college: z.string().max(50, { message: "College name is required" }),
  collegeSRN: z.string().min(1, { message: "College SRN is required" }),
});

const signinSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const signup = async (req, res) => {
  console.log(req.body);
  try {
    const parsedBody = signupSchema.parse(req.body);
    const { name, email, password, dob, phoneNo, college, collegeSRN } =
      parsedBody;

    const userExists = await userModel.findOne({ email });
    if (userExists) {
      return res
        .status(401)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const dobTimestamp = Math.floor(new Date(dob).getTime() / 1000);

    const lastUser = await userModel.findOne().sort({ registrationNumber: -1 });
    const registrationNumber = lastUser?.registrationNumber
      ? lastUser.registrationNumber + 1
      : 100000;

    const qrData = {
      name,
      college,
      collegeSRN,
      registrationNumber,
    };
    const userQrCode = await generateQRCodeBase64(qrData);

    await userModel.create({
      name,
      email,
      password: hashedPassword,
      phoneNo,
      DOB: dobTimestamp,
      college,
      collegeSRN,
      registrationNumber,
      userQrCode,
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL || "",
      to: email,
      subject: "Welcome to Pleiades",
      text: `Welcome to Pleiades website. Your account has been created with email id ${email}`,
    };
    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error.errors);
      return res
        .status(400)
        .json({ success: false, message: error.errors[0].message });
    }
    console.error("Error in signup controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const signin = async (req, res) => {
  try {
    console.log(req.body);
    const parsedBody = signinSchema.parse(req.body);
    const { email, password } = parsedBody;
    const user = await userModel.findOne({ email });
    if (!user || !user.password) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Password" });
    }
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user._id.toString() }, secret, {
      expiresIn: "30d",
    });
    console.log(token)
    return res
      .status(200)
      .json({ success: true, message: "Logged in successfully", token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error.errors);
      return res
        .status(400)
        .json({ success: false, message: error.errors[0].message });
    }
    console.error("Error in signin controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 0,
    });
    return res
      .status(200)
      .json({ success: true, message: "Logged Out Successfully" });
  } catch (error) {
    console.error("Error in logout controller", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("EMAIL : " , email)
    if (!email) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userModel.findOne({email});
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    if (user.isAccountVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyOtp = otp;
    // console.log(`Generated OTP: ${user.verifyOtp}`);
    user.verifyOtpExpireAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    if (!process.env.SENDER_EMAIL) {
      console.error("SENDER_EMAIL is not defined");
      return res
        .status(500)
        .json({ success: false, message: "Email sender not configured" });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      text: `Your OTP is ${otp}. Verify your account using this OTP.`,
    };

    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ success: true, message: "Verification OTP Sent On Email" });
  } catch (error) {
    console.error("Error in sendVerifyOtp controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {

  const {email, otp } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "User ID not provided" });
  }

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  try {
    const user = await userModel.findOne({email});
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exist" });
    }

    if (user.isAccountVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is already verified" });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpireAt < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpireAt = 0;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    console.error("Error in verifyEmail controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const isAuthenticated = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: "User Authenticated" });
  } catch (error) {
    console.error("Error in isAuthenticated controller", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const sendPasswordResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000; // OTP expires in 24 hours
    await user.save();

    if (!process.env.SENDER_EMAIL) {
      console.error("SENDER_EMAIL is not defined");
      return res
        .status(500)
        .json({ success: false, message: "Email sender not configured" });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. Reset Your Password using this OTP`,
    };

    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ success: true, message: "Password Reset OTP Sent On Email" });
  } catch (error) {
    console.error("Error in ResetOtp controller", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    res.status(400).json({
      success: false,
      message: "Email Otp and NewPassword all are required",
    });
    return;
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: "User Not Found" });
      return;
    }
    //verify otp
    const resetOtp = user.resetOtp;
    if (resetOtp === "" || otp !== resetOtp) {
      res.status(400).json({ success: false, message: "Invalid Otp" });
      return;
    }

    const resetOtpExpireAt = user.resetOtpExpireAt;

    if (resetOtpExpireAt < Date.now()) {
      res.status(400).json({ success: false, message: "Otp Expired" });
      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpireAt = 0;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword controller", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in getUserDetails controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

/*
form input deatils :

check if it is a team event or individual event
if it is an individual event we will be getting
event id
user id
name
email
phone number
if it is a team event from front end we will be getting
team name
numbers of members
event id
and for each member in the we will be getting
user id
name
email
phone number
if it is a team event
store the data sent from frontend to a collection named teamRegistrationModel.js
and send professional email saying that
this mail is sent because you had filled a form on registering the event
if you have paid even once a amount of 472.. you need not pay it again one time payment is enough
one of your teammate has registered for a event in pleiades so please register yourself first at (pleiades.com) and then make payment at (this link)
if it is a individual event
store the data sent from frontend to a collection named indRegistrationModel.js

and send email saying that

you have succesfully registered for the event but youre payment is pending .. so please pay at this link .. if alreay paid then donot pay again
*/

export const registerIndividualEvent = async (req, res) => {
  try {
    const { eventId, userId, name, email, phoneNumber } = req.body;

    if (!eventId || !userId || !name || !email || !phoneNumber) {
      return res.status(400).json({ success: false, message: "All fields are required for individual registration" });
    }

    // Store individual registration details
    await indRegistrationModel.create({
      eventId,
      userId,
      name,
      email,
      phoneNumber,
    });

    // Send email to the user
    const mailOptions = {
      from: process.env.SENDER_EMAIL || "",
      to: email,
      subject: "Event Registration Confirmation",
      text: `Hello ${name},\n\nYou have successfully registered for the event. However, your payment is pending. Please make the payment at (this link). If you have already paid, you do not need to pay again.\n\nThank you!`,
    };
    await transporter.sendMail(mailOptions);

    return res.status(201).json({ success: true, message: "Individual event registration successful" });
  } catch (error) {
    console.error("Error in registerIndividualEvent controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const registerTeamEvent = async (req, res) => {
  try {
    const { eventId, teamName, members } = req.body;

    if (!eventId || !teamName || !members || members.length === 0) {
      return res.status(400).json({ success: false, message: "All fields are required for team registration" });
    }

    await teamRegistrationModel.create({
      eventId,
      teamName,
      members,
    });

    for (const member of members) {
      const mailOptions = {
        from: process.env.SENDER_EMAIL || "",
        to: member.email,
        subject: "Event Registration Confirmation",
        text: `Hello ${member.name},\n\nThis email is sent because your team "${teamName}" has registered for an event in Pleiades. Please ensure you register yourself at (pleiades.com) and make the payment at (this link). If you have already paid the one-time fee of ₹472, you do not need to pay again.\n\nThank you!`,
      };
      await transporter.sendMail(mailOptions);
    }

    return res.status(201).json({ success: true, message: "Team event registration successful" });
  } catch (error) {
    console.error("Error in registerTeamEvent controller:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

