import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';

const OrderCard = ({ order, onPress, showStatus = true }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
        return '#2196f3';
      case 'picked_up':
        return '#4caf50';
      case 'washing':
        return '#9c27b0';
      case 'drying_folding':
        return '#ff5722';
      case 'out_for_delivery':
        return '#009688';
      case 'delivered':
        return '#607d8b';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'picked_up':
        return 'Picked Up';
      case 'washing':
        return 'Washing';
      case 'drying_folding':
        return 'Drying & Folding';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderItems = () => {
    if (!order.items) return null;
    
    return Object.keys(order.items).map((itemKey) => {
      const item = order.items[itemKey];
      return (
        <View key={itemKey} style={styles.itemContainer}>
          <Text style={styles.itemName}>{item.serviceName}</Text>
          <View style={styles.itemDetails}>
            {item.weight && (
              <Text style={styles.itemDetail}>Weight: {item.weight}kg</Text>
            )}
            {item.quantity && (
              <Text style={styles.itemDetail}>Quantity: {item.quantity}</Text>
            )}
            <Text style={styles.itemPrice}>₱{item.price.toFixed(2)}</Text>
          </View>
        </View>
      );
    });
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{order.id?.substring(0, 8)}</Text>
        {showStatus && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {renderItems()}
        
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <MaterialIcons name="schedule" size={16} color="#666" />
            <Text style={styles.dateText}>
              {format(new Date(order.createdAt), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
          <Text style={styles.totalPrice}>₱{order.total.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    marginTop: 10,
  },
  itemContainer: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetail: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e90ff',
  },
});

export default OrderCard;