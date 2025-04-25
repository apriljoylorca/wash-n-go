import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors } from '../../constants/colors';

const DriverOrderCard = ({ order, onAccept, onUpdateStatus, onPress, showAccept, showStatusUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'approved':
        return Colors.info;
      case 'picked_up':
        return Colors.success;
      case 'washing':
        return Colors.purple;
      case 'drying_folding':
        return Colors.orange;
      case 'out_for_delivery':
        return Colors.teal;
      case 'delivered':
        return Colors.gray;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'schedule';
      case 'approved':
        return 'check-circle';
      case 'picked_up':
        return 'local-shipping';
      case 'washing':
        return 'local-laundry-service';
      case 'drying_folding':
        return 'dry';
      case 'out_for_delivery':
        return 'local-shipping';
      case 'delivered':
        return 'check-circle';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
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
        return status.replace('_', ' ').toUpperCase();
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Not set';
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const formatAddress = (address) => {
    if (!address) return 'Address not set';
    const { street, barangay, city, province } = address;
    return `${street}, ${barangay}, ${city}, ${province}`;
  };

  const formatServiceDetails = (items) => {
    if (!items || !Array.isArray(items)) return 'No service details';
    return items.map(item => {
      const weight = item.weight ? `${item.weight}kg` : '';
      const quantity = item.quantity ? `${item.quantity} pcs` : '';
      return `${item.serviceName} (${weight || quantity})`;
    }).join(', ');
  };

  const canAcceptOrder = () => {
    return (order.status === 'approved' || order.status === 'pending') && !order.driverId;
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'approved':
        return 'picked_up';
      case 'picked_up':
        return 'washing';
      case 'washing':
        return 'drying_folding';
      case 'drying_folding':
        return 'out_for_delivery';
      case 'out_for_delivery':
        return 'delivered';
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <MaterialIcons 
            name={getStatusIcon(order.status)} 
            size={20} 
            color={getStatusColor(order.status)}
          />
          <Text style={[styles.status, { color: getStatusColor(order.status) }]}>
            {getStatusText(order.status)}
          </Text>
        </View>
        <Text style={styles.time}>
          {formatDateTime(order.createdAt)}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <MaterialIcons name="person" size={18} color={Colors.textPrimary} style={styles.icon} />
          <Text style={styles.text}>
            {order.customerName || 'Customer Name'}
          </Text>
        </View>
        
        <View style={styles.row}>
          <MaterialIcons name="local-laundry-service" size={18} color={Colors.textPrimary} style={styles.icon} />
          <Text style={styles.text}>
            {formatServiceDetails(order.items)}
          </Text>
        </View>

        <View style={styles.row}>
          <MaterialIcons name="location-on" size={18} color={Colors.textPrimary} style={styles.icon} />
          <Text style={styles.text}>
            {formatAddress(order.pickupAddress)}
          </Text>
        </View>

        <View style={styles.row}>
          <MaterialIcons name="schedule" size={18} color={Colors.textPrimary} style={styles.icon} />
          <Text style={styles.text}>
            Pickup: {formatDateTime(order.pickupSchedule)}
          </Text>
        </View>

        <View style={styles.row}>
          <MaterialIcons name="attach-money" size={18} color={Colors.textPrimary} style={styles.icon} />
          <Text style={styles.text}>
            Total: ₱{order.total?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>

      {showAccept && canAcceptOrder() && (
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={onAccept}
        >
          <Text style={styles.acceptButtonText}>Accept Order</Text>
        </TouchableOpacity>
      )}

      {showStatusUpdate && (
        <View style={styles.statusUpdateContainer}>
          {getNextStatus(order.status) && (
            <TouchableOpacity 
              style={[styles.statusButton, { backgroundColor: Colors.primary }]}
              onPress={() => onUpdateStatus(getNextStatus(order.status))}
            >
              <Text style={styles.statusButtonText}>
                {getStatusText(getNextStatus(order.status))}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  content: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusUpdateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DriverOrderCard;