const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  dob: { type: String, required: true },
  occupation: { type: String, required: true },
  gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  password: { type: String, required: true },
  agreeTerms: { type: Boolean, required: true },
  fcmToken: { type: String },
  profileImage: { type: String }, // ✅ NEW FIELD to store base64 image
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
