
const mongoose = require('mongoose');
const cron = require('node-cron');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

function getTodayDateStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function markAbsentees(session) {
  const date = getTodayDateStr();
  const users = await User.find({ isAdmin: { $ne: true } });
  const attendance = await Attendance.find({ date, session });
  const attendedUserIds = attendance.map(a => a.studentId.toString());
  for (const user of users) {
    if (!attendedUserIds.includes(user._id.toString())) {
      const alreadyAbsent = await Attendance.findOne({
        studentId: user._id,
        date,
        session,
        status: 'absent'
      });
      if (!alreadyAbsent) {
        await Attendance.create({
          studentId: user._id,
          date,
          session,
          status: 'absent',
          timestamp: Date.now(),
          latitude: 0,
          longitude: 0,
          imageUrl: null
        });
        console.log(`Marked absent: ${user.rollnumber} (${session})`);
      }
    }
  }
}


cron.schedule('1 12 * * *', async () => {
  console.log('Running absentee marking for morning session...');
  await markAbsentees('morning');
});
cron.schedule('1 16 * * *', async () => {
  console.log('Running absentee marking for evening session...');
  await markAbsentees('evening');
});

console.log('Attendance absentee cron jobs scheduled.');
