import mongoose from "mongoose";

const teamRegistrationSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  teamName: {
    type: String,
    required: true,
  },
  members: [
    {
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
    },
  ],
}, { timestamps: true });

export default mongoose.model("TeamRegistration", teamRegistrationSchema);