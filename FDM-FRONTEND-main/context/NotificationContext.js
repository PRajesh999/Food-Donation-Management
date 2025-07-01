import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user?.email) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/user/${encodeURIComponent(user.email)}`);
      if (response.data.success) {
        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications);
        const unread = fetchedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const updatedNotifications = notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        email: user.email
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      await axios.put(`${API_BASE_URL}/notifications/mark-all-read`, {
        email: user.email
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user?.email]);

  const value = {
    unreadCount,
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 