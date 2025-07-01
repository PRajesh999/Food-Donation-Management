const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fcmToken: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
