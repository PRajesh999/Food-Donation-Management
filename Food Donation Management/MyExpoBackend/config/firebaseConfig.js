// import messaging from '@react-native-firebase/messaging';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';

// // Request FCM Permissions
// export async function requestFCMPermission() {
//     const authStatus = await messaging().requestPermission();
//     return authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
// }

// // Get FCM Token
// export async function getFCMToken(userToken) {
//     const fcmToken = await messaging().getToken();
//     if (fcmToken) {
//         console.log("✅ FCM Token:", fcmToken);
//         await AsyncStorage.setItem("fcmToken", fcmToken);
        
//         // Send Token to Backend
//         await axios.post('https://your-backend.com/api/users/update-fcm-token', { fcmToken }, {
//             headers: { Authorization: `Bearer ${userToken}` }
//         });
//     }
// }

// // Handle Incoming Notifications
// export function notificationListener() {
//     messaging().onMessage(async remoteMessage => {
//         console.log("🔔 Notification Received:", remoteMessage.notification);
//     });

//     messaging().setBackgroundMessageHandler(async remoteMessage => {
//         console.log("🔔 Background Notification:", remoteMessage.notification);
//     });
// }
