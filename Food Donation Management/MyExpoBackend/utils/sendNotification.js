const admin = require("firebase-admin");
const User = require("../models/User");
const fetch = require('node-fetch');

const sendPushNotification = async (userId, title, message) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) {
      console.error("❌ User not found or FCM token missing");
      return;
    }

    const payload = {
      notification: {
        title,
        body: message,
      },
      token: user.fcmToken,
    };

    await admin.messaging().send(payload);
    console.log("✅ Notification sent successfully");
  } catch (error) {
    console.error("❌ Error sending notification:", error);
  }
};

const sendExpoPushNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    const payload = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    };
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.data && result.data.status === 'ok') {
      console.log('✅ Expo notification sent successfully');
    } else {
      console.error('❌ Expo notification error:', result);
    }
  } catch (error) {
    console.error('❌ Error sending Expo notification:', error);
  }
};

module.exports = { sendPushNotification, sendExpoPushNotification };
