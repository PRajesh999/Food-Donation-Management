const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  donorName: { type: String, required: true },
  foodName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNo: { type: String, required: true },
  foodType: { type: String, required: true },
  foodImage: { type: String }, // <-- Added field for image URL
  quantity: { type: Number, required: true },
  locationName: { type: String, required: true },
  createdDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  claimedAt: { type: Date },
  status: { type: String, enum: ['available', 'claimed', 'completed'], default: 'available' },
  claimedBy: { type: String }, // user email or id
}, { timestamps: true });

module.exports = mongoose.model("Donation", donationSchema);
