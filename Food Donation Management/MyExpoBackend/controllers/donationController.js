const Donation = require('../models/Donation');

// @desc    Create a new donation
// @route   POST /api/donations/create-donations
// @access  Public
const createDonation = async (req, res) => {
  try {
    const {
      donorName,
      email,
      phoneNo,
      locationName,
      createdDate,
      coordinates,
      foodItems, // Array of { foodName, foodType, quantity, expiryDate }
    } = req.body;

    if (
      !donorName || !email || !phoneNo ||
      !locationName || !createdDate || !coordinates ||
      !Array.isArray(foodItems) || foodItems.length === 0
    ) {
      return res.status(400).json({ message: "All required fields must be filled, including at least one food item." });
    }

    // Validate each food item
    for (const item of foodItems) {
      if (
        !item.foodName || !item.foodType || !item.quantity || !item.expiryDate
      ) {
        return res.status(400).json({ message: "Each food item must have name, type, quantity, and expiry date." });
      }
    }

    // Create a donation entry for each food item
    const createdDonations = [];
    for (const item of foodItems) {
      const newDonation = new Donation({
        donorName,
        foodName: item.foodName,
        email,
        phoneNo,
        foodType: item.foodType,
        quantity: item.quantity,
        locationName,
        createdDate,
        expiryDate: item.expiryDate,
        coordinates,
      });
      await newDonation.save();
      createdDonations.push(newDonation);
    }

    res.status(201).json({ message: "Donations created successfully", donations: createdDonations });
  } catch (error) {
    console.error("Create Donation Error:", error);
    res.status(500).json({ message: "Server error while creating donation" });
  }
};

// @desc    Get all donations
// @route   GET /api/donations
// @access  Public
const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find();
    res.status(200).json({ success: true, count: donations.length, data: donations });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching donations", error: err.message });
  }
};

// @desc    Get donations by user email
// @route   GET /api/donations/user/:email
// @access  Public
const getDonationsByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const decodedEmail = decodeURIComponent(email);
    
    console.log("Searching for donations with email:", decodedEmail);

    // Use case-insensitive email matching
    const donations = await Donation.find({ 
      email: { $regex: new RegExp(decodedEmail, 'i') } 
    });

    console.log("Found donations count:", donations.length);
    console.log("Donations found:", donations.map(d => ({ id: d._id, email: d.email, foodName: d.foodName })));

    // Return empty array instead of 404 - this is more user-friendly
    res.status(200).json(donations || []);
  } catch (error) {
    console.error("Error fetching donations by email:", error);
    res.status(500).json({ message: "Server error while fetching donations" });
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonationsByEmail,
};
