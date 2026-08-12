const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // e.g. '2025-05-13'
  timestamp: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, enum: ['present', 'absent', 'failed-location'], required: true },
  session: { type: String, enum: ['morning', 'evening'], required: true },
  imageUrl: { type: String } // Path to stored image
});

module.exports = mongoose.model('Attendance', attendanceSchema);
