const User = require('../models/User');
const bcrypt = require("bcryptjs");

const nodemailer = require("nodemailer");

const verificationCodes = {};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserByEmail = async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

exports.updateFCMToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) return res.status(400).json({ success: false, message: "FCM Token is required" });

        const user = await User.findByIdAndUpdate(req.user._id, { fcmToken }, { new: true });
        res.status(200).json({ success: true, message: "FCM Token updated", user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateFCMTokenByEmail = async (req, res) => {
    try {
        const { email, fcmToken } = req.body;
        if (!email || !fcmToken) {
            return res.status(400).json({ 
                success: false, 
                message: "Email and FCM Token are required" 
            });
        }

        const user = await User.findOneAndUpdate(
            { email }, 
            { fcmToken }, 
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        res.status(200).json({ success: true, message: "FCM Token updated", user });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password, fcmToken } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Use bcrypt to compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Update FCM token if provided
        if (fcmToken) {
            user.fcmToken = fcmToken;
            await user.save();
        }

        res.status(200).json({ success: true, message: "Login successful", user });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.postUser = async (req, res) => {
    try {
        const {
            name, email, phone, address, dob,
            occupation, gender, password, confirmPassword, agreeTerms,
            fcmToken
        } = req.body;

        if (
            !name || !email || !phone || !address || !dob ||
            !occupation || !gender || !password || !confirmPassword ||
            agreeTerms === undefined
        ) {
            return res.status(400).json({ message: "All fields are required." });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered." });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name, email, phone, address, dob,
            occupation, gender, password: hashedPassword, agreeTerms,
            fcmToken
        });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: "Server error, please try again." });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-__v");
        res.status(200).json({ data: users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUserByEmail = async (req, res) => {
    const { email, profileImage } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required to update profile." });
    }

    try {
        const updatedFields = {
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address,
            dob: req.body.dob,
            occupation: req.body.occupation,
            gender: req.body.gender,
            profileImage: profileImage || undefined, // Only update if provided
        };

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: updatedFields },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ success: false, message: "Server error", error });
    }
};

exports.sendResetCode = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email not found" });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = code;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD, // App password
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: "Password Reset Code",
            text: `Your password reset code is: ${code}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Verification code sent" });

    } catch (error) {
        console.error("Email send error:", error);
        res.status(500).json({ message: "Failed to send code", error });
    }
};

exports.verifyResetCode = (req, res) => {
    const { email, code } = req.body;
    if (verificationCodes[email] === code) {
        return res.status(200).json({ message: "Code verified" });
    }
    res.status(400).json({ message: "Invalid or expired code" });
};

exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        delete verificationCodes[email];
        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update password", err });
    }
};

exports.deleteUser = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOneAndDelete({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete user", error });
    }
};