const express = require('express');
const multer = require('multer');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);


const HOSTEL_LAT = 10.827764;
const HOSTEL_LON = 77.060015;
const ALLOWED_RADIUS_METERS = 500;


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    // Get original extension or fallback to .jpg
    let ext = '.jpg';
    if (file.mimetype === 'image/png') ext = '.png';
    else if (file.mimetype === 'image/jpeg') ext = '.jpg';
    else if (file.mimetype === 'image/jpg') ext = '.jpg';
    // Use timestamp + random for filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png files allowed!'));
    }
  }
});


function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


function getSessionAndValidity(dateObj) {
  const hour = dateObj.getHours();
  if (hour >= 9 && hour < 11) return { session: 'morning', valid: true };
  if (hour >= 11 && hour < 16) return { session: 'evening', valid: true };
  return { session: null, valid: false };
}

router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { latitude, longitude, timestamp } = req.body;
    const rollnumber = req.user.rollnumber;
    // Check required fields
    if (!latitude || !longitude || !timestamp || !req.file) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const tsNum = Number(timestamp);
    if (isNaN(lat) || isNaN(lon) || isNaN(tsNum)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid latitude, longitude, or timestamp' });
    }
    const user = await User.findOne({ rollnumber });
    if (!user) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }


    const ts = new Date(tsNum);
    if (isNaN(ts.getTime())) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid timestamp' });
    }

    const dist = getDistanceMeters(lat, lon, HOSTEL_LAT, HOSTEL_LON);
    console.log(`User at (${lat}, ${lon}), hostel at (${HOSTEL_LAT}, ${HOSTEL_LON}), distance: ${dist} meters, allowed: ${ALLOWED_RADIUS_METERS}`);
    const inHostel = dist <= ALLOWED_RADIUS_METERS;

    const { session, valid } = getSessionAndValidity(ts);
    if (!valid) {
      const today = ts.toISOString().slice(0, 10);
      const count = await Attendance.countDocuments({ studentId: user._id, date: today, session: { $in: ['morning', 'evening'] } });
      if (count >= 3) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Max attempts reached for today' });
      }
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Attendance not in allowed time slot' });
    }

    const dateStr = ts.toISOString().slice(0, 10);
    const already = await Attendance.findOne({
      studentId: user._id,
      date: dateStr,
      session,
      status: { $in: ['present', 'absent'] }
    });
    if (already) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(409).json({ message: 'Attendance already marked for this session' });
    }


    if (!inHostel) {

      const failCount = await Attendance.countDocuments({
        studentId: user._id,
        date: dateStr,
        session,
        status: 'failed-location',
      });
      if (failCount < 2) {

        const failAttempt = new Attendance({
          studentId: user._id,
          date: dateStr,
          timestamp: tsNum,
          latitude: lat,
          longitude: lon,
          status: 'failed-location',
          session,
          imageUrl: req.file.filename,
        });
        await failAttempt.save();
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({
          message: `Location invalid. ${2 - failCount} attempt(s) remaining before marking absent.`,
          attemptsUsed: failCount + 1,
          maxAttempts: 3
        });
      } else {

        const attendance = new Attendance({
          studentId: user._id,
          date: dateStr,
          timestamp: tsNum,
          latitude: lat,
          longitude: lon,
          status: 'absent',
          session,
          imageUrl: req.file.filename,
        });
        await attendance.save();
        return res.json({ message: 'Attendance marked as absent (location invalid after 3 attempts)', attendance });
      }
    } else {

      const attendance = new Attendance({
        studentId: user._id,
        date: dateStr,
        timestamp: tsNum,
        latitude: lat,
        longitude: lon,
        status: 'present',
        session,
        imageUrl: req.file.filename,
      });
      await attendance.save();
      return res.json({ message: 'Attendance marked as present', attendance });
    }
  } catch (err) {

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.get('/history', async (req, res) => {
  try {
    const { rollnumber, studentId, date } = req.query;
    let userId = req.user.id;
    if (req.user.isAdmin) {
      if (studentId) {
        userId = studentId;
      } else if (rollnumber) {
        const user = await User.findOne({ rollnumber });
        if (!user) return res.status(404).json({ message: 'User not found' });
        userId = user._id;
      }
    }
    if (!userId) return res.status(400).json({ message: 'No user specified' });
    const query = { studentId: userId, status: { $in: ['present', 'absent'] } };
    if (date) query.date = date;
    const history = await Attendance.find(query).sort({ timestamp: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
