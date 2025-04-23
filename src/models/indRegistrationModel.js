import mongoose from "mongoose";

const indRegistrationSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("IndRegistration", indRegistrationSchema);