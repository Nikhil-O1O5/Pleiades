import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNo: { type: String, required: true, unique: true },
  DOB: { type: Number, required: true },
  password: { type: String, required: true },
  verifyOtp: { type: String, default: '' },
  verifyOtpExpireAt: { type: Number, default: 0 },
  isAccountVerified: { type: Boolean, default: false },
  resetOtp: { type: String, default: '' },
  resetOtpExpireAt: { type: Number, default: 0 },
  college: { type: String, required: true },
  collegeSRN: { type: String, required: true },
  registrationNumber: { type: Number, unique: true },
  userQrCode: { type: String, default: '' }, // base64 string
}, {
  timestamps: true
});


const User = mongoose.model("User", userSchema);
export default User;
