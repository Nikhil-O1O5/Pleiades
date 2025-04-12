import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  amount: { type: Number, required: true},
  status: { type: String, enum: ['initiated', 'successful', 'failed'], default: 'initiated', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true},
  paymentGatewayId: String, // Razorpay ID or UPI ref
  method: { type: String, enum: ['UPI', 'Card', 'NetBanking'], required: true },
  transactionId: String,
  paymentDate: { type: Date, default: Date.now },
}, 
{
  timestamps: true,
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment; 