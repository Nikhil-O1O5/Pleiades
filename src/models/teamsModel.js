import mongoose from 'mongoose';
import Event from './eventModel.js';
import User from './userModel.js';

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true},
  members: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['leader', 'member'],
        default: 'member',
      }
    }
  ]
});
const Team = mongoose.model('Team', teamSchema);
export default Team;