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

module.exports = router;
