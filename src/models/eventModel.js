import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  eventname: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  shortDescription: { type: String, required: true },
  price : { type: Number, required: true },
  organizerName: { type: String, required: true },
  organizerEmail: { type: String, required: true },
  organizerPhoneNo: { type: String, required: true },
  rules: [{ type: String, required: true }],
},
{
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
