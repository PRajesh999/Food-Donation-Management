const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationsByEmail,
} = require('../controllers/donationController');

router.post('/create-donations', createDonation);
router.get('/get-donations', getDonations);
router.get('/user/:email', getDonationsByEmail);

module.exports = router;
