const Cart = require('../models/Cart');
const Donation = require('../models/Donation');
const { sendExpoPushNotification } = require('../utils/sendNotification');
const User = require('../models/User');
const haversine = require('haversine-distance'); // For distance calculation

// @desc    Get user's cart
// @route   GET /api/cart/:userId
// @access  Public
const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const decodedUserId = decodeURIComponent(userId);
    
    let cart = await Cart.findOne({ userId: decodedUserId });
    
    if (!cart) {
      cart = new Cart({ userId: decodedUserId, items: [] });
      await cart.save();
    }
    
    res.status(200).json(cart);
  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({ message: "Server error while fetching cart" });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Public
const addToCart = async (req, res) => {
  try {
    const { userId, donationId } = req.body;
    
    if (!userId || !donationId) {
      return res.status(400).json({ message: "User ID and donation ID are required" });
    }
    
    // Check if donation exists
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }
    
    // Check if donation is still available (not expired)
    if (new Date(donation.expiryDate) < new Date()) {
      return res.status(400).json({ message: "This donation has expired" });
    }
    
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.donationId.toString() === donationId);
    if (existingItem) {
      return res.status(400).json({ message: "Item already exists in cart" });
    }
    
    // Add item to cart
    cart.items.push({
      donationId,
      foodName: donation.foodName,
      foodType: donation.foodType,
      quantity: donation.quantity,
      donorName: donation.donorName,
      locationName: donation.locationName,
      coordinates: donation.coordinates,
    });
    
    cart.updatedAt = new Date();
    await cart.save();
    
    res.status(200).json({ message: "Item added to cart successfully", cart });
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ message: "Server error while adding to cart" });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Public
const removeFromCart = async (req, res) => {
  try {
    const { userId, donationId } = req.body;
    
    if (!userId || !donationId) {
      return res.status(400).json({ message: "User ID and donation ID are required" });
    }
    
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    cart.items = cart.items.filter(item => item.donationId.toString() !== donationId);
    cart.updatedAt = new Date();
    await cart.save();
    
    res.status(200).json({ message: "Item removed from cart successfully", cart });
  } catch (error) {
    console.error("Remove from Cart Error:", error);
    res.status(500).json({ message: "Server error while removing from cart" });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear/:userId
// @access  Public
const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const decodedUserId = decodeURIComponent(userId);
    
    const cart = await Cart.findOne({ userId: decodedUserId });
    
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
    
    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({ message: "Server error while clearing cart" });
  }
};

// @desc    Checkout cart
// @route   POST /api/cart/checkout
// @access  Public
const checkoutCart = async (req, res) => {
  try {
    const { userId, claims } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    if (!Array.isArray(claims) || claims.length === 0) {
      return res.status(400).json({ message: "Claims are required" });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    // Batch fetch all donations to be claimed
    const donationIds = claims.map(c => c.donationId);
    const donations = await Donation.find({ _id: { $in: donationIds } });
    const donationMap = {};
    donations.forEach(d => { donationMap[d._id.toString()] = d; });
    const toDelete = [];
    const toUpdate = [];
    for (const claim of claims) {
      const { donationId, servings } = claim;
      if (!donationId || !servings || servings < 1) continue;
      const donation = donationMap[donationId];
      if (!donation) {
        console.log(`[checkoutCart] Donation not found for donationId: ${donationId}`);
        continue;
      }
      donation.quantity = Math.max(0, donation.quantity - servings);
      if (donation.quantity === 0) {
        // Instead of deleting, mark as claimed and set claimedAt, status, claimedBy
        donation.status = 'claimed';
        donation.claimedAt = new Date();
        donation.claimedBy = userId;
        await donation.save();
        console.log(`[checkoutCart] Donation ${donationId} marked as claimed (quantity reached zero)`);

        // --- Push Notification Logic ---
        try {
          // Get donor and receiver user objects
          const donor = await User.findOne({ email: donation.email });
          const receiver = await User.findOne({ email: userId });
          if (donor && donor.fcmToken) {
            // Donor notification
            const donorMsg = `${receiver?.name || 'A user'} has claimed your donation. Be available to share the food.`;
            let donorBody = donorMsg;
            if (receiver && receiver.address) {
              donorBody += `\nReceiver is coming from: ${receiver.address}`;
            }
            await sendExpoPushNotification(
              donor.fcmToken,
              'Donation Claimed',
              donorBody,
              { type: 'donation_claimed', donationId: donation._id }
            );
          }
          if (receiver && receiver.fcmToken) {
            // Receiver notification
            let distanceStr = '';
            let mapUrl = '';
            if (donation.coordinates && receiver.address) {
              // For demo, just include coordinates; in real app, geocode receiver address
              mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${donation.coordinates.latitude},${donation.coordinates.longitude}`;
              if (receiver.coordinates && receiver.coordinates.latitude && receiver.coordinates.longitude) {
                const dist = haversine(
                  { latitude: receiver.coordinates.latitude, longitude: receiver.coordinates.longitude },
                  { latitude: donation.coordinates.latitude, longitude: donation.coordinates.longitude }
                );
                distanceStr = `\nDistance: ${(dist/1000).toFixed(2)} km`;
              }
            }
            const receiverBody = `You have claimed ${donation.donorName}'s donation.\n${mapUrl ? 'Donor location: ' + mapUrl : ''}${distanceStr}\nYou have 150 min to claim the donation.`;
            await sendExpoPushNotification(
              receiver.fcmToken,
              'Donation Claimed',
              receiverBody,
              { type: 'donation_claimed', donationId: donation._id, mapUrl }
            );
          }
        } catch (notifyErr) {
          console.error('Error sending push notifications:', notifyErr);
        }
        // --- End Push Notification Logic ---
      } else {
        toUpdate.push(donation);
        console.log(`[checkoutCart] Donation ${donationId} updated, new quantity: ${donation.quantity}`);
      }
    }
    // Batch update
    for (const d of toUpdate) {
      await d.save();
    }
    // Clear the cart
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
    // Optionally, return updated donations
    const updatedDonations = await Donation.find({});
    res.status(200).json({ 
      message: "Checkout successful! Donations updated.", 
      donations: updatedDonations,
      cart
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    res.status(500).json({ message: "Server error during checkout" });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  checkoutCart,
}; 