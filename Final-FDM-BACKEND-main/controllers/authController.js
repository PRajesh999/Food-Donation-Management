// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, fcmToken } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if password is hashed (bcrypt hashes start with $2a$ or $2b$)
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        
        let isPasswordValid = false;
        
        if (isHashed) {
            // Compare with bcrypt for hashed passwords
            isPasswordValid = await bcrypt.compare(password, user.password);
        } else {
            // Direct comparison for plain text passwords (legacy)
            isPasswordValid = password === user.password;
            
            // If login is successful with plain text, hash the password for future use
            if (isPasswordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
                await user.save();
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Save/update FCM token if provided
        if (fcmToken) {
            user.fcmToken = fcmToken;
            await user.save();
        }

        // Generate JWT token with 2 days expiration
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email
            }, 
            config.JWT_SECRET, 
            { expiresIn: '2d' }
        );

        // Return user data without password and token
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            dob: user.dob,
            occupation: user.occupation,
            gender: user.gender,
            profileImage: user.profileImage,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.status(200).json({ 
            success: true,
            message: 'Login successful',
            user: userResponse,
            token: token,
            expiresIn: '2d'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.verifyToken = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Token is valid',
            user: user
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired',
                expired: true
            });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        console.error('Token verification error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

exports.logout = async (req, res) => {
    try {
        // In a more advanced implementation, you might want to blacklist the token
        // For now, we'll just return a success response
        // The client should remove the token from storage
        res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Generate new token with 2 days expiration
        const newToken = jwt.sign(
            { 
                userId: user._id,
                email: user.email
            }, 
            config.JWT_SECRET, 
            { expiresIn: '2d' }
        );

        res.status(200).json({ 
            success: true, 
            message: 'Token refreshed successfully',
            token: newToken,
            expiresIn: '2d'
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired',
                expired: true
            });
        }
        console.error('Token refresh error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};