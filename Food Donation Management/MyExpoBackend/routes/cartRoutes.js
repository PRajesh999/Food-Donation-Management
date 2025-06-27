const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  checkoutCart,
} = require('../controllers/cartController');

// Get user's cart
router.get('/:userId', getCart);

// Add item to cart
router.post('/add', addToCart);

// Remove item from cart
router.delete('/remove', removeFromCart);

// Clear cart
router.delete('/clear/:userId', clearCart);

// Checkout cart
router.post('/checkout', checkoutCart);

module.exports = router; 