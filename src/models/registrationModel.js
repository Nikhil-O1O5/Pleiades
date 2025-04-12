import mongoose from "mongoose";
import Event from "./eventModel.js";
import User from "./userModel.js";
import Team from "./teamModel.js";
import Payment from "./paymentModel.js";

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team'},
  type: { type: String, enum: ['individual', 'team'], required: true, default: 'individual' },
  status: { type: String, enum: ['registered', 'cancelled'], default: 'registered', required: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true},
  registrationDate: { type: Date, default: Date.now }
},
{
  timestamps: true
});


const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
