import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useDarkMode } from '../../context/DarkModeContext';

const NotificationCard = ({ notification, style }) => {
const { theme } = useDarkMode();
  
  const getNotificationColor = () => {
    switch (notification.type) {
      case 'order_update':
        return Colors.primary;
      case 'promotion':
        return Colors.secondary;
      case 'system':
        return Colors.info;
      default:
        return theme.primaryColor;
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style, { borderLeftColor: getNotificationColor() }]}
      activeOpacity={0.8}
    >
                <Text style={[styles.title, { color: theme.textColor }]}>
            {notification.title}
          </Text>
                  <Text style={[styles.message, { color: theme.textColor }]}>
          {notification.message}
        </Text>
                  <Text style={[styles.time, { color: theme.textColor }]}>
            {format(new Date(notification.createdAt), 'MMM dd, yyyy - hh:mm a')}
          </Text>
        {!notification.read && (
        <View style={[styles.unreadBadge, { backgroundColor: getNotificationColor() }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
        padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    position: 'relative',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
        marginBottom: 5,
  },
  time: {
    fontSize: 12,
opacity: 0.7,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
position: 'absolute',
    top: 15,
    right: 15,
  },
});

export default NotificationCard;