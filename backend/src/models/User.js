const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollnumber: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // Not encrypted, per requirements
  roomno: { type: String, required: true },
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
