const express = require('express');
const { 
  getNotifications, 
  createNotification, 
  getNotificationsByEmail,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/getNotifications', authMiddleware, getNotifications);
router.post('/createNotification', authMiddleware, createNotification);
router.get('/user/:email', getNotificationsByEmail);
router.put('/:notificationId/read', markNotificationAsRead);
router.put('/mark-all-read', markAllNotificationsAsRead);
router.delete('/clear-all', clearAllNotifications);

module.exports = router;
