const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/sendNotification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ email: req.user.email });
        res.status(200).json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { email, fcmToken, title, message } = req.body;

        const notification = new Notification({ email, fcmToken, title, message });
        await notification.save();

        // Send Push Notification if fcmToken is provided
        if (fcmToken) {
            await sendPushNotification(fcmToken, title, message);
        }

        res.status(201).json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getNotificationsByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const notifications = await Notification.find({ email }).sort({ timestamp: -1 });
        res.status(200).json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const { email } = req.body;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, email },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.status(200).json({ success: true, notification });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await Notification.updateMany(
            { email, read: false },
            { read: true }
        );

        res.status(200).json({ 
            success: true, 
            message: `${result.modifiedCount} notifications marked as read` 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.clearAllNotifications = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await Notification.deleteMany({ email });

        res.status(200).json({ 
            success: true, 
            message: `${result.deletedCount} notifications cleared` 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
