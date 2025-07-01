import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import AppNavigator from "./navigation/AppNavigator";
// import { requestFCMPermission, getFCMToken, notificationListener } from './config/firebaseConfig';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from "./screens/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import Toast from "react-native-toast-message";
import MapPreloader from "./Components/MapPreloader";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function MainApp() {
  useEffect(() => {
    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap
      const { notification } = response;
      if (notification.request.content.data) {
        // Handle specific notification actions
        console.log('Notification data:', notification.request.content.data);
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <>
      <AppNavigator />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <NotificationProvider>
          <MainApp />
          <MapPreloader />
          </NotificationProvider>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
