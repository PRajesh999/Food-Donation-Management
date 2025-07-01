const admin = require("firebase-admin");
const User = require("../models/User");
const fetch = require('node-fetch');
const { initializeFirebase } = require("../config/firebase");

// Ensure Firebase is initialized
initializeFirebase();

/**
 * Send a push notification to a user by their userId (must have fcmToken in DB)
 */
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

/**
 * Send a push notification to any FCM token (direct FCM usage)
 * @param {string} fcmToken - The FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
const sendFCMNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data,
    };
    const response = await admin.messaging().send(message);
    console.log('✅ FCM notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    throw error;
  }
};

const sendExpoPushNotification = async (expoPushToken, title, body, data = {}) => {
  try {
    if (!expoPushToken) {
      console.error('❌ Expo push token is missing');
      return;
    }

    console.log(`📱 Sending Expo notification to token: ${expoPushToken.substring(0, 20)}...`);
    console.log(`📝 Title: ${title}`);
    console.log(`📝 Body: ${body}`);

    const payload = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        'Accept-encoding': 'gzip, deflate'
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📤 Expo API response:', result);

    if (result.data && result.data.status === 'ok') {
      console.log('✅ Expo notification sent successfully');
      return true;
    } else {
      console.error('❌ Expo notification error:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending Expo notification:', error);
    return false;
  }
};

module.exports = { sendPushNotification, sendExpoPushNotification, sendFCMNotification };
