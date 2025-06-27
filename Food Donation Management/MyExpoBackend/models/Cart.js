const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
  foodName: { type: String, required: true },
  foodType: { type: String, required: true },
  quantity: { type: Number, required: true },
  donorName: { type: String, required: true },
  locationName: { type: String, required: true },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User email
  items: [cartItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema); 