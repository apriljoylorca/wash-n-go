import { database } from '../config/firebase';
import { ref, push, set, update, onValue, get, query, orderByChild, equalTo } from 'firebase/database';
import { handleFirebaseError } from '../utils/errorHandler';

const validateNotification = (notification) => {
  if (!notification.title || typeof notification.title !== 'string') {
    throw new Error('Notification title is required');
  }
  if (!notification.message || typeof notification.message !== 'string') {
    throw new Error('Notification message is required');
  }
  if (!['order_update', 'system', 'promo'].includes(notification.type)) {
    throw new Error('Invalid notification type');
  }
  if (notification.orderId && typeof notification.orderId !== 'string') {
    throw new Error('Invalid order ID');
  }
};

export const sendNotification = async (userId, notification, currentUser) => {
  try {
    // Check if user has permission to send notification
    if (currentUser.uid !== userId) {
      throw new Error('Unauthorized notification send');
    }

    validateNotification(notification);
    
    const notificationRef = push(ref(database, `notifications/${userId}`));
    const timestamp = Date.now();
    
    await set(notificationRef, {
      ...notification,
      isRead: false,
      createdAt: timestamp
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const listenForNotifications = (userId, currentUser, callback) => {
  // Check if user has permission to listen for notifications
  if (currentUser.uid !== userId) {
    throw new Error('Unauthorized notification access');
  }

  const notificationsRef = ref(database, `notifications/${userId}`);
  return onValue(notificationsRef, (snapshot) => {
    const notifications = [];
    snapshot.forEach((childSnapshot) => {
      notifications.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(notifications);
  });
};

export const markNotificationAsRead = async (userId, notificationId, currentUser) => {
  try {
    // Check if user has permission to mark notification as read
    if (currentUser.uid !== userId) {
      throw new Error('Unauthorized notification update');
    }

    await update(ref(database, `notifications/${userId}/${notificationId}`), {
      isRead: true,
      updatedAt: Date.now()
    });
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);
    const updates = {};
    snapshot.forEach((childSnapshot) => {
      updates[`${childSnapshot.key}/isRead`] = true;
    });
    await update(notificationsRef, updates);
  } catch (error) {
    throw handleFirebaseError(error);
  }
};

export const getUnreadNotifications = async (userId, currentUser) => {
  try {
    // Check if user has permission to read notifications
    if (currentUser.uid !== userId) {
      throw new Error('Unauthorized notification access');
    }

    const snapshot = await get(ref(database, `notifications/${userId}`));
    const notifications = [];
    
    snapshot.forEach((childSnapshot) => {
      const notification = childSnapshot.val();
      if (!notification.isRead) {
        notifications.push({
          id: childSnapshot.key,
          ...notification
        });
      }
    });
    
    return notifications;
  } catch (error) {
    throw handleFirebaseError(error);
  }
};