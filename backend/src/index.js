const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
// Serve uploaded attendance images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

connectDB();

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;


const User = require('./models/User');
async function ensureAdminUser() {
  const admin = await User.findOne({ rollnumber: 'admin' });
  if (!admin) {
    await User.create({
      name: 'Administrator',
      rollnumber: 'admin',
      email: 'admin@hostel.com',
      phone: '0000000000',
      password: 'admin123',
      roomno: 'A1',
      isAdmin: true
    });
    console.log('Hardcoded admin user created: rollnumber=admin, password=admin123');
  } else if (!admin.isAdmin) {
    admin.isAdmin = true;
    await admin.save();
    console.log('Existing user with rollnumber=admin promoted to admin');
  }
}

// --- Absentee Cron Logic Integration ---
const cron = require('node-cron');
const Attendance = require('./models/Attendance');

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

// Schedule jobs: 11:01 AM and 4:01 PM local server time
cron.schedule('1 11 * * *', async () => {
  console.log('Running absentee marking for morning session...');
  await markAbsentees('morning');
});
cron.schedule('1 16 * * *', async () => {
  console.log('Running absentee marking for evening session...');
  await markAbsentees('evening');
});
console.log('Attendance absentee cron jobs scheduled.');
// --- End Absentee Cron Logic Integration ---

app.listen(PORT, async () => {
  await ensureAdminUser();
  console.log(`Server running on port ${PORT}`);
});
