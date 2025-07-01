// routes/authRoutes.js
const express = require('express');
const { 
    register, 
    login, 
    verifyToken, 
    logout, 
    refreshToken 
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-token', verifyToken);
router.post('/logout', authMiddleware, logout);
router.post('/refresh-token', refreshToken);

module.exports = router;