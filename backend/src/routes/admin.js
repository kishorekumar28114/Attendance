const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.use((req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
});


router.get('/attendance', async (req, res) => {
  try {
    const query = {};
    if (req.query.date) query.date = req.query.date;
    if (req.query.session) query.session = req.query.session;

   
    if (req.query.date && req.query.session) {
    
      const users = await User.find({});
     
      const attendance = await Attendance.find({ date: req.query.date, session: req.query.session });
      const attendedUserIds = attendance.map(a => a.studentId.toString());
     
      for (const user of users) {
        if (user.isAdmin) continue; 
        if (!attendedUserIds.includes(user._id.toString())) {
      
          const alreadyAbsent = await Attendance.findOne({
            studentId: user._id,
            date: req.query.date,
            session: req.query.session,
            status: 'absent'
          });
          if (!alreadyAbsent) {
            await Attendance.create({
              studentId: user._id,
              date: req.query.date,
              session: req.query.session,
              status: 'absent',
              timestamp: new Date(`${req.query.date}T00:00:00Z`).getTime(),
              latitude: 0,
              longitude: 0,
              imageUrl: null
            });
          }
        }
      }
    }
  
    if (req.query.rollnumber) {
      const user = await User.findOne({ rollnumber: req.query.rollnumber });
      if (user) query.studentId = user._id;
    }
    if (req.query.status) query.status = req.query.status;
    const records = await Attendance.find(query).populate('studentId', 'name rollnumber roomno');
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.patch('/attendance/:id', async (req, res) => {
  try {
    const { status, session } = req.body;
    const update = {};
    if (status) update.status = status;
    if (session) update.session = session;
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('studentId', 'name rollnumber roomno');
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });
    res.json({ message: 'Attendance updated', record });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
