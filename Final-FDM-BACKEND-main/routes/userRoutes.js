const express = require('express');
const {
  getUsers,
  postUser,
  getUserByEmail,
  getUserById,
  updateUser,
  updateFCMToken,
  updateFCMTokenByEmail,
  updateUserByEmail,
  sendResetCode,
  verifyResetCode,
  resetPassword,
  loginUser,
  deleteUser
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { sendFCMNotification } = require('../utils/sendNotification');
const User = require('../models/User');

const router = express.Router();

router.get('/get-users', getUsers);
router.post('/signup', postUser);
router.post('/login', loginUser);
router.get('/get-user-by-email', getUserByEmail);
router.get('/get-usersid', getUserById);
router.put('/update-userid', updateUser);
router.post('/update-fcm-token', authMiddleware, updateFCMToken);
router.post('/update-fcm-token-by-email', updateFCMTokenByEmail);
router.put('/update-user-by-email', updateUserByEmail);

router.post("/forgot-password", sendResetCode);
router.post("/verify-code", verifyResetCode);
router.post("/reset-password", resetPassword);
router.post("/delete-account", deleteUser);

router.post('/test-notification', async (req, res) => {
  const { fcmToken, title, body } = req.body;
  if (!fcmToken) return res.status(400).json({ message: 'FCM token required' });
  try {
    await sendFCMNotification(fcmToken, title || 'Test', body || 'This is a test notification!');
    res.json({ message: 'Notification sent!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send notification', error: err.message });
  }
});

router.post('/test-notification-all', async (req, res) => {
  const { title, body } = req.body;
  try {
    const users = await User.find({ fcmToken: { $exists: true, $ne: null } });
    if (!users.length) return res.status(404).json({ message: 'No users with FCM tokens found' });
    let sent = 0, failed = 0;
    for (const user of users) {
      try {
        await sendFCMNotification(user.fcmToken, title || 'Test', body || 'This is a test notification!');
        sent++;
      } catch (err) {
        failed++;
      }
    }
    res.json({ message: `Notifications sent: ${sent}, failed: ${failed}` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send notifications', error: err.message });
  }
});

module.exports = router;
